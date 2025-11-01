<template>
  <div class="manage-videos">
    <h1 class="title">Video Library</h1>

    <div>
      <button class="use-as-ref-btn" :disabled="!selectedVideo" @click="useAsReference">Use as reference</button>
    </div>

    <!-- <div class="controls">
      <label>
        Owner id:
        <input v-model="owner" placeholder="enter owner id (User)" />
      </label>
      <button @click="loadVideos" :disabled="!owner">Load Library</button>
      <button v-if="videos.length" @click="refresh">Refresh</button>
    </div> -->

    <!-- <div v-if="loading" class="status">Loading all videos…</div> -->
    <!-- <div v-if="error" class="status error">{{ error }}</div> -->

    <div v-if="!loading && videos.length === 0" class="empty">
      No videos found for this owner.
    </div>

    <div class="grid" v-if="videos.length">
      <div class="card" v-for="(v, idx) in videos" :key="v._id"
        :class="{ selected: selectedVideo && selectedVideo._id === v._id }" @click="selectVideo(v)">
        <div class="video-wrap">
          <video v-if="v.localBlobUrl" :src="v.localBlobUrl" crossorigin="anonymous" playsinline
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
import { getAllReferenceVideos, getOwnedVideos } from '@/services/manageVideosService';
import { createBlobUrlFromRemote } from '@/services/poseBreakdownService';

export default {
  name: "ManageVideos",
  props: {
    ownerProp: { type: String, default: null },
  },
  data() {
    return {
      owner: this.ownerProp || "testOwner",
      videos: [],
      loading: false,
      error: null,
      selectedVideo: null,
      blobUrls: [], // to track and clean up
    };
  },
  watch: {
    ownerProp(newVal) {
      if (newVal) {
        this.owner = newVal;
        this.loadVideos();
      }
    },
  },
  methods: {
    async loadVideos() {
      if (!this.owner) return;
      this.loading = true;
      this.error = null;

      try {
        const data = await getAllReferenceVideos(this.owner);
        this.videos = Array.isArray(data) ? data : [];

        console.log("Loaded videos:", this.videos);

        // fetch blob URLs for thumbnails
        for (const v of this.videos) {
          console.log("video:", v);
          if (v._id) {
            try {
              const blobUrl = await createBlobUrlFromRemote(v._id);
              v.localBlobUrl = blobUrl;
              this.blobUrls.push(blobUrl);
            } catch (err) {
              console.warn(`Failed to load video blob for ${v._id}:`, err);
            }
          }
          console.log("new video:", v);
        }
      } catch (err) {
        this.error = err.message || "Failed to load videos";
      } finally {
        this.loading = false;
      }
    },
    refresh() {
      this.revokeBlobUrls();
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
    revokeBlobUrls() {
      for (const url of this.blobUrls) {
        URL.revokeObjectURL(url);
      }
      this.blobUrls = [];
    },
  },
  mounted() {
    if (this.owner) this.loadVideos();
  },
  beforeUnmount() {
    this.revokeBlobUrls();
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