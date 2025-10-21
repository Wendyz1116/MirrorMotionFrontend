<template>
  <div id="app">
    <h1>Video Pose Landmark Extraction</h1>
    <VideoUploader @video-uploaded="handleVideoUploaded" />
    <PoseExtractor />
    <PoseCanvas :poseData="poseData" />
  </div>
</template>

<script>
import PoseExtractor from './components/PoseExtractor.vue';
import VideoUploader from './components/VideoUploader.vue';
// import PoseCanvas from './components/PoseCanvas.vue';

export default {
  name: 'App',
  components: {
    PoseExtractor,
    VideoUploader
    // PoseCanvas
  },
  data() {
    return {
      poseData: null
    };
  },
  methods: {
    handleVideoUploaded(poseData) {
      this.poseData = poseData;
    }
  }
}
</script>

<style>
#app {
  text-align: center;
  margin-top: 20px;
}
</style>