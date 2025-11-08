import {
  addPosesToVideo,
  getMatchingFrames,
  retrieveVideo,
  setMatchingFrames,
  storeFeedback,
} from "./manageVideosService";
import { extractRawLandmarksFromVideoUrl } from "./poseBreakdownService";

const BASE_URL = "http://localhost:8000/api";

/** API to retrieve feedback
 * POST /api/Feedback/getFeedback
 *
 * @param {string} feedbackId - ID of the feedback to retrieve
 * @returns {object} - Feedback object with feedbackText and accuracyValue
 */
export const getFeedback = async (feedbackId) => {
  console.log("getFeedback called with:", { feedbackId });

  const payload = { feedback: feedbackId };

  const response = await fetch(`${BASE_URL}/Feedback/getFeedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Failed to retrieve feedback: ${data.error}`);
  }

  console.log("retrieve response:", data);
  return data;
};

/** API to find feedback for a reference video and practice video
 * POST /api/Feedback/findFeedback
 *
 * @param {string} referenceVideoId - ID of the reference video
 * @param {string} practiceVideoId - ID of the practice video
 * @returns {object} - Feedback object with the feedbackId
 */
export const findFeedback = async (referenceVideoId, practiceVideoId) => {
  console.log("findFeedback called with:", {
    referenceVideoId,
    practiceVideoId,
  });

  const payload = { referenceVideoId, practiceVideoId };

  const response = await fetch(`${BASE_URL}/Feedback/findFeedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve feedback: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

/** Given a reference video and practice video, generate feedback */
export const generateFeedback = async (
  session,
  referenceVideo,
  practiceVideo,
  userId
) => {
  console.log("generateFeedback in feedback service called with:", {
    session,
    referenceVideo,
    practiceVideo,
    userId,
  });

  let matchingFrames;

  // Use existing matching frames or compute new ones
  if (practiceVideo.matchingFrames) {
    console.log(
      "Using existing matching frames:",
      practiceVideo.matchingFrames
    );
    matchingFrames = practiceVideo.matchingFrames;
  } else {
    matchingFrames = await getMatchingFrames(
      session,
      referenceVideo,
      practiceVideo
    );

    await setMatchingFrames(
      session,
      practiceVideo._id,
      matchingFrames.referenceStartFrame,
      matchingFrames.referenceEndFrame,
      matchingFrames.practiceStartFrame,
      matchingFrames.practiceEndFrame
    );
  }

  const {
    referenceStartFrame,
    referenceEndFrame,
    practiceStartFrame,
    practiceEndFrame,
  } = matchingFrames;

  const frameIntervalMs = 100;

  // Get reference video poses
  let refPoseData;
  if (referenceVideo.poseData && referenceVideo.poseData.length > 0) {
    console.log("Using existing pose data from referenceVideo.");
    refPoseData = referenceVideo.poseData.slice(
      referenceStartFrame,
      referenceEndFrame + 1
    );
  } else {
    refPoseData = await extractRawLandmarksFromVideoUrl(
      session,
      referenceVideo._id,
      frameIntervalMs
    );
    await addPosesToVideo(session, referenceVideo._id, refPoseData);
  }

  console.log("Reference pose data length:", refPoseData.length);

  // Get practice video poses
  let pracPoseData;
  if (practiceVideo.poseData && practiceVideo.poseData.length > 0) {
    console.warn("Practice video already has pose data");
    pracPoseData = practiceVideo.poseData;
  } else {
    pracPoseData = await extractRawLandmarksFromVideoUrl(
      session,
      practiceVideo._id,
      frameIntervalMs,
      practiceStartFrame,
      practiceEndFrame
    );
    await addPosesToVideo(session, practiceVideo._id, pracPoseData);
  }

  // Generate accuracy and feedback
  const feedback = await generateAccurcyAndComments(
    referenceVideo,
    practiceVideo,
    refPoseData,
    pracPoseData
  );

  await storeFeedback(session, practiceVideo._id, feedback.feedback);
  await retrieveVideo(session, practiceVideo._id);

  return { feedbackId: feedback.feedback };
};

/**
 * Generates accuracy and feedback for a given practice video compared to a reference video.
 *
 * @param {Object} referenceVideo - Reference video object.
 * @param {Object} practiceVideo - Practice video object.
 * @param {Object[]} refPoseData - Reference video poses.
 * @param {Object[]} pracPoseData - Practice video poses.
 * @returns {Promise<Object>} - Object containing generated accuracy and feedback.
 */
const generateAccurcyAndComments = async (
  referenceVideo,
  practiceVideo,
  refPoseData,
  pracPoseData
) => {
  const payload = {
    referenceVideoId: referenceVideo.videoId,
    practiceVideoId: practiceVideo.videoId,
    referencePoseData: refPoseData,
    practicePoseData: pracPoseData,
  };

  const response = await fetch(`${BASE_URL}/Feedback/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze feedback: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};
