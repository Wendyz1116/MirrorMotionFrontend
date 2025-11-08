<template>
    <div class="video-uploader">
        <h2 class="title">Upload a Video</h2>

        <div class="form-container">
            <div class="form-group">
                <label class="file-label">
                    <span>Upload Video File</span>
                    <input type="file" accept="video/*" @change="onFileChange" />
                </label>
            </div>

            <div class="form-group">
                <label for="videoName">Video Name</label>
                <input id="videoName" type="text" v-model="videoName" placeholder="Enter a descriptive name" />
            </div>

            <div class="form-group">
                <label for="videoType">Video Type</label>
                <select id="videoType" v-model="videoType" @change="onVideoTypeChange">
                    <option disabled value="">Select Type</option>
                    <option value="reference">Reference</option>
                    <option value="practice">Practice</option>
                </select>
            </div>

            <!-- Conditional dropdown for reference video selection -->
            <div class="form-group" v-if="videoType === 'practice'">
                <label for="referenceVideo">Reference Video</label>
                <select id="referenceVideo" v-model="selectedReferenceVideoId">
                    <option disabled value="">Select Reference Video</option>
                    <option v-for="ref in referenceVideos" :key="ref._id" :value="ref._id">
                        {{ ref.videoName }}
                    </option>
                </select>
            </div>

            <button class="upload-btn" @click="uploadVideo" :disabled="!videoFile || !videoType || !videoName">
                Upload Video
            </button>

            <div class="status" v-if="statusMessage">
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<script>
import { uploadVideo, getAllReferenceVideos } from "../services/manageVideosService";

export default {
    name: "VideoUploader",
    data() {
        return {
            videoFile: null,
            videoType: "",
            videoName: "",
            uploadedVideoData: {},
            statusMessage: "",
            referenceVideos: [], // holds fetched reference videos
            selectedReferenceVideoId: "", // selected reference for practice video
            session: null,
        };
    },
    created() {
        // Check for logged in user when component is created
        const session = localStorage.getItem('session');
        if (!session) {
            // Redirect to login if no user is logged in
            this.$router.push('/login');
            return;
        }
        this.session = session;
    },
    methods: {
        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.videoFile = file;
                this.statusMessage = `Selected: ${file.name}`;
            }
        },

        async onVideoTypeChange() {
            if (this.videoType === "practice") {
                try {
                    // Use actual user ID instead of hardcoded "testOwner"
                    this.referenceVideos = await getAllReferenceVideos(this.session);
                    console.log("Loaded reference videos:", this.referenceVideos);
                } catch (err) {
                    console.error("Failed to load reference videos:", err);
                    this.referenceVideos = [];
                }
            } else {
                this.selectedReferenceVideoId = "";
                this.referenceVideos = [];
            }
        },

        async uploadVideo() {
            if (!this.videoFile || !this.videoType || !this.videoName) return;

            if (this.videoType === "practice" && !this.selectedReferenceVideoId) {
                this.statusMessage = "Please select a reference video.";
                return;
            }

            try {
                this.statusMessage = "Uploading...";
                this.uploadedVideoData = await uploadVideo(
                    this.session,
                    this.videoType,
                    this.videoFile,
                    this.videoName,
                    this.selectedReferenceVideoId || null
                );
                this.statusMessage = "Upload successful!";

                // Redirect to video library after successful upload
                setTimeout(() => {
                    this.$router.push('/videoLibrary');
                }, 1500);
            } catch (error) {
                console.error(error);
                if (error.message === 'Unauthorized') {
                    this.statusMessage = "Please log in to upload videos.";
                    this.$router.push('/login');
                } else {
                    this.statusMessage = "Upload failed. Try again.";
                }
            }
        },
    },
};
</script>


<style scoped>
.video-uploader {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100vw;
    box-sizing: border-box;
    text-align: center;
}

.title {
    color: #3abdf8;
    font-size: 38px;
    font-weight: bold;
    align-self: flex-start;
    /* left-align heading */
    align-self: center;
    top: 16px;
    left: 16px;
}

.form-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    /* take remaining space */
    width: 100%;
    max-width: 480px;
    min-width: 300px;
}

.form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    width: 100%;
}

label {
    font-weight: 600;
    margin-bottom: 6px;
    color: #333;
}

input[type="text"],
select {
    border-radius: 5px;
    padding: 10px;
    border: 1px solid #ccc;
    font-size: 15px;
    background: #fff;
}

input[type="text"]:focus,
select:focus,
.file-label:hover,
input[type="text"]:hover,
select:hover {
    border-color: #3abdf8;
    outline: none;
    box-shadow: none;
}

.file-label {
    display: inline-block;
    background: #fff;
    color: #333;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.file-label:hover {
    border: 1px solid #3abdf8;

}

.file-label input {
    display: none;
}

.upload-btn {
    width: 100%;
    background: #7dc7e9;
    color: white;
    border: none;
    padding: 12px;
    font-size: 15px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 6px;
}

.upload-btn:hover:not(:disabled) {
    background: #3abdf8;
}

.upload-btn:disabled {
    background: #aed3e4;
    cursor: not-allowed;
}

.status {
    margin-top: 12px;
    font-size: 13px;
    color: #555;
    width: 100%;
}
</style>
