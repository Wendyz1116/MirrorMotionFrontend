<template>
  <div class="video-uploader">
    <h2>Upload Video</h2>
    <input type="file" accept="video/*" @change="onFileChange" />
    <button @click="extractPose" :disabled="!videoFile">Extract Pose Landmarks</button>
    <div v-if="poseData">
      <h3>Pose Landmarks</h3>
      <pre>{{ poseData }}</pre>
    </div>
  </div>
</template>

<script>
import { uploadVideoAndExtractPose } from '../services/poseService';

export default {
  name: 'VideoUploader',
  data() {
    return {
      videoFile: null,
      poseData: null,
    };
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.videoFile = file;
      }
    },
    async extractPose() {
      if (this.videoFile) {
        try {
          this.poseData = await uploadVideoAndExtractPose(this.videoFile);
        } catch (error) {
          console.error('Error extracting pose:', error);
        }
      }
    },
  },
};
</script>

<style scoped>
.video-uploader {
  margin: 20px;
}
input[type="file"] {
  margin-bottom: 10px;
}
button {
  margin-top: 10px;
}
</style>