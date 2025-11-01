import { computeAudioOffset } from "@/services/compareVideosService";
import { createBlobUrlFromRemote } from "./poseBreakdownService";

export const uploadVideo = async (
  owner,
  videoType,
  file,
  videoName,
  referenceVideoId
) => {
  console.log("uploadVideo called with:", {
    owner,
    videoType,
    file,
    videoName,
    referenceVideoId,
  });
  const formData = new FormData();
  formData.append("owner", owner);
  formData.append("videoType", videoType);
  formData.append("file", file);
  formData.append("videoName", videoName);
  formData.append("referenceVideoId", referenceVideoId);

  console.log("FormData prepared:");

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch("http://localhost:8000/api/ManageVideo/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload video: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Upload response:", data);
  return data;
};

export const retrieveVideo = async (videoId, owner) => {
  console.log("retrieveVideo called with:", { videoId, owner });
  const formData = new FormData();
  formData.append("video", videoId);
  formData.append("caller", owner);

  console.log("FormData prepared:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/retrieve",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve video: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

export const getPoseLandmarks = async (videoFile) => {
  try {
    const formData = new FormData();
    if (videoFile instanceof File) {
      formData.append("video", videoFile);
    } else {
      formData.append("videoUrl", videoFile);
    }

    const response = await fetch(
      `http://localhost:8000/api/PoseBreakdown/extractPoses`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pose landmarks");
    }

    const data = await response.json();
    return data.poseLandmarks; // should match what backend returns
  } catch (error) {
    console.error("Error fetching pose landmarks:", error);
    throw error;
  }
};

export const addPosesToVideo = async (
  videoId,
  poseData,
  caller,
  startFrame = null,
  endFrame = null
) => {
  try {
    console.log("addPosesToVideo called with:", {
      videoId,
      caller,
      poseData,
      startFrame,
      endFrame,
    });

    const formData = new FormData();
    formData.append("video", videoId);
    formData.append("poseData", JSON.stringify(poseData));
    formData.append("caller", caller);

    // Only append start/end if they are provided (not null/undefined)
    if (startFrame !== null && startFrame !== undefined) {
      formData.append("startFrame", startFrame.toString());
    }
    if (endFrame !== null && endFrame !== undefined) {
      formData.append("endFrame", endFrame.toString());
    }

    console.log(
      "FormData prepared with optional frames:",
      Array.from(formData.entries())
    );

    const response = await fetch(
      `http://localhost:8000/api/ManageVideo/addPosesToVideo`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to add poses to video (status: ${response.status})`
      );
    }
  } catch (error) {
    console.error("Error adding poses to video:", error);
    throw error;
  }
};

export const setMatchingFrames = async (
  videoId,
  referenceStartFrame,
  referenceEndFrame,
  practiceStartFrame,
  practiceEndFrame,
  caller
) => {
  console.log("setMatchingFrames called with:", {
    videoId,
    referenceStartFrame,
    referenceEndFrame,
    practiceStartFrame,
    practiceEndFrame,
    caller,
  });
  const formData = new FormData();
  formData.append("video", videoId);
  formData.append("referenceStartFrame", referenceStartFrame);
  formData.append("referenceEndFrame", referenceEndFrame);
  formData.append("practiceStartFrame", practiceStartFrame);
  formData.append("practiceEndFrame", practiceEndFrame);
  formData.append("caller", caller);

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/setMatchingFrames",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to set matching frames: ${response.statusText}`);
  }
};

export const storeFeedback = async (videoId, feedbackId, caller) => {
  const formData = new FormData();
  formData.append("video", videoId);
  formData.append("feedbackId", feedbackId);
  formData.append("caller", caller);

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/storeFeedback",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to store feedback: ${response.statusText}`);
  }
};

// Query functions
export const getOwnedVideos = async (owner) => {
  console.log("getOwnedVideos called with:", { owner });
  const formData = new FormData();
  formData.append("owner", owner);

  console.log("FormData prepared:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/getOwnedVideos",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve video: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

export const getPracticeVideos = async (referenceVideoId) => {
  console.log("getPracticeVideos called with:", { referenceVideoId });
  const formData = new FormData();
  formData.append("referenceVideoId", referenceVideoId);

  console.log("FormData prepared:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/getPracticeVideos",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve video: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

export const getAllReferenceVideos = async (caller) => {
  console.log("getAllReferenceVideos called with:", { caller });
  const formData = new FormData();
  formData.append("caller", caller);

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await fetch(
    "http://localhost:8000/api/ManageVideo/getAllReferenceVideos",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve video: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("retrieve response:", data);
  return data;
};

/**
 * Action: Given a reference video and a practice video, return the matching start and end frames.
 * @param referenceVideo - The reference video element.
 * @param practiceVideo - The practice video element.
 * @returns A MatchingFrames object containing the matching start and end frames.
 */
export const getMatchingFrames = async (referenceVideo, practiceVideo) => {
  try {
    console.log("getMatchingFrames called with:", {
      referenceVideo,
      practiceVideo,
    });

    const referenceVideoUrl = await createBlobUrlFromRemote(
      referenceVideo.videoId
    );
    const practiceVideoUrl = await createBlobUrlFromRemote(
      practiceVideo.videoId
    );

    // Compute the audio offset and
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
