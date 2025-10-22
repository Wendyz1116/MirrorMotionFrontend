<template>
    <div id="main-layout">
        <h1>Video Pose Landmark Extraction</h1>
        <!-- control buttons -->
        <div style="margin-bottom:16px; text-align:center;">
            <button @click="analyzeDance">Analyze Dance (sync & compare)</button>
            <button @click="showAlignedPoses">Show Aligned Poses</button>
            <button @click="handleGenerateFeedback">Generate Feedback</button>
        </div>

        <div class="uploaders-container">
            <VideoUploader ref="uploaderA" @video-uploaded="handleVideoUploaded" />
            <VideoUploader ref="uploaderB" @video-uploaded="handleVideoUploaded" />
        </div>
        <PoseCanvas :poseData="poseData" />
    </div>
</template>

<script>
import VideoUploader from '../components/VideoUploader.vue';
import { computeOffsetBetweenVideos } from '@/services/compareVideosService';
import { extractRawLandmarksFromVideoElement } from '@/services/poseBreakdownService';
import { addPosesToVideo, generateFeedback } from '@/services/manageVideosService';

export default {
    components: { VideoUploader },
    data() {
        return {
            poseData: null,
            alignedInfo: {
                startAms: null,
                startBms: null,
                syncLenMs: null,
                frameIntervalMs: 100,
                startFrameA: null,
                startFrameB: null
            }
        };
    },
    methods: {
        handleVideoUploaded(poseData) {
            this.poseData = poseData;
        },
        async analyzeDance() {
            const vA = this.$refs.uploaderA?.$refs?.uploadedVideo;
            const vB = this.$refs.uploaderB?.$refs?.uploadedVideo;

            if (!vA || !vB) {
                console.warn('Both videos must be shown (click "Show Video" in each uploader).');
                return;
            }
            try {
                const { offsetSeconds, score } = await computeOffsetBetweenVideos(vA, vB, { frameWindowMs: 50, maxLagSec: 10 });
                console.log('Audio offset (B - A):', offsetSeconds, 's (score)', score);

                const startAms = Math.max(0, -Math.round(offsetSeconds * 1000));
                const startBms = Math.max(0, Math.round(offsetSeconds * 1000));
                const endAms = vA.duration * 1000;
                const endBms = vB.duration * 1000;
                const syncLenMs = Math.min(endAms - startAms, endBms - startBms);

                const frameIntervalMs = 100;
                const startFrameA = Math.floor(startAms / frameIntervalMs);
                const endFrameA = startFrameA + Math.floor(syncLenMs / frameIntervalMs);
                const startFrameB = Math.floor(startBms / frameIntervalMs);
                const endFrameB = startFrameB + Math.floor(syncLenMs / frameIntervalMs);

                const [landmarksA, landmarksB] = await Promise.all([
                    extractRawLandmarksFromVideoElement(vA, frameIntervalMs, Infinity, startAms, syncLenMs),
                    extractRawLandmarksFromVideoElement(vB, frameIntervalMs, Infinity, startBms, syncLenMs)
                ]);

                const caller = 'testOwner';
                const uploadA = addPosesToVideo(this.$refs.uploaderA.uploadedVideoData.video, landmarksA, caller, startFrameA, endFrameA);
                const uploadB = addPosesToVideo(this.$refs.uploaderB.uploadedVideoData.video, landmarksB, caller, startFrameB, endFrameB);

                const [resA, resB] = await Promise.all([uploadA, uploadB]);

                if (resA?.error || resB?.error) {
                    console.error('Upload errors', resA, resB);
                } else {
                    console.log('Aligned landmarks uploaded', resA, resB);
                }

                this.alignedInfo = { startAms, startBms, syncLenMs, frameIntervalMs, startFrameA, startFrameB };

                this.poseData = {
                    alignedA: landmarksA,
                    alignedB: landmarksB,
                    uploadA: resA,
                    uploadB: resB,
                    offsetSeconds,
                    score
                };
            } catch (err) {
                console.error('Dance analysis failed:', err);
            }
        },
        async showAlignedPoses() {
            if (!this.poseData?.alignedA || !this.poseData?.alignedB) {
                console.warn('No aligned pose data available. Run Analyze Dance first.');
                return;
            }
            const uploaderA = this.$refs.uploaderA;
            const uploaderB = this.$refs.uploaderB;

            const fi = this.alignedInfo.frameIntervalMs || 100;

            uploaderA.setAlignedPose(this.poseData.alignedA, this.alignedInfo.startAms, this.alignedInfo.syncLenMs, fi);
            uploaderB.setAlignedPose(this.poseData.alignedB, this.alignedInfo.startBms, this.alignedInfo.syncLenMs, fi);

            uploaderA.showPose();
            uploaderB.showPose();
        },

        async handleGenerateFeedback() {
            console.log("handleGenerateFeedback called");
            if (!this.poseData?.alignedA || !this.poseData?.alignedB) {
                console.warn('No aligned pose data available. Run Analyze Dance first.');
                return;
            }

            try {
                const feedbackId = await generateFeedback(
                    this.$refs.uploaderA.uploadedVideoData.video,
                    this.$refs.uploaderB.uploadedVideoData.video,
                    this.poseData.alignedA,
                    this.poseData.alignedB
                );
                console.log(feedbackId);
                alert('Feedback: ' + feedbackId.feedbackText);
            } catch (err) {
                alert('Failed to generate feedback: ' + err.message);
            }
        },
    }
};
</script>

<style>
#main-layout {
    text-align: center;
    margin-top: 20px;
}

.uploaders-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

.uploaders-container>* {
    flex: 1 1 300px;
    max-width: 500px;
}
</style>
