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
