<template>
  <div class="manage-videos">
    <h1 class="title">Video Library</h1>

    <div>
      <button class="use-as-ref-btn" :disabled="!selectedVideo" @click="useAsReference">Use as reference</button>
    </div>

    <div v-if="!loading && videos.length === 0" class="empty">
      No videos found for this owner.
    </div>

    <div class="grid" v-if="videos.length">
      <div class="card" v-for="(v, idx) in videos" :key="v._id"
        :class="{ selected: selectedVideo && selectedVideo._id === v._id }" @click="selectVideo(v)">
        <div class="video-wrap">
          <video v-if="v.localVideoUrl" :src="v.localVideoUrl" crossorigin="anonymous" playsinline
            preload="metadata"></video>
          <div v-else class="placeholder">Loading preview...</div>
        </div>

        <div class="meta">
          <div>{{ v.videoName || 'untitled' }}</div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { getAllReferenceVideos, streamVideo } from '@/services/manageVideosService';

export default {
  name: "ManageVideos",
  data() {
    return {
      videos: [],
      loading: false,
      error: null,
      selectedVideo: null,
      videoUrls: [], // to track and clean up
      session: null,
    };
  },
  created() {
    console.log("in video library");
    // Check for logged in user
    const session = localStorage.getItem('session');
    console.log("session:", session);
    if (!session) {
      this.$router.push('/login');
      return;
    }
    this.session = session;
    this.loadVideos();
  },
  methods: {
    async loadVideos() {
      if (!this.session) return;
      this.loading = true;
      this.error = null;

      try {
        const data = await getAllReferenceVideos(this.session);
        this.videos = Array.isArray(data) ? data : [];

        console.log("Loaded videos:", this.videos);

        // fetch video URLs for thumbnails
        for (const v of this.videos) {
          if (v._id) {
            try {
              const videoUrl = await streamVideo(this.session, v._id);
              v.localVideoUrl = videoUrl;
              this.videoUrls.push(videoUrl);
              console.log("videoUrl for video", v._id, ":", videoUrl);
            } catch (err) {
              console.warn(`Failed to load video blob for ${v._id}:`, err);
            }
          }
        }
      } catch (err) {
        if (err.message === 'Unauthorized') {
          this.$router.push('/login');
        } else {
          this.error = err.message || "Failed to load videos";
        }
      } finally {
        this.loading = false;
      }
    },
    refresh() {
      this.revokeVideoUrls();
      this.loadVideos();
    },
    selectVideo(video) {
      this.selectedVideo = this.selectedVideo?._id === video._id ? null : video;
      this.$emit("video-selected", this.selectedVideo);
    },
    useAsReference() {
      if (!this.selectedVideo) return;
      // store full object so the target page can read it
      sessionStorage.setItem('selectedReferenceVideo', JSON.stringify(this.selectedVideo));
      // navigate to practice library route and include ref id as query param
      this.$router.push({ name: 'PracticeLibrary', query: { refId: this.selectedVideo._id } });
    },
    revokeVideoUrls() {
      for (const url of this.videoUrls) {
        URL.revokeObjectURL(url);
      }
      this.videoUrls = [];
    },
  },
  mounted() {
    if (this.owner) this.loadVideos();
  },
  beforeUnmount() {
    this.revokeVideoUrls();
  },
};
</script>

<style scoped>
.title {
  color: #3abdf8;
  font-size: 38px;
  font-weight: bold;
  align-self: flex-start;
  align-self: center;
  top: 16px;
  left: 16px;
}

.manage-videos {
  width: 100vw;
  text-align: center;
}

.use-as-ref-btn {
  width: 15%;
  background: #7dc7e9;
  color: #fff;
  border: none;
  padding: 5px;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  margin: 8px 0 16px 0;
}

.use-as-ref-btn:hover:not(:disabled) {
  background: #3abdf8;
}

.use-as-ref-btn:disabled {
  background: #aed3e4;
  cursor: not-allowed;
}

.controls {
  margin-bottom: 16px;
  margin-top: 16px;
}

.controls input {
  margin-left: 0px;
  padding: 0px;
  min-width: 220px;
}

.status {
  font-size: 10px;
  margin: 0px 0 4px 0;
}

.status.error {
  color: #b00;
}

/* Grid layout: 4 columns on large screens, fewer on small */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  /* Responsive min size */
  gap: 18px;
  margin-top: 0px;
  justify-content: center;
}

/* Card container */
.card {
  border: 2px solid #333;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s ease;
}

.card:hover {
  border-color: #ccc;
  transform: translateY(-3px);
}

.card.selected {
  border-color: #3abdf8;
}

/* Maintain 3:4 aspect ratio */
.video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  background-color: #ccc;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: #333;
  padding: 24px;
  text-align: center;
}

.meta {
  margin-top: 8px;
  font-size: 15px;
  color: #333;
  font-weight: bold;
}

.meta .row {
  margin: 3px 0;
}
</style>