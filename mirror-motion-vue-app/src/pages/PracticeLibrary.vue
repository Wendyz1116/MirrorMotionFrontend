<template>
    <div class="practice-library">
        <div class="columns">

            <!-- Reference Video Panel -->
            <section class="panel ref-panel">
                <h2>Reference Video</h2>
                <h3 class="meta" v-if="currentReferenceVideo">
                    {{ currentReferenceVideo.videoName }}
                </h3>
                <div class="video-wrap">
                    <video v-if="refBlobUrl" :src="refBlobUrl" controls crossorigin="anonymous" playsinline
                        preload="metadata" ref="refVideo"></video>
                    <div v-else class="placeholder">Loading reference video...</div>
                </div>
            </section>

            <!-- Practice Videos Panel -->
            <section class="panel practice-panel">
                <h2>Practice Videos</h2>

                <!-- When practice videos exist -->
                <div v-if="!loading && practiceVideos.length > 0" class="form-group">
                    <select id="practiceSelect" v-model.number="selectedPracticeIdx" @change="onPracticeChange">
                        <option v-for="(p, idx) in practiceVideos" :key="p._id" :value="idx">
                            {{ p.videoName || `Practice ${idx + 1}` }}
                        </option>
                    </select>
                    <p>Select a practice video</p>
                </div>

                <!-- When no practice videos are found -->
                <div v-else-if="!loading && practiceVideos.length === 0" class="empty">
                    <router-link to="/uploadVideo" class="nav-btn" :class="{ active: $route.path === '/uploadVideo' }">
                        Add Practice Video
                    </router-link>
                    <p>No practice videos found.</p>
                </div>

                <!-- Selected practice video display -->
                <div class="video-wrap">
                    <video v-show="!loading && practiceVideos.length > 0 && practiceVideoBlobUrls[selectedPracticeIdx]"
                        :src="practiceVideoBlobUrls[selectedPracticeIdx]" controls crossorigin="anonymous" playsinline
                        preload="metadata" ref="practVideo" style="display: none"></video>
                    <p v-show="(loading || !practiceVideoBlobUrls[selectedPracticeIdx]) && practiceVideos.length > 0"
                        class="placeholder">
                        Loading practice videos...
                    </p>
                </div>

            </section>

            <!-- Feedback Panel -->
            <section class="panel">
                <h2>General Feedback</h2>
                <GeneralFeedbackBox :practiceVideoId="practiceVideos[selectedPracticeIdx]?._id" />
                <div class="playback-controls">
                    <button @click="playBothVideos" :disabled="!canPlayBoth">
                        Play Synchronized
                    </button>
                    <button @click="stopBothVideos">Stop</button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import { getPracticeVideos, retrieveVideo, getMatchingFrames } from '@/services/manageVideosService';
import { createBlobUrlFromRemote } from '@/services/poseBreakdownService';
import GeneralFeedbackBox from '@/components/GeneralFeedbackBox.vue';
import { KEY_LANDMARKS } from '@/services/poseBreakdownService';

export default {
    name: 'PracticeLibrary',
    props: {
        referenceVideo: { type: Object, default: null },
        owner: { type: String, default: 'testOwner' },
    },
    components: { GeneralFeedbackBox },
    data() {
        return {
            currentReferenceVideo: null, // local reactive copy of referenceVideo
            practiceVideos: [],
            selectedPracticeIdx: 0, //TODO consider if ref vid have no practice vid
            practiceVideoBlobUrls: [],
            refBlobUrl: null,
            loading: false,
            error: null,
            _refInitialized: false,
            syncStartTimes: {
                reference: 0,
                practice: 0,
            },
            isPlaying: false,
            refCanvas: null,
            practCanvas: null,
            lastRefFrameIndex: -1,
            lastPracFrameIndex: -1

        };
    },
    computed: {
        refUrl() {
            if (!this.currentReferenceVideo) return null;
            return this.currentReferenceVideo.gcsUrl || this.refBlobUrl || null;
        },
        selectedPracticeUrl() {
            return this.selectedPractice?.localBlobUrl || this.selectedPractice?.gcsUrl || null;
        },
        canPlayBoth() {
            // Check each condition
            const conditions = {
                refBlobUrl: Boolean(this.refBlobUrl),
                practiceUrl: Boolean(this.practiceVideoBlobUrls[this.selectedPracticeIdx]),
                refVideo: Boolean(this.$refs.refVideo),
                practVideo: Boolean(this.$refs.practVideo),
                practiceVideosExist: this.practiceVideos.length > 0,
                notLoading: !this.loading,
                gotMatchingFrames: this.practiceVideos[this.selectedPracticeIdx]?.matchingFrames != null
            };

            return Object.values(conditions).every(condition => condition);
        }
    },
    watch: {
        referenceVideo: {
            immediate: true,
            handler(v) {
                if (!v) return;
                if (this._refInitialized && this.currentReferenceVideo?._id === v._id) return;
                this._refInitialized = true;
                this.currentReferenceVideo = v;
                this.loadReferenceBlobIfNeeded(this.currentReferenceVideo);
            },
        },
    },
    async mounted() {
        this.loading = true;
        if (this.currentReferenceVideo) return;

        // Try route query
        const refVideoId = this.$route?.query?.refId;
        if (refVideoId) {
            // Get reference video
            const refVideo = await retrieveVideo(refVideoId, this.owner);
            this.currentReferenceVideo = refVideo;
            this.refBlobUrl = await createBlobUrlFromRemote(refVideo.videoId);

            this._refInitialized = true
            await this.loadPracticeVideos();
            return;
        }

    },
    methods: {
        async loadPracticeVideos() {
            this.loading = true;
            try {
                this.practiceVideos = await getPracticeVideos(this.currentReferenceVideo.videoId);

                if (this.practiceVideos.length > 0) {
                    // Default to the first practice video
                    this.selectedPracticeIdx = 0;
                    for (const practiceVideo of this.practiceVideos) {
                        const blobUrl = await createBlobUrlFromRemote(practiceVideo._id);
                        this.practiceVideoBlobUrls.push(blobUrl);
                    }
                }
            } catch (error) {
                console.error("Failed to load practice videos:", error);
            } finally {
                this.loading = false;
            }
        },

        onPracticeChange() {
            console.log("Selected index:", this.selectedPracticeIdx);

        },

        // In methods section
        setupCanvas(videoElement, isRef = true) {
            // Remove existing canvas if any
            const oldCanvas = videoElement.parentNode.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();

            // Create new canvas
            const canvas = document.createElement('canvas');

            // Match video dimensions exactly
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            // Let CSS handle the positioning and scaling
            canvas.style.position = 'absolute';
            canvas.style.top = '50%';
            canvas.style.left = '50%';
            canvas.style.transform = 'translate(-50%, -50%)';
            canvas.style.maxWidth = '60%';
            canvas.style.maxHeight = '80%';
            canvas.style.pointerEvents = 'none';

            videoElement.parentNode.appendChild(canvas);

            // Store canvas reference
            if (isRef) {
                this.refCanvas = canvas;
            } else {
                this.practCanvas = canvas;
            }

            return canvas;
        },
        drawPoseFrame(video, canvas, poseData, frameIndex, isRef = true) {
            if (!canvas || !poseData || !poseData[frameIndex]) return;

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const pose = poseData[frameIndex];

            // Draw connections
            const connections = [
                [KEY_LANDMARKS.LEFT_SHOULDER, KEY_LANDMARKS.RIGHT_SHOULDER],
                [KEY_LANDMARKS.LEFT_SHOULDER, KEY_LANDMARKS.LEFT_ELBOW],
                [KEY_LANDMARKS.LEFT_ELBOW, KEY_LANDMARKS.LEFT_WRIST],
                [KEY_LANDMARKS.RIGHT_SHOULDER, KEY_LANDMARKS.RIGHT_ELBOW],
                [KEY_LANDMARKS.RIGHT_ELBOW, KEY_LANDMARKS.RIGHT_WRIST],
                [KEY_LANDMARKS.LEFT_SHOULDER, KEY_LANDMARKS.LEFT_HIP],
                [KEY_LANDMARKS.RIGHT_SHOULDER, KEY_LANDMARKS.RIGHT_HIP],
                [KEY_LANDMARKS.LEFT_HIP, KEY_LANDMARKS.RIGHT_HIP],
                [KEY_LANDMARKS.LEFT_HIP, KEY_LANDMARKS.LEFT_KNEE],
                [KEY_LANDMARKS.LEFT_KNEE, KEY_LANDMARKS.LEFT_ANKLE],
                [KEY_LANDMARKS.RIGHT_HIP, KEY_LANDMARKS.RIGHT_KNEE],
                [KEY_LANDMARKS.RIGHT_KNEE, KEY_LANDMARKS.RIGHT_ANKLE]
            ];

            // Set styles based on video type with thicker lines
            ctx.strokeStyle = isRef ? '#f471b5' : '#f471b5';
            ctx.lineWidth = 8;
            ctx.fillStyle = isRef ? '#8945c5' : '#3abdf8';

            // Scale and offset parameters
            const scale = 1.2;  // Scale up by 20%
            const offsetX = -70;  // Move left by 70 pixels
            const offsetY = -130;   // Move up by 130 pixels

            // Draw connections with thicker lines
            connections.forEach(([start, end]) => {
                const startPoint = pose[start];
                const endPoint = pose[end];
                if (startPoint && endPoint) {
                    ctx.beginPath();
                    // Scale up the coordinates slightly to make the pose larger
                    ctx.moveTo(
                        startPoint.x * canvas.width * scale + offsetX,
                        startPoint.y * canvas.height * scale + offsetY
                    );
                    ctx.lineTo(
                        endPoint.x * canvas.width * scale + offsetX,
                        endPoint.y * canvas.height * scale + offsetY
                    );
                    ctx.stroke();
                }
            });

            // Draw larger keypoints
            Object.values(pose).forEach(point => {
                if (point) {
                    ctx.shadowColor = isRef ? '#333' : '#333';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 3;
                    ctx.shadowOffsetY = 2;

                    ctx.beginPath();
                    ctx.arc(
                        point.x * canvas.width * scale + offsetX,
                        point.y * canvas.height * scale + offsetY,
                        12,  // Increased from 8
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                }
            });
        },

        async initializeSyncPoints() {
            if (!this.currentReferenceVideo || !this.practiceVideos[this.selectedPracticeIdx]) return;


            const matchingFrames = this.practiceVideos[this.selectedPracticeIdx].matchingFrames

            console.log('Matching frames:', matchingFrames);
            // Convert frame numbers to milliseconds (assuming 50ms per frame from audio analysis)
            const frameWindowMs = 100;
            this.syncStartTimes = {
                reference: matchingFrames.referenceStartFrame * frameWindowMs / 1000, // Convert to seconds
                practice: matchingFrames.practiceStartFrame * frameWindowMs / 1000
            };
        },


        async playBothVideos() {
            if (!this.canPlayBoth) return;

            await this.initializeSyncPoints();

            const refVideo = this.$refs.refVideo;
            const practVideo = this.$refs.practVideo;

            // Setup canvases
            const refCanvas = this.setupCanvas(refVideo, true);
            const practCanvas = this.setupCanvas(practVideo, false);

            // Reset frame indices
            this.lastRefFrameIndex = -1;
            this.lastPracFrameIndex = -1;

            // Set initial positions
            refVideo.currentTime = this.syncStartTimes.reference;
            practVideo.currentTime = this.syncStartTimes.practice;

            const frameInterval = 100; // 10fps, matching pose extraction rate
            const matchingFrames = this.practiceVideos[this.selectedPracticeIdx].matchingFrames;

            const animate = () => {
                if (!this.isPlaying) return;

                // Get current video times in milliseconds
                const refTimeMs = refVideo.currentTime * 1000;
                const pracTimeMs = practVideo.currentTime * 1000;

                // First convert to seconds relative to sync start
                const refFrameIndex = Math.floor(refTimeMs / 100) + 1;
                const pracRelativeSeconds = (pracTimeMs / 1000) - this.syncStartTimes.practice;

                // Convert to frame indices (10 frames per second)
                const pracFrameIndex = Math.floor(pracRelativeSeconds * 10) + 1;

                // Draw reference pose if frame changed
                if (refFrameIndex !== this.lastRefFrameIndex) {
                    this.drawPoseFrame(
                        refVideo,
                        refCanvas,
                        this.currentReferenceVideo.poseData,
                        refFrameIndex,
                        true
                    );
                    this.lastRefFrameIndex = refFrameIndex;
                }

                // Draw practice pose if frame changed
                if (pracFrameIndex !== this.lastPracFrameIndex) {
                    this.drawPoseFrame(
                        practVideo,
                        practCanvas,
                        this.practiceVideos[this.selectedPracticeIdx].poseData,
                        pracFrameIndex,
                        false
                    );
                    this.lastPracFrameIndex = pracFrameIndex;
                }

                requestAnimationFrame(animate);
            };

            // Start playback
            try {
                this.isPlaying = true;
                animate();
                await Promise.all([
                    refVideo.play(),
                    practVideo.play()
                ]);
            } catch (err) {
                console.error('Failed to start playback:', err);
            }
        },
        stopBothVideos() {
            const refVideo = this.$refs.refVideo;
            const practVideo = this.$refs.practVideo;

            refVideo?.pause();
            practVideo?.pause();
            this.isPlaying = false;
            if (this.refCanvas) {
                const ctx = this.refCanvas.getContext('2d');
                // ctx.clearRect(0, 0, this.refCanvas.width, this.refCanvas.height);
            }
            if (this.practCanvas) {
                const ctx = this.practCanvas.getContext('2d');
                // ctx.clearRect(0, 0, this.practCanvas.width, this.practCanvas.height);
            }
        },



    },
    beforeUnmount() {
        for (const url of this.practiceVideoBlobUrls) URL.revokeObjectURL(url);
        if (this.refBlobUrl) URL.revokeObjectURL(this.refBlobUrl);
        this.practiceVideoBlobUrls = [];
        this.refBlobUrl = null;
    },
};
</script>

<style scoped>
.practice-library {
    margin: 0 auto;
    padding: 0px;
    width: 100%;
    display: flex;
    flex-direction: row;
    /* gap: 12px; */
    /* height: 100%; */
}

.columns {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: nowrap;
    align-items: start;
    width: 100%;
    height: 100%;
    max-height: 100%;
}

.panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 10px;
    padding: 10px;
    border-radius: 6px;
    width: 100%;
    max-height: 100%;
    flex: 1;
    text-align: center;

}

/* Explicit widths for each column */
.ref-panel,
.practice-panel {
    flex: 5
}

.panel:last-child {
    flex: 3
}

.ref-panel h3,
.practice-panel h3 {
    color: #333;
}


.video-wrap {
    position: relative;
    /* Important for absolute positioning of canvas */
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    width: 100%;
    height: auto;
    box-sizing: border-box;
    padding: 6px;
    border-radius: 13px;
}

.video-wrap video {
    position: relative;
    /* Keep video in normal flow */
    height: auto;
    width: auto;
    max-height: 80%;
    max-width: 60%;
    object-fit: contain;
    display: block;
    box-sizing: border-box;
}

/* Add new styles for canvas positioning */
.video-wrap canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto !important;
    /* Override inline styles */
    height: auto !important;
    max-height: 80%;
    max-width: 60%;
    pointer-events: none;
}

/* Text styles */

h2 {
    font-size: 22px;
}

h3,
#practiceSelect {
    font-size: 15px;
    padding: 5px;
    font-weight: bold;
}

#practiceSelect {
    appearance: none;
    padding: 5px;
    text-align: center;
    border-radius: 5px;
}

#practiceSelect:hover,
#practiceSelect:focus {
    border: 1px solid #3abdf8;
}
.form-group {
    display: flex;
    justify-content: center;
    flex-direction: column;
}

.ref-panel h3 {
    padding-bottom: 22px;
}

p {
    font-size: 13px;
    color: #333;
}

.form-group p {
    padding: 3px;
}

.empty p {
    padding: 10px 0;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.nav-btn {
    display: inline-block;
    background-color: #aed3e4;
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 15px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.2s ease;
}

.nav-btn:hover {
    background-color: #3abdf8;
}

/* placeholder matches aspect ratio so size doesn't change when media loads */
.placeholder {
    color: #888;
    padding: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 13px;
}


.playback-controls {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin: 10px 0;
}

.playback-controls button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background-color: #a657deff;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

.playback-controls button:disabled {
    /* opacity: 0.5; */
    cursor: not-allowed;
    background-color: #ccc;
    border-width: 1px solid #333;
}

.playback-controls button:not(:disabled):hover {
    background-color: #8945c5;
}
</style>
