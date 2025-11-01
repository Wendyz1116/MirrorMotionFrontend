<template>
  <div class="feedback-box" :class="{ loading: isLoading }">
    <div v-if="isLoading" class="loading-indicator">Loading feedback...</div>

    <div v-else-if="feedback" class="feedback-content">
      <div class="accuracy-gauge">
        <svg viewBox="0 0 100 60" class="gauge">
          <!-- Gauge background -->
          <path d="M10,50 A40,40 0 1,1 90,50" class="gauge-bg" />
          <!-- Gauge value fill -->
          <path :d="gaugeArc" class="gauge-fill" :style="{ stroke: gaugeColor }" />
          <!-- Accuracy text -->
          <text x="50" y="45" class="accuracy-text">
            {{ feedback.accuracyValue }}%
          </text>
          <text x="50" y="55" class="accuracy-label">
            Accuracy
          </text>
        </svg>
      </div>

      <div class="feedback-text">
        {{ feedback.feedbackText }}
      </div>
    </div>

    <div v-else class="empty-state">
      <div v-if="video === null">No practice video selected.</div>

      <div v-else>
        <div v-if="!feedback" class="no-feedback">
          <p>No feedback generated for this video yet.</p>
          <button @click="onGenerateFeedback">Generate Feedback</button>
        </div>
        <!-- <div v-else class="empty-state">No feedback available</div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { generateFeedback, getFeedback } from '@/services/feedbackService';
import { retrieveVideo } from '@/services/manageVideosService';
import { ref } from 'vue';

export default {
  name: 'GeneralFeedbackBox',
  props: {
    practiceVideoId: { type: String, default: null }
  },
  data() {
    return {
      video: undefined, // null = no selection, object = VideoDoc
      feedback: null,
      isLoading: false,
    };
  },
  computed: {
    // Compute the SVG arc path for the gauge based on accuracy value
    gaugeArc() {
      if (!this.feedback) return '';
      const value = Math.min(100, Math.max(0, this.feedback.accuracyValue));
      const angle = (value / 100) * 180; // 180 degree arc
      const rad = angle * Math.PI / 180;
      const x = 50 - 40 * Math.cos(rad);
      const y = 50 - 40 * Math.sin(rad);
      return `M10,50 A40,40 0 ${angle > 90 ? 1 : 0},1 ${x},${y}`;
    },
    // Color the gauge based on accuracy value
    gaugeColor() {
      if (!this.feedback) return '#ccc';
      const value = this.feedback.accuracyValue;
      if (value >= 80) return '#4CAF50'; // green
      if (value >= 60) return '#FFC107'; // yellow
      return '#F44336'; // red
    }
  },
  watch: {
    practiceVideoId: {
      immediate: true,
      handler(id) {
        if (!id) {
          this.video = null;
          this.feedback = null;
          return;
        }
        this.loadVideoDoc(id);
      }
    }
  },
  methods: {
    async loadVideoDoc(id) {
      this.isLoading = true;
      this.video = undefined;
      this.feedback = null;
      try {
        this.video = await retrieveVideo(id, "testOwner");
        if (this.video && this.video.feedback) {
          await this.loadFeedback(this.video.feedback);
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async loadFeedback(id) {
      this.isLoading = true;
      this.feedback = null;
      try {
        this.feedback = await getFeedback(id);
        console.log("Feedback loaded:", this.feedback);
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    async onGenerateFeedback() {
      console.log("onGenerateFeedback called with:", this.video);
      if (!this.video) return;

      this.isLoading = true;
      try {
        // Get reference video
        const referenceVideo = await retrieveVideo(this.video.referenceVideoId, "testOwner");

        // Generate feedback - this will store it in backend
        const generatedFeedback = await generateFeedback(referenceVideo, this.video);

        // Load the full feedback details
        await this.loadFeedback(generatedFeedback.feedbackId);

      } catch (err) {
        console.error("Error generating feedback:", err);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.feedback-box {
  border-radius: 12px;
  margin: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 80%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  border-color: #333;
}

.loading-indicator,
.error-message,
.empty-state {
  font-size: 13px;
  text-align: center;
  padding: 20px;
  color: #333;
}

.error-message {
  color: #F44336;
}

.feedback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.accuracy-gauge {
  width: 80%;
  height: 30%;
}

.gauge {
  width: 100%;
  height: 100%;
}

.gauge-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 8;
}

.gauge-fill {
  fill: none;
  stroke-width: 8;
  transition: all 0.5s ease-out;
}

.accuracy-text {
  font-size: 13px;
  fill: #333;
  text-anchor: middle;
  font-weight: bold;
}

.accuracy-label {
  font-size: 8px;
  fill: #333;
  text-anchor: middle;
}

.feedback-text {
  text-align: left;
  padding: 12px;
  border-radius: 8px;
  color: #333;
  line-height: 1.4;
  width: 100%;
  font-size: 15px;
}

.no-feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-feedback button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #7dc7e9;
  color: white;
  cursor: pointer;
}

.no-feedback button:hover {
  background: #3abdf8;
}

.loading {
  opacity: 0.7;
  pointer-events: none;
}
</style>