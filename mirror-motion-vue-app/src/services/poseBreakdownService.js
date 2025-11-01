import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let poseLandmarker = null;

export const KEY_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

function simplifyPose(landmarks) {
  if (!landmarks) return null;
  const out = {};
  for (const [name, idx] of Object.entries(KEY_LANDMARKS)) {
    const p = landmarks[idx];
    out[idx] = p ? { x: p.x, y: p.y, z: p.z } : null;
  }
  // console.log("simplified pose:", out);
  return out;
}

async function initPoseLandmarker() {
  if (poseLandmarker) return;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      // put model file in public/models/pose_landmarker_lite.task or adjust path
      modelAssetPath: "/models/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 2,
  });
}

/**
 * Fetch a remote video URL and return a local blob URL.
 * Caller should revoke the URL when done.
 */
export async function createBlobUrlFromRemote(currUrl) {
  const remoteUrl = `http://localhost:8000/api/ManageVideo/${currUrl}`;
  const resp = await fetch(remoteUrl, { mode: "cors" });
  if (!resp.ok) throw new Error(`Failed to fetch video (${resp.status})`);
  const blob = await resp.blob();
  // console.log("created blob url:", URL.createObjectURL(blob));
  return URL.createObjectURL(blob);
}

/**
 * Extract landmarks from a video element, sampling at specified intervals.
 * @param {HTMLVideoElement} video - Video element to process
 * @param {number} frameIntervalMs - Milliseconds between frames to sample
 * @param {number} startMs - Start time in milliseconds
 * @param {number} endMs - End time in milliseconds
 * @returns {Promise<Array>} Array of landmark arrays, one per sampled frame
 */
export async function extractRawLandmarksFromVideoElement(
  video,
  frameIntervalMs = 100,
  startMs = 0,
  endMs = Infinity
) {
  await initPoseLandmarker();
  if (!poseLandmarker) throw new Error("Failed to initialize pose landmarker");

  const frames = [];
  let currentMs = startMs;
  endMs = Math.min(endMs, video.duration * 1000);

  while (currentMs <= endMs) {
    // Seek to current time
    video.currentTime = currentMs / 1000;

    // Wait for frame to be ready
    await new Promise((resolve) => {
      const onSeek = () => {
        video.removeEventListener("seeked", onSeek);
        resolve();
      };
      video.addEventListener("seeked", onSeek);
    });

    // Detect poses in current frame
    const result = await poseLandmarker.detectForVideo(
      video,
      performance.now()
    );
    // keep the simplified version for compatibility
    frames.push(simplifyPose(result.landmarks?.[0] ?? null));
    currentMs += frameIntervalMs;
  }

  return frames;
}

/**
 * Extract raw landmarks from a remote URL (creates hidden video and returns raw per-frame landmarks).
 */

export async function extractRawLandmarksFromVideoUrl(
  url,
  frameIntervalMs = 100,
  startFrame = 0,
  endFrame = Infinity
) {
  console.log("extractRawLandmarksFromVideoUrl called with:", {
    url,
    frameIntervalMs,
    startFrame,
    endFrame,
  });

  const blobUrl = await createBlobUrlFromRemote(url);
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto"; // Force preload
  video.src = blobUrl;

  video.style.position = "fixed";
  video.style.left = "-9999px";
  document.body.appendChild(video);

  try {
    // Wait for BOTH metadata AND enough data to play
    await new Promise((resolve, reject) => {
      const onReady = () => {
        if (video.readyState >= 2) {
          // HAVE_CURRENT_DATA or better
          cleanup();
          resolve();
        }
      };
      const onErr = (e) => {
        cleanup();
        reject(new Error(`Failed to load video: ${e.message}`));
      };
      const cleanup = () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("error", onErr);
      };

      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("error", onErr);

      // Start loading
      video.load();
    });

    // Now we can safely access duration
    const startMs = startFrame * frameIntervalMs;
    console.log(
      "endFrame before adjustment:",
      endFrame,
      "video.duration (ms):",
      video.duration,
      video
    );
    const endMs = Math.min(
      endFrame * frameIntervalMs,
      Math.floor(video.duration * 1000)
    );

    // Try to start playback to ensure decoder is active
    try {
      await video.play();
    } catch (e) {
      console.warn("Autoplay blocked, proceeding anyway:", e);
    }

    // Extract landmarks
    const frames = await extractRawLandmarksFromVideoElement(
      video,
      frameIntervalMs,
      startMs,
      endMs
    );

    return frames;
  } finally {
    try {
      video.pause();
    } catch (e) {}
    video.remove();
    URL.revokeObjectURL(blobUrl);
  }
}
