<template>
  <div class="video-uploader">
    <h2>Upload Video</h2>
    <input type="file" accept="video/*" @change="onFileChange" />
    <button @click="uploadVideo" :disabled="!videoFile">Upload Video</button>
    <button @click="extractPose" :disabled="!videoFile && !videoUrl">Extract Pose Landmarks</button>
    <button @click="showPose">Show Pose Data</button>

    <div>
      <button @click="showVideo">Show Video</button>
      <!-- Only show the video if it exists -->
      <!-- added ref to access the element for extraction -->
      <video ref="uploadedVideo" v-if="videoUrl" :src="videoUrl" controls width="480" class="mt-4"></video>
    </div>
  </div>
</template>

<script>
import '../styles/VideoUploader.css';

import { retrieveVideo, uploadVideo, addPosesToVideo } from '../services/manageVideosService';
import {
  extractLandmarksFromVideoElement,
  extractLandmarksFromVideoUrl,
  createBlobUrlFromRemote,
  extractRawLandmarksFromVideoElement,
  extractRawLandmarksFromVideoUrl
} from '@/services/poseBreakdownService';

// import drawing utils and connections for rendering
import { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';

export default {
  name: 'VideoUploader',
  data() {
    return {
      videoFile: null,
      poseData: null, // now holds raw per-frame landmarks (array of landmark arrays or null)
      uploadedVideoData: {},
      videoUrl: null,
      showPoseVisible: false, // toggles JSON view
      _overlayCanvas: null,
      _drawingUtils: null,
    };
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.videoFile = file;
      }
    },
    async uploadVideo() {
      if (this.videoFile) {
        try {
          this.uploadedVideoData = await uploadVideo("testOwner", "practice", this.videoFile);
          console.log("Uploaded video and received pose data:", this.uploadedVideoData);
          await this.showVideo();

        } catch (error) {
          console.error('Error extracting pose:', error);
        }
      }
    },
    async showVideo() {
      if (this.videoFile) {
        try {
          const remoteUrl = `http://localhost:8000/api/ManageVideo/${this.uploadedVideoData.video}`;
          // create same-origin blob URL to avoid cross-origin GPU errors
          this.videoUrl = await createBlobUrlFromRemote(remoteUrl);
        } catch (error) {
          console.error("Error retrieving video:", error);
        }
      }
    },
    // remember to revoke when you no longer need the blob (optionally)

    async extractPose() {
      try {
        // prefer the rendered video element (from showVideo)
        const videoEl = this.$refs.uploadedVideo;
        if (videoEl) {
          // extract raw per-frame landmarks
          const rawLandmarks = await extractRawLandmarksFromVideoElement(videoEl, 100);
          // keep local copy for rendering
          this.poseData = rawLandmarks;

          // if we have an uploaded video id, send poses to backend
          if (this.uploadedVideoData?.video) {
            const caller = 'testOwner'; // replace with actual user info
            const res = await addPosesToVideo(
              this.uploadedVideoData.video,
              rawLandmarks,
              caller,
            );
            if (res?.error) {
              console.error('addPosesToVideo error', res.error);
            } else {
              console.log('addPosesToVideo OK', res);
              // prefer server-normalized poseData if returned
              console.log('Server returned pose data:', res.poseData, typeof res.poseData);
              if (res.poseData) this.poseData = res.poseData;
            }
          }
        } else if (this.videoFile) {
          // fallback: create blob URL and extract directly from local file (raw)
          const blobUrl = URL.createObjectURL(this.videoFile);
          try {
            this.poseData = await extractRawLandmarksFromVideoUrl(blobUrl, 100);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        } else {
          console.warn('No video available to extract from.');
        }
      } catch (err) {
        console.error('Error extracting pose landmarks:', err);
      }
    },
    // Show / toggle the extracted pose data in-page and render overlay on the video
    // ...existing code...
    // remember to revoke when you no longer need the blob (optionally)
    beforeUnmount() {
      if (this.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(this.videoUrl);
      if (this._overlayCanvas) this._overlayCanvas.remove();
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._drawRaf) cancelAnimationFrame(this._drawRaf);
    },
    // Show / toggle the extracted pose data in-page and render overlay on the video

    async showPose() {
      // ensure we have pose frames (try retrieving if missing)
      if (!this.poseData && this.uploadedVideoData?.video) {
        try {
          const data = await retrieveVideo(this.uploadedVideoData.video, "testOwner");
          this.poseData = data?.poseLandmarks || data?.poseData || null;
        } catch (err) {
          console.warn('Failed to retrieve pose data from server', err);
        }
      }
      if (!this.poseData) {
        console.warn('No pose data available to show.');
        return;
      }

      // Determine timing metadata:
      // prefer explicit frame indices returned/stored with the pose upload
      const startFrame = (this.poseData?.startFrame ?? this.uploadedVideoData?.startFrame ?? null);
      const endFrame = (this.poseData?.endFrame ?? this.uploadedVideoData?.endFrame ?? null);

      // frameIntervalMs must match extraction; prefer provided metadata, fallback to 100ms
      const frameIntervalMs = 100
      // compute start time (ms) from startFrame if available, otherwise fallback to startMs fields
      const startMs = startFrame != null ? (startFrame * frameIntervalMs) : (this.poseData?.startMs ?? 0);
      const segmentLengthMs = (startFrame != null && endFrame != null)
        ? ((endFrame - startFrame + 1) * frameIntervalMs)
        : (this.poseData?.durationMs ?? (this.poseData?.length ? this.poseData.length * frameIntervalMs : null));

      // toggle visibility
      this.showPoseVisible = !this.showPoseVisible;
      if (!this.showPoseVisible) {
        if (this._overlayCanvas) { this._overlayCanvas.remove(); this._overlayCanvas = null; }
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
        if (this._drawRaf) { cancelAnimationFrame(this._drawRaf); this._drawRaf = null; }
        return;
      }

      const videoEl = this.$refs.uploadedVideo;
      if (!videoEl) return;

      // set video to aligned start time if within duration
      try {
        const t = Math.min(videoEl.duration, Math.max(0, startMs / 1000 || 0));
        videoEl.currentTime = t;
      } catch (e) {
        console.warn('Could not set video time to startMs', e);
      }

      // choose frames array (server or local)
      const frames = Array.isArray(this.poseData) ? this.poseData : (this.poseData?.poseData || this.poseData?.alignedA || this.poseData?.alignedB || []);
      const totalFrames = frames.length || Math.max(1, Math.floor((segmentLengthMs || (videoEl.duration * 1000)) / frameIntervalMs));

      // create and size overlay canvas (same logic as before)
      if (this._overlayCanvas) this._overlayCanvas.remove();
      const canvas = document.createElement('canvas');
      canvas.className = 'overlay-canvas';
      videoEl.parentNode.style.position = videoEl.parentNode.style.position || 'relative';
      videoEl.parentNode.appendChild(canvas);
      this._overlayCanvas = canvas;
      const ctx = canvas.getContext('2d');
      this._drawingUtils = new DrawingUtils(ctx);

      const resizeCanvas = () => {
        const vidRect = videoEl.getBoundingClientRect();
        const parentRect = videoEl.parentNode.getBoundingClientRect();
        const offsetLeft = Math.max(0, vidRect.left - parentRect.left);
        const offsetTop = Math.max(0, vidRect.top - parentRect.top);
        const w = Math.max(1, vidRect.width);
        const h = Math.max(1, vidRect.height);
        const ratio = window.devicePixelRatio || 1;
        canvas.style.left = `${offsetLeft}px`;
        canvas.style.top = `${offsetTop}px`;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      resizeCanvas();
      if (window.ResizeObserver) {
        this._resizeObserver = new ResizeObserver(resizeCanvas);
        this._resizeObserver.observe(videoEl);
        this._resizeObserver.observe(videoEl.parentNode);
      } else {
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('scroll', resizeCanvas, true);
        this._resizeObserver = { disconnect() { window.removeEventListener('resize', resizeCanvas); window.removeEventListener('scroll', resizeCanvas, true); } };
      }

      let lastFrameIndex = -1;
      const drawLoop = () => {
        if (!this.showPoseVisible || !this._overlayCanvas) return;

        // elapsed ms relative to aligned start
        const elapsedMs = Math.max(0, (videoEl.currentTime * 1000) - startMs);
        const frameIndex = Math.min(totalFrames - 1, Math.floor(elapsedMs / frameIntervalMs));

        if (frameIndex !== lastFrameIndex && frameIndex < totalFrames) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const lm = frames[frameIndex];
          if (lm) {
            this._drawingUtils.drawLandmarks(lm, { radius: 2, color: 'cyan' });
            this._drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: 'white', lineWidth: 1 });
          }
          lastFrameIndex = frameIndex;
        }

        this._drawRaf = requestAnimationFrame(drawLoop);
      };

      try { videoEl.currentTime = Math.max(0, startMs / 1000); await videoEl.play(); } catch (e) { console.warn('Autoplay blocked', e); }
      drawLoop();
    },

    // called by parent to provide aligned frames and timing metadata
    setAlignedPose(alignedFrames, startMs = 0, durationMs = null, frameIntervalMs = 100) {
      this.poseData = alignedFrames || null;
      this.alignedStartMs = startMs;
      this.alignedDurationMs = durationMs;
      this.alignedFrameIntervalMs = frameIntervalMs;
      console.log('setAlignedPose:', { startMs, durationMs, frameIntervalMs, frames: (alignedFrames || []).length });
    },
  }
};
</script>