<template>
    <div class="pose-extractor">
        <div ref="demos" class="demos invisible">
            <h2>MediaPipe Pose Extractor (Demo)</h2>
            <div ref="imageGrid" class="image-grid">
                <div class="testImage detectOnClick">
                    <img src="../../public/testPoseImgs/poseTest1.png" crossorigin="anonymous"
                        title="Click to simulate `extractPoses` for this image" />
                    <p>Test case: image with multiple poses</p>
                </div>
                <!-- put <div class="detectOnClick"><img src="..." /></div> items here or render dynamically -->
            </div>
        </div>

        <div class="controls">
            <div ref="testResults" class="results-box">Results will appear here</div>
            <div ref="extractedPosesList" class="extracted-list">No poses extracted yet.</div>
        </div>
    </div>
</template>

<script>
console.log("PoseExtractor component loaded");
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
        const extractedPoses = reactive(new Map());
        const keypoints = {
            NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
            LEFT_ELBOW: 13, RIGHT_ELBOW: 14, LEFT_WRIST: 15, RIGHT_WRIST: 16,
            LEFT_HIP: 23, RIGHT_HIP: 24, LEFT_KNEE: 25, RIGHT_KNEE: 26,
            LEFT_ANKLE: 27, RIGHT_ANKLE: 28
        };

        function logResult(type, label, data) {
            let out = `[${type}] ${label}\n\n`;
            if (type === 'EXTRACT' || type === 'RETRIEVE') {
                if (!data || Object.keys(data).length === 0) out += 'No pose data found.\n\n';
                else out += `${JSON.stringify(data, null, 2)}\n\n`;
            } else if (typeof data === 'object') out += `${JSON.stringify(data, null, 2)}\n\n`;
            else out += `${data}\n\n`;
            console.log(type, label, data);
            if (testResults.value) testResults.value.textContent = out + testResults.value.textContent;
        }

        async function createPoseLandmarker() {
            logResult('STATUS', 'Loading PoseLandmarker...', 'Initializing MediaPipe tasks.');
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
            );
            poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: '/models/pose_landmarker_lite.task',
                    delegate: 'GPU'
                },
                numPoses: 2
            });
            demos.value?.classList.remove('invisible');
            logResult('STATUS', 'PoseLandmarker Loaded ✅', 'Ready to detect poses.');
            attachImageClickHandlers();
        }

        function attachImageClickHandlers() {
            if (!imageGrid.value) return;
            const containers = imageGrid.value.getElementsByClassName('detectOnClick');
            for (let i = 0; i < containers.length; i++) {
                const img = containers[i].querySelector('img');
                if (img) img.addEventListener('click', () => handleClick(img));
            }
        }

        function handleClick(image) {
            if (!poseLandmarker) {
                logResult('ERROR', 'PoseLandmarker not ready', 'Wait for initialization.');
                return;
            }
            logResult('INFO', 'Simulating extractPoses for image', image.src);
            runDetection(image);
        }

        function runDetection(image) {
            const parent = image.parentNode;
            const existing = parent.querySelector('canvas');
            if (existing) existing.remove();

            const canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.pointerEvents = 'none';
            canvas.width = image.clientWidth;
            canvas.height = image.clientHeight;
            canvas.style.width = image.clientWidth + 'px';
            canvas.style.height = image.clientHeight + 'px';
            parent.style.position = 'relative';
            parent.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const drawingUtils = new DrawingUtils(ctx);

            // detect accepts Image|Video|HTMLCanvasElement, using Promise API here:
            const result = poseLandmarker.detect(image);
            // detect returns object with landmarks array
            Promise.resolve(result).then((res) => {
                const poseID = `pose-${crypto.randomUUID().slice(0, 8)}`;
                const firstPose = res.landmarks?.[0];
                if (!firstPose) {
                    logResult('EXTRACT', `Pose ID: ${poseID}`, 'No landmarks detected.');
                    updateExtractedPosesUI();
                    return;
                }

                const simplifiedPose = {};
                for (const [name, idx] of Object.entries(keypoints)) {
                    const p = firstPose[idx];
                    simplifiedPose[name] = p ? { x: p.x, y: p.y, z: p.z } : null;
                }

                extractedPoses.set(poseID, simplifiedPose);
                logResult('EXTRACT', `Pose ID: ${poseID}`, simplifiedPose);
                updateExtractedPosesUI();

                for (const lm of res.landmarks || []) {
                    drawingUtils.drawLandmarks(lm, { radius: 1, color: 'white' });
                    drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: 'white', lineWidth: 2 });
                }
            }).catch(err => logResult('ERROR', 'Detection error', err));
        }

        function updateExtractedPosesUI() {
            if (!extractedPosesList.value) return;
            extractedPosesList.value.innerHTML = '';
            if (extractedPoses.size === 0) {
                extractedPosesList.value.textContent = 'No poses extracted yet.';
                return;
            }
            extractedPoses.forEach((_, poseID) => {
                const div = document.createElement('div');
                div.className = 'extracted-pose-item';
                const idSpan = document.createElement('span');
                idSpan.textContent = `Pose ID: ${poseID}`;
                const btn = document.createElement('button');
                btn.textContent = 'Get Pose Data';
                btn.onclick = () => getPoseDataAction(poseID);
                div.appendChild(idSpan);
                div.appendChild(btn);
                extractedPosesList.value.appendChild(div);
            });
        }

        function getPoseDataAction(poseID) {
            const poseData = extractedPoses.get(poseID);
            if (poseData) logResult('RETRIEVE', `Retrieving Pose ID: ${poseID}`, poseData);
            else logResult('ERROR', `Retrieving Pose ID: ${poseID}`, 'Pose data not found.');
        }

        onMounted(async () => {
            await createPoseLandmarker();
            updateExtractedPosesUI();
        });

        return { demos, testResults, extractedPosesList, imageGrid };
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
</style>