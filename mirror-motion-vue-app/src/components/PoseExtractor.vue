<template>
    <div class="pose-extractor">
        <div ref="demos" class="demos invisible">
            <h2>MediaPipe Pose Extractor (Demo)</h2>
            <div ref="imageGrid" class="image-grid">
                <!-- <div class="testImage detectOnClick">
                    <img src="../../public/testPoseImgs/poseTest1.png" crossorigin="anonymous"
                        title="Click to simulate `extractPoses` for this image" />
                    <p>Test case: image with multiple poses</p>
                </div> -->
                <div class="testVideo detectOnClick">
                    <video src="../../public/testVideos/testVideo1.mp4" crossorigin="anonymous" title="video"
                        controls></video>
                    <p>Test case: image with single pose</p>
                    <!-- put <div class="detectOnClick"><img src="..." /></div> items here or render dynamically -->
                </div>
            </div>

            <div class="controls">
                <button @click="extractAllLandmarks" class="btn">Extract All Landmarks</button>
                <button @click="renderLandmarksOnVideo" class="btn">Render Landmarks</button>

                <div ref="testResults" class="results-box">Results will appear here</div>
                <div ref="extractedPosesList" class="extracted-list">No poses extracted yet.</div>
            </div>

        </div>
    </div>

</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

export default {
    name: 'PoseExtractor',
    setup() {
        const demos = ref(null);
        const testResults = ref(null);
        const extractedPosesList = ref(null);
        const imageGrid = ref(null);
        let poseLandmarker = null;
        const extractedLandmarks = reactive([]); // store array of frame results
        let videoElement = null;
        let canvas = null, ctx = null, drawingUtils = null;

        const keypoints = {
            NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
            LEFT_ELBOW: 13, RIGHT_ELBOW: 14, LEFT_WRIST: 15, RIGHT_WRIST: 16,
            LEFT_HIP: 23, RIGHT_HIP: 24, LEFT_KNEE: 25, RIGHT_KNEE: 26,
            LEFT_ANKLE: 27, RIGHT_ANKLE: 28
        };

        function logResult(type, label, data) {
            let out = `[${type}] ${label}\n\n${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}\n\n`;
            console.log(type, label, data);
            if (testResults.value) testResults.value.textContent = out + testResults.value.textContent;
        }

        async function createPoseLandmarker() {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
            );
            poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: '/models/pose_landmarker_lite.task',
                    delegate: 'GPU'
                },
                runningMode: "VIDEO",
            });
            demos.value?.classList.remove('invisible');
            logResult('STATUS', 'PoseLandmarker Loaded ✅', 'Ready to detect poses.');
        }

        // 🧩 Phase 1 — Extract all landmarks for each frame
        async function extractAllLandmarks() {
            const video = imageGrid.value.querySelector('video');
            if (!video || !poseLandmarker) {
                logResult('ERROR', 'Missing', 'No video or poseLandmarker found.');
                return;
            }

            extractedLandmarks.length = 0; // clear previous results
            videoElement = video;

            logResult('STATUS', 'Extracting Landmarks...', 'Processing all frames.');

            // Ensure video is loaded and ready
            await video.play();
            video.pause();

            const frameInterval = 100; // ms between frames (~10 fps)
            const totalFrames = Math.floor(video.duration * 1000 / frameInterval);

            for (let i = 0; i < totalFrames; i++) {
                video.currentTime = i * frameInterval / 1000;
                await new Promise(r => video.onseeked = r);

                const res = await poseLandmarker.detectForVideo(video, performance.now());
                extractedLandmarks.push(res.landmarks?.[0] || null);
            }

            logResult('DONE', 'Extraction Complete ✅', `${extractedLandmarks.length} frames processed.`);
        }

        // 🎥 Phase 2 — Render previously extracted landmarks
        async function renderLandmarksOnVideo() {
            if (!videoElement || extractedLandmarks.length === 0) {
                logResult('ERROR', 'No Data', 'Run extractAllLandmarks() first.');
                return;
            }

            // Create or reset canvas overlay
            if (canvas) canvas.remove();
            canvas = document.createElement('canvas');
            videoElement.parentNode.style.position = 'relative';
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            videoElement.parentNode.appendChild(canvas);
            ctx = canvas.getContext('2d');
            drawingUtils = new DrawingUtils(ctx);

            const frameInterval = 100; // must match extraction interval (ms)
            const totalFrames = extractedLandmarks.length;
            let lastFrameIndex = -1;

            // 🔥 Sync overlay drawing with video playback
            function drawFrame() {
                if (videoElement.paused || videoElement.ended) return;

                // Compute which frame corresponds to the current time
                const frameIndex = Math.floor(videoElement.currentTime * 1000 / frameInterval);

                if (frameIndex !== lastFrameIndex && frameIndex < totalFrames) {
                    const lm = extractedLandmarks[frameIndex];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    if (lm) {
                        drawingUtils.drawLandmarks(lm, { radius: 2, color: 'white' });
                        drawingUtils.drawConnectors(
                            lm,
                            PoseLandmarker.POSE_CONNECTIONS,
                            { color: 'white', lineWidth: 2 }
                        );
                    }
                    lastFrameIndex = frameIndex;
                }

                requestAnimationFrame(drawFrame);
            }

            // Start playback and synchronized rendering
            videoElement.currentTime = 0;
            await videoElement.play();
            drawFrame();
        }



        onMounted(async () => {
            await createPoseLandmarker();
        });

        return {
            demos, testResults, extractedPosesList, imageGrid,
            extractAllLandmarks, renderLandmarksOnVideo
        };
    }
};
</script>
<style scoped>
.demos.invisible {
    display: none;
}

.image-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.detectOnClick {
    position: relative;
    display: inline-block;
}

.results-box {
    white-space: pre-wrap;
    text-align: left;
    max-height: 200px;
    overflow: auto;
    background: #111;
    color: #eee;
    padding: 8px;
    margin-top: 8px;
}

.extracted-list {
    margin-top: 8px;
    text-align: left;
}

.btn {
    background-color: #333;
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-right: 10px;
}

.btn:hover {
    background-color: #555;
}
</style>