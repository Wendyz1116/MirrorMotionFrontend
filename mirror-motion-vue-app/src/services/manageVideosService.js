import { computeAudioOffset } from "@/services/compareVideosService";

const BASE_URL = "http://localhost:8000/api";

async function handleResponse(response, actionDescription) {
  if (!response.ok) {
    throw new Error(`Failed to ${actionDescription}: ${response.statusText}`);
  }
  return response.json();
}

// ---------------------- Upload & Retrieve ----------------------

export const uploadVideo = async (
  session,
  videoType,
  file,
  videoName,
  referenceVideoId
) => {
  const formData = new FormData();
  console.log("uploadVideo called with:", {
    session,
    videoType,
    file,
    videoName,
    referenceVideoId,
  });
  formData.append("session", session);
  formData.append("videoType", videoType);
  formData.append("file", file);
  formData.append("videoName", videoName);
  formData.append("referenceVideoId", referenceVideoId);

  const response = await fetch(`${BASE_URL}/ManageVideo/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await handleResponse(response, "upload video");
  return data;
};

/**
 * Fetch a remote video URL and return a local blob URL.
 * Caller should revoke the URL when done.
 */
export async function streamVideo(session, videoId) {
  const payload = { session: session, video: videoId };
  const resp = await fetch(`${BASE_URL}/ManageVideo/streamVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) throw new Error(`Failed to fetch video (${resp.status})`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

// ---------------------- Pose & Frame Management ----------------------
export const addPosesToVideo = async (session, videoId, poseData) => {
  try {
    const payload = { session, video: videoId, poseData };

    const response = await fetch(`${BASE_URL}/ManageVideo/addPosesToVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await handleResponse(response, "add poses to video");
  } catch (error) {
    console.error("Error adding poses to video:", error);
    throw error;
  }
};

export const setMatchingFrames = async (
  session,
  videoId,
  referenceStartFrame,
  referenceEndFrame,
  practiceStartFrame,
  practiceEndFrame
) => {
  console.log("setMatchingFrames called with:", {
    session,
    videoId,
    referenceStartFrame,
    referenceEndFrame,
    practiceStartFrame,
    practiceEndFrame,
  });

  const payload = {
    session,
    video: videoId,
    referenceStartFrame,
    referenceEndFrame,
    practiceStartFrame,
    practiceEndFrame,
  };

  console.log("Payload for setMatchingFrames:", payload);
  const response = await fetch(`${BASE_URL}/ManageVideo/setMatchingFrames`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await handleResponse(response, "set matching frames");
};

export const storeFeedback = async (session, videoId, feedbackId) => {
  const payload = { session, video: videoId, feedbackId };

  const response = await fetch(`${BASE_URL}/ManageVideo/storeFeedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await handleResponse(response, "store feedback");
};

// ---------------------- Query Functions ----------------------
export const retrieveVideo = async (session, videoId) => {
  const payload = { session, video: videoId };
  console.log("retrieveVideo called with payload:", payload);

  const response = await fetch(`${BASE_URL}/ManageVideo/_retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("retrieve response object:", response);

  const data = await handleResponse(response, "retrieve video");
  console.log("retrieveVideo response data:", data.result);

  return data.result;
};

export const getPracticeVideos = async (session, referenceVideoId) => {
  console.log("getPracticeVideos called with:", { referenceVideoId });
  const payload = { session, referenceVideoId };

  const response = await fetch(`${BASE_URL}/ManageVideo/_getPracticeVideos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(response, "get practice videos");
  console.log("retrieve response:", data.results);
  return data.results;
};

export const getAllReferenceVideos = async (session) => {
  console.log("getAllReferenceVideos called with:", { session });
  const payload = { session };

  const response = await fetch(
    `${BASE_URL}/ManageVideo/_getAllReferenceVideos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await handleResponse(response, "get all reference videos");
  console.log("retrieve response:", data.results);
  return data.results;
};

// ---------------------- Matching Frames ----------------------

export const getMatchingFrames = async (
  session,
  referenceVideo,
  practiceVideo
) => {
  try {
    console.log("getMatchingFrames called with:", {
      session,
      referenceVideo,
      practiceVideo,
    });

    const referenceVideoUrl = await streamVideo(session, referenceVideo._id);
    const practiceVideoUrl = await streamVideo(session, practiceVideo._id);

    const audioOffsetInfo2 = await computeAudioOffset(
      referenceVideoUrl,
      practiceVideoUrl
    );

    const {
      referenceStartFrame,
      referenceEndFrame,
      practiceStartFrame,
      practiceEndFrame,
    } = audioOffsetInfo2;

    console.log("Matching frames:", {
      referenceStartFrame,
      referenceEndFrame,
      practiceStartFrame,
      practiceEndFrame,
    });

    return {
      referenceStartFrame,
      referenceEndFrame,
      practiceStartFrame,
      practiceEndFrame,
    };
  } catch (error) {
    console.error("Error getting matching frames:", error);
  }
};
