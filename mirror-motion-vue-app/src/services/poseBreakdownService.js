import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let poseLandmarker = null;

const KEYPOINTS = {
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
  for (const [name, idx] of Object.entries(KEYPOINTS)) {
    const p = landmarks[idx];
    out[name] = p ? { x: p.x, y: p.y, z: p.z } : null;
  }
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
 * Fetch a remote video URL and return a local blob: URL (caller should revoke when done).
 */
export async function createBlobUrlFromRemote(url) {
  const resp = await fetch(url, { mode: "cors" });
  if (!resp.ok) throw new Error(`Failed to fetch video (${resp.status})`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

/**
 * Extract landmarks from an HTMLVideoElement by seeking through frames.
 * Returns array of simplified pose objects (one per frame, null if none).
 */
export async function extractLandmarksFromVideoElement(
  videoEl,
  frameIntervalMs = 100,
  maxFrames = Infinity
) {
  await initPoseLandmarker();

  console.log("extractLandmarksFromVideoElement called");
  // ensure metadata
  if (videoEl.readyState < 1) {
    await new Promise((resolve) => {
      const onMeta = () => {
        videoEl.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      videoEl.addEventListener("loadedmetadata", onMeta);
    });
  }

  const durationMs = isFinite(videoEl.duration) ? videoEl.duration * 1000 : 0;
  const totalFrames = Math.min(
    Math.max(1, Math.floor(durationMs / frameIntervalMs)),
    maxFrames
  );

  const results = [];
  // note: using seek+seeked to sample frames reliably
  for (let i = 0; i < totalFrames; i++) {
    videoEl.currentTime = (i * frameIntervalMs) / 1000;
    await new Promise((resolve) => {
      const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked);
        resolve();
      };
      videoEl.addEventListener("seeked", onSeeked);
    });

    const res = await poseLandmarker.detectForVideo(videoEl, performance.now());
    // keep the simplified version for compatibility
    results.push(simplifyPose(res.landmarks?.[0] ?? null));
  }

  return results;
}

/**
 * Extract raw landmark arrays (one landmarks array per frame or null).
 * This is suitable for drawing with DrawingUtils (expects array-of-points).
 */
export async function extractRawLandmarksFromVideoElement(
  videoEl,
  frameIntervalMs = 100,
  maxFrames = Infinity,
  startTimeMs = 0,
  syncLenMs = null // only used if provided
) {
  await initPoseLandmarker();

  if (videoEl.readyState < 1) {
    await new Promise((resolve) => {
      const onMeta = () => {
        videoEl.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      videoEl.addEventListener("loadedmetadata", onMeta);
    });
  }

  const durationMs = isFinite(videoEl.duration) ? videoEl.duration * 1000 : 0;
  const usableDurationMs = Math.max(0, durationMs - startTimeMs);

  let totalFrames = Math.min(
    Math.max(1, Math.floor(durationMs / frameIntervalMs)),
    maxFrames
  );

  if (startTimeMs > 0) {
    const altFrames = Math.min(
      Math.max(0, Math.floor(usableDurationMs / frameIntervalMs)),
      maxFrames
    );
    if (altFrames === 0) return [];
    totalFrames = altFrames;
  }

  // If syncLenMs exists, adjust totalFrames accordingly
  if (syncLenMs != null) {
    const syncedFrames = Math.min(
      Math.floor(syncLenMs / frameIntervalMs),
      totalFrames
    );
    if (syncedFrames === 0) return [];
    totalFrames = syncedFrames;
  }

  const results = [];
  for (let i = 0; i < totalFrames; i++) {
    videoEl.currentTime = (startTimeMs + i * frameIntervalMs) / 1000;
    await new Promise((resolve) => {
      const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked);
        resolve();
      };
      videoEl.addEventListener("seeked", onSeeked);
    });

    const res = await poseLandmarker.detectForVideo(videoEl, performance.now());
    results.push(res.landmarks?.[0] ?? null);
  }

  return results;
}

/**
 * Extract landmarks from a video URL (creates a hidden video element).
 * This version fetches the remote URL as a blob first to avoid cross-origin WebGL errors.
 */
export async function extractLandmarksFromVideoUrl(
  url,
  frameIntervalMs = 100,
  maxFrames = Infinity
) {
  // fetch remote and create local blob URL so video is same-origin for WebGL
  const blobUrl = await createBlobUrlFromRemote(url);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.src = blobUrl;

  video.style.position = "fixed";
  video.style.left = "-9999px";
  document.body.appendChild(video);

  try {
    await new Promise((resolve, reject) => {
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      const onErr = (e) => {
        video.removeEventListener("error", onErr);
        reject(e);
      };
      video.addEventListener("loadedmetadata", onMeta);
      video.addEventListener("error", onErr);
    });

    const frames = await extractLandmarksFromVideoElement(
      video,
      frameIntervalMs,
      maxFrames
    );
    return frames;
  } finally {
    video.remove();
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * NEW: Extract raw landmarks from a remote URL (creates hidden video and returns raw per-frame landmarks).
 */
export async function extractRawLandmarksFromVideoUrl(
  url,
  frameIntervalMs = 100,
  maxFrames = Infinity
) {
  const blobUrl = await createBlobUrlFromRemote(url);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.src = blobUrl;

  video.style.position = "fixed";
  video.style.left = "-9999px";
  document.body.appendChild(video);

  try {
    await new Promise((resolve, reject) => {
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      const onErr = (e) => {
        video.removeEventListener("error", onErr);
        reject(e);
      };
      video.addEventListener("loadedmetadata", onMeta);
      video.addEventListener("error", onErr);
    });

    const frames = await extractRawLandmarksFromVideoElement(
      video,
      frameIntervalMs,
      maxFrames
    );
    return frames;
  } finally {
    video.remove();
    URL.revokeObjectURL(blobUrl);
  }
}
