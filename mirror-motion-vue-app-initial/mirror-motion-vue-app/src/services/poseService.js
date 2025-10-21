export const uploadVideo = async (videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    const response = await fetch('http://your-backend-api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload video');
    }
    const data = await response.json();
    return data.poseLandmarks; // Assuming the response contains pose landmarks
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const getPoseLandmarks = async (videoId) => {
  try {
    const response = await fetch(`http://your-backend-api/pose/${videoId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pose landmarks');
    }
    const data = await response.json();
    return data.poseLandmarks; // Assuming the response contains pose landmarks
  } catch (error) {
    console.error('Error fetching pose landmarks:', error);
    throw error;
  }
};