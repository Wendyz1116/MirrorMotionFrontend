<template>
  <div class="pose-canvas">
    <canvas ref="canvas" width="640" height="480"></canvas>
  </div>
</template>

<script>
export default {
  name: 'PoseCanvas',
  props: {
    poseData: {
      type: Array,
      required: true
    }
  },
  mounted() {
    this.drawPoseLandmarks();
  },
  methods: {
    drawPoseLandmarks() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (this.poseData && this.poseData.length) {
        this.poseData.forEach(pose => {
          // Draw landmarks
          pose.landmarks.forEach(landmark => {
            ctx.beginPath();
            ctx.arc(landmark.x, landmark.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          });
        });
      }
    }
  },
  watch: {
    poseData: {
      immediate: true,
      handler() {
        this.drawPoseLandmarks();
      }
    }
  }
}
</script>

<style scoped>
.pose-canvas {
  position: relative;
}
canvas {
  border: 1px solid #ccc;
}
</style>