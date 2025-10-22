export const uploadVideo = async (owner, videoType, file) => {
  console.log("uploadVideo called with:", { owner, videoType, file });
  const formData = new FormData();
  formData.append("owner", owner);
  formData.append("videoType", videoType);
  formData.append("file", file);

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  console.log("FormData prepared:", formData);
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

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  console.log("FormData prepared:", formData);
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding poses to video:", error);
    throw error;
  }
};

export const generateFeedback = async (
  referenceVideoId,
  practiceVideoId,
  referencePoseData,
  practicePoseData
) => {
  try {
    console.log("generateFeedback called with:", {
      referenceVideoId,
      practiceVideoId,
      referencePoseDataSample: referencePoseData[0],
      practicePoseDataSample: practicePoseData[0],
    });
    const formData = new FormData();
    formData.append("referenceVideo", referenceVideoId);
    formData.append("practiceVideo", practiceVideoId);
    formData.append("referencePoseData", JSON.stringify(referencePoseData));
    formData.append("practicePoseData", JSON.stringify(practicePoseData));

    // const body = {
    //   referenceVideo: referenceVideoId,
    //   practiceVideo: practiceVideoId,
    //   referencePoseData: referencePoseData[0], // must have a key
    //   practicePoseData: practicePoseData[0], // must have a key
    // };

    const response = await fetch("http://localhost:8000/api/Feedback/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to generate feedback: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("Feedback generation failed:", data.error);
      throw new Error(data.error);
    }

    console.log("Feedback generated:", data.feedback);
    return data;
  } catch (error) {
    console.error("Error in generateFeedback service:", error);
    throw error;
  }
};
