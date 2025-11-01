import {
  addPosesToVideo,
  getMatchingFrames,
  retrieveVideo,
  setMatchingFrames,
  storeFeedback,
} from "./manageVideosService";
import { extractRawLandmarksFromVideoUrl } from "./poseBreakdownService";

/** API to retrieve feedback
 * POST /api/Feedback/getFeedback
 *
 * @param {string} feedbackId - ID of the feedback to retrieve
 * @returns {object} - Feedback object with feedbackText and accuracyValue
 */
export const getFeedback = async (feedbackId) => {
  console.log("getFeedback called with:", { feedbackId });
  const formData = new FormData();
  formData.append("feedback", feedbackId);

  console.log("FormData prepared:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/Feedback/getFeedback",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  // console.log(response, response.error);
  if (data.error) {
    throw new Error(`Failed to retrieve feedback: ${response.error}`);
  }

  console.log("retrieve response:", data);
  return data;
};

/** API to find feedback for a reference video and practice video
 * POST /api/Feedback/findFeedback
 *
 * @param {string} referenceVideoId - ID of the reference video to find feedback for
 * @param {string} practiceVideoId - ID of the practice video to find feedback for
 * @returns {object} - Feedback object with the feedbackId
 */
export const findFeedback = async (referenceVideoId, practiceVideoId) => {
  console.log("findFeedback called with:", {
    referenceVideoId,
    practiceVideoId,
  });
  const formData = new FormData();
  formData.append("referenceVideoId", referenceVideoId);
  formData.append("practiceVideoId", practiceVideoId);

  console.log("FormData prepared:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/Feedback/findFeedback",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve feedback: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

/** Given a reference video and practice video, generate feedback */
export const generateFeedback = async (referenceVideo, practiceVideo) => {
  console.log("generateFeedback in feedback service called with:", {
    referenceVideo,
    practiceVideo,
  });

  let matchingFrames;

  // Use existing matching frames or compute new ones
  if (practiceVideo.matchingFrames) {
    console.log(
      "Using existing matching frames from practiceVideo:",
      practiceVideo.matchingFrames
    );
    matchingFrames = practiceVideo.matchingFrames;
  } else {
    // Get matching frames
    matchingFrames = await getMatchingFrames(referenceVideo, practiceVideo);

    // Save matching frames
    await setMatchingFrames(
      practiceVideo.videoId,
      matchingFrames.referenceStartFrame,
      matchingFrames.referenceEndFrame,
      matchingFrames.practiceStartFrame,
      matchingFrames.practiceEndFrame,
      "testOwner"
    );
  }

  // Destructure the frames after ensuring we have them
  const {
    referenceStartFrame,
    referenceEndFrame,
    practiceStartFrame,
    practiceEndFrame,
  } = matchingFrames;

  // TODO: may want to change to 100 so every s have 10 frames
  // Sample every 10ms
  // So every s has 100 frames
  // Sample every 100ms
  // So every s has 10 frames
  const frameIntervalMs = 100;

  // Get reference video poses
  let refPoseData;

  console.log("referenceVideo.poseData:", referenceVideo.poseData);
  if (referenceVideo.poseData && referenceVideo.poseData.length > 0) {
    // Only get the frames from referenceStartFrame to referenceEndFrame
    console.log("Using existing pose data from referenceVideo.");
    refPoseData = referenceVideo.poseData.slice(
      referenceStartFrame,
      referenceEndFrame + 1
    );
  } else {
    // If it doesn't exist, get all frames
    refPoseData = await extractRawLandmarksFromVideoUrl(
      referenceVideo.videoId,
      frameIntervalMs
    );

    console.log("Storing extracted pose data to referenceVideo.");
    // Store it in database
    await addPosesToVideo(referenceVideo.videoId, refPoseData, "testOwner");
  }

  console.log("refPoseData:", refPoseData);

  let pracPoseData;
  if (practiceVideo.poseData && practiceVideo.poseData.length > 0) {
    console.warn("Practice video already has pose data");
    pracPoseData = practiceVideo.poseData;
  } else {
    pracPoseData = await extractRawLandmarksFromVideoUrl(
      practiceVideo.videoId,
      frameIntervalMs,
      practiceStartFrame,
      practiceEndFrame
    );
    await addPosesToVideo(practiceVideo.videoId, pracPoseData, "testOwner");
  }
  // Get practice video poses
  // Assume we don't have it because if we do, we should have feedback already
  // const pracPoseData = await extractRawLandmarksFromVideoUrl(
  //   practiceVideo.videoId,
  //   frameIntervalMs,
  //   practiceStartFrame,
  //   practiceEndFrame
  // );
  // await addPosesToVideo(practiceVideo.videoId, pracPoseData, "testOwner");

  console.log("generateFeedback completed.");

  // Generate accuracy and feedback
  const feedback = await generateAccurcyAndComments(
    referenceVideo,
    practiceVideo,
    refPoseData,
    pracPoseData
  );
  console.log("Generated feedback:", feedback);

  await storeFeedback(practiceVideo.videoId, feedback.feedback, "testOwner");

  console.log("Feedback stored.");
  await retrieveVideo(practiceVideo.videoId, "testOwner");
  console.log(
    "Practice video retrieved after storing feedback.",
    practiceVideo
  );

  // Return complete feedback object
  return {
    feedbackId: feedback.feedback,
  };
};

const generateAccurcyAndComments = async (
  referenceVideo,
  practiceVideo,
  refPoseData,
  pracPoseData
) => {
  console.log("generateAccurcyAndComments called with:", {
    referenceVideo,
    practiceVideo,
    refPoseData,
    pracPoseData,
  });
  const formData = new FormData();
  formData.append("referenceVideoId", referenceVideo.videoId);
  formData.append("practiceVideoId", practiceVideo.videoId);
  formData.append("referencePoseData", JSON.stringify(refPoseData));
  formData.append("practicePoseData", JSON.stringify(pracPoseData));

  const response = await fetch("http://localhost:8000/api/Feedback/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze feedback: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};
