<template>
  <div class="video-uploader">
    <h2>Upload Video</h2>
    <input type="file" accept="video/*" @change="onFileChange" />
    <button @click="uploadVideo" :disabled="!videoFile">Upload Video</button>
    <button @click="extractPose" :disabled="!videoFile">Extract Pose Landmarks</button>
    <div v-if="poseData">
      <h3>Pose Landmarks</h3>
      <pre>{{ poseData }}</pre>
    </div>
  </div>
</template>

<script>
import { retrieveVideo, uploadVideo, getPoseLandmarks } from '../services/poseService';

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
    async uploadVideo() {
      if (this.videoFile) {
        try {
          this.poseData = await uploadVideo("testOwner", "practice", this.videoFile);
          console.log("Uploaded video and received pose data:", this.poseData);
          const testRetrieval = await retrieveVideo(this.poseData.video, "testOwner");
          console.log("Retrieved video data:", testRetrieval);

          const extractedPose = getPoseLandmarks(testRetrieval.gcsUrl);
          console.log("Extracted pose landmarks:", extractedPose);
        } catch (error) {
          console.error('Error extracting pose:', error);
        }
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