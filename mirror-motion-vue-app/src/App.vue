<template>
  <div id="app">
    <UploadVideoPage @video-uploaded="handleVideoUploaded" />
    <PoseCanvas :poseData="poseData" />
  </div>
</template>

<script>
import UploadVideoPage from './pages/UploadVideoPage.vue';
// import PoseCanvas from './components/PoseCanvas.vue';

export default {
  name: 'App',
  components: {
    UploadVideoPage
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