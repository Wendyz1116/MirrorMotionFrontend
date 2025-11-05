# API Specification: Feedback Concept

**Purpose:** To highlight differences between practice video and reference choreography.

---

## API Endpoints

### POST /api/Feedback/analyze

**Description:** Action: Compares practice PoseData to reference PoseData, creates and stores Feedback.

**Requirements:**
- Both `referenceVideoId` and `practiceVideoId` IDs must refer to existing videos (assumed valid inputs by this concept).
- Both `referencePoseData` and `practicePoseData` must be provided for the analysis.

**Effects:**
- A new feedback record is created and its ID is returned.

**Request Body:**
```json
{
  "referenceVideoId": "string",
  "practiceVideoId": "string",
  "referencePoseData": [
    {
      "0": { "x": "number", "y": "number", "z": "number" },
      "11": { "x": "number", "y": "number", "z": "number" }
      // ... other landmark indices as string keys
    }
  ],
  "practicePoseData": [
    {
      "0": { "x": "number", "y": "number", "z": "number" },
      "11": { "x": "number", "y": "number", "z": "number" }
      // ... other landmark indices as string keys
    }
  ]
}
```
*Note: `referencePoseData` and `practicePoseData` are arrays of pose objects, where each pose object maps landmark indices (as strings) to their 3D coordinates. The example above shows the structure for two common landmarks.*

**Success Response Body (Action):**
```json
{
  "feedback": "string",
  "feedbackText": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Feedback/getFeedback

**Description:** Query: Retrieves the feedback text and accuracy value for a specific feedback record.

**Requirements:**
- The feedback record with the given ID must exist.

**Effects:**
- Returns an object containing the feedback text and accuracy value, or an error if not found.

**Request Body:**
```json
{
  "feedback": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "feedbackText": "string",
    "accuracyValue": "number"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Feedback/findFeedback

**Description:** Query: Find feedback by referenceVideo and practiceVideo.

**Requirements:**
- A feedback record matching both `referenceVideo` and `practiceVideo` must exist.

**Effects:**
- Returns the feedback document or an error if not found.

**Request Body:**
```json
{
  "referenceVideo": "string",
  "practiceVideo": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "feedbackDoc": {
      "_id": "string",
      "referenceVideo": "string",
      "practiceVideo": "string",
      "feedbackText": "string",
      "accuracyValue": "number",
      "frameScores": "number[]",
      "worstFrames": "number[]"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: ManageVideo Concept

**Purpose:** To allow dancers and choreographers to upload and manage practice/reference videos, storing the actual video files in Google Cloud Storage and their metadata in MongoDB.

---

## API Endpoints

### POST /api/ManageVideo/upload

**Description:** Uploads a video file to Google Cloud Storage and records its metadata in MongoDB.

**Requirements:**
- videoType must be 'practice' or 'reference'.
- file must be a valid File object.

**Effects:**
- A new video entry is created in MongoDB with a GCS URL, and the video file is uploaded to GCS.

**Request Body:**
```json
{
  "owner": "string",
  "videoType": "string ('practice' | 'reference')",
  "file": "string (base64 encoded file content)",
  "videoName": "string (optional)",
  "referenceVideoId": "string (optional)"
}
```

**Success Response Body (Action):**
```json
{
  "video": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/addPosesToVideo

**Description:** Adds pose data and optional frame range to a video.

**Requirements:**
- Video with the given ID must exist.
- The caller must be the owner of the video.
- poseData must be an array of PoseData objects or a valid JSON string representing such an array.

**Effects:**
- The poseData and optionally matchingFrames fields of the specified video are updated.

**Request Body:**
```json
{
  "video": "string",
  "poseData": [
    {}
  ],
  "caller": "string",
  "matchingFrames": {
    "referenceStartFrame": "number",
    "referenceEndFrame": "number",
    "practiceStartFrame": "number",
    "practiceEndFrame": "number"
  } (optional)
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/retrieve

**Description:** Retrieves video metadata and its Google Cloud Storage URL.

**Requirements:**
- The video must exist.
- The caller must be the owner of the video.

**Effects:**
- Returns the video type, GCS URL, and associated feedback (IDs).

**Request Body:**
```json
{
  "video": "string",
  "caller": "string"
}
```

**Success Response Body (Action):**
```json
{
  "videoId": "string",
  "videoType": "string ('practice' | 'reference')",
  "gcsUrl": "string",
  "videoName": "string",
  "referenceVideoId": "string",
  "feedback": "string | null",
  "poseData": [
    {}
  ],
  "matchingFrames": {
    "referenceStartFrame": "number",
    "referenceEndFrame": "number",
    "practiceStartFrame": "number",
    "practiceEndFrame": "number"
  } (optional)
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/streamVideo

**Description:** Streams the actual video file from Google Cloud Storage.

**Requirements:**
- The video must exist.
- The caller must be the owner of the video.

**Effects:**
- Streams video data directly to the client.

**Request Body:**
```json
{
  "video": "string",
  "caller": "string"
}
```

**Success Response Body (Action):**
*Note: This endpoint returns a raw video stream (e.g., `video/mp4`), not a JSON object.*

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/delete

**Description:** Deletes a video from MongoDB and Google Cloud Storage.

**Requirements:**
- The video must exist.
- The caller must be the owner of the video.

**Effects:**
- The video document is removed from MongoDB and the video file is deleted from GCS.

**Request Body:**
```json
{
  "video": "string",
  "caller": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/setMatchingFrames

**Description:** Set the matchingFrames of a video.

**Requirements:**
- Video with the given ID must exist.
- The caller must be the owner of the video.

**Effects:**
- The matchingFrames field of the specified video is updated.

**Request Body:**
```json
{
  "video": "string",
  "caller": "string",
  "referenceStartFrame": "number",
  "referenceEndFrame": "number",
  "practiceStartFrame": "number",
  "practiceEndFrame": "number"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/storeFeedback

**Description:** Stores feedback ID associated with a video.

**Requirements:**
- Video with the given ID must exist.
- The caller must be the owner of the video.

**Effects:**
- The feedback field of the specified video is updated with `feedbackId`.

**Request Body:**
```json
{
  "video": "string",
  "feedbackId": "string",
  "caller": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/getOwnedVideos

**Description:** Retrieves all video documents owned by a specific user.

**Requirements:**
- None.

**Effects:**
- Returns an array of VideoDoc objects.

**Request Body:**
```json
{
  "owner": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "owner": "string",
    "videoType": "string ('practice' | 'reference')",
    "videoName": "string",
    "referenceVideoId": "string",
    "gcsUrl": "string",
    "gcsFileName": "string",
    "feedback": "string | null",
    "poseData": [
      {}
    ],
    "matchingFrames": {
      "referenceStartFrame": "number",
      "referenceEndFrame": "number",
      "practiceStartFrame": "number",
      "practiceEndFrame": "number"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/getPracticeVideos

**Description:** Retrieves all practice video documents associated with a specific reference video.

**Requirements:**
- None.

**Effects:**
- Returns an array of VideoDoc objects filtered by `referenceVideoId` and `videoType` 'practice'.

**Request Body:**
```json
{
  "referenceVideoId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "owner": "string",
    "videoType": "string ('practice' | 'reference')",
    "videoName": "string",
    "referenceVideoId": "string",
    "gcsUrl": "string",
    "gcsFileName": "string",
    "feedback": "string | null",
    "poseData": [
      {}
    ],
    "matchingFrames": {
      "referenceStartFrame": "number",
      "referenceEndFrame": "number",
      "practiceStartFrame": "number",
      "practiceEndFrame": "number"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ManageVideo/getAllReferenceVideos

**Description:** Retrieves all reference video documents owned by the caller.

**Requirements:**
- None.

**Effects:**
- Returns an array of VideoDoc objects filtered by `owner` and `videoType` 'reference'.

**Request Body:**
```json
{
  "caller": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "owner": "string",
    "videoType": "string ('practice' | 'reference')",
    "videoName": "string",
    "referenceVideoId": "string",
    "gcsUrl": "string",
    "gcsFileName": "string",
    "feedback": "string | null",
    "poseData": [
      {}
    ],
    "matchingFrames": {
      "referenceStartFrame": "number",
      "referenceEndFrame": "number",
      "practiceStartFrame": "number",
      "practiceEndFrame": "number"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

# API Specification: User Concept

**Purpose:** To let users securely manage and access their own videos.

---

## API Endpoints

### POST /api/User/register

**Description:** Registers a new user.

**Requirements:**
- username not already taken.

**Effects:**
- A new User is created with login credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "userID": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/User/login

**Description:** Logs in a user.

**Requirements:**
- username exists and password matches.

**Effects:**
- Authenticates user and conceptually creates a session (represented by userID).

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "userID": "ID"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---