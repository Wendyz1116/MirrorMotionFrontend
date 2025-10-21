export function readVideoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const videoUrl = URL.createObjectURL(new Blob([event.target.result]));
      resolve(videoUrl);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function extractFrames(videoElement, frameRate) {
  return new Promise((resolve) => {
    const frames = [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const duration = videoElement.duration;
    const totalFrames = Math.floor(duration * frameRate);

    videoElement.currentTime = 0;

    videoElement.addEventListener('seeked', function captureFrame() {
      if (frames.length < totalFrames) {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL());
        videoElement.currentTime += 1 / frameRate;
      } else {
        resolve(frames);
      }
    });
  });
}