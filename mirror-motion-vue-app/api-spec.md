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
  "userID": "string"
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
  "userID": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
# API Specification: Feedback Concept

**Purpose:** To highlight differences between practice video and reference choreography.

---

## API Endpoints

### POST /api/Feedback/analyze

**Description:** Compares practice PoseData to reference PoseData, creates and stores Feedback.

**Requirements:**
- Both referenceVideo and practiceVideo IDs must refer to existing videos (assumed valid inputs by this concept).
- Both referencePoseData and practicePoseData must be provided for the analysis.

**Effects:**
- A new feedback record is created and its ID is returned.
- Returns the ID of the newly created feedback record, or an error if validation fails.

**Request Body:**
```json
{
  "referenceVideo": "string",
  "practiceVideo": "string",
  "referencePoseData": {
    "keypointName1": [
      {
        "x": "number",
        "y": "number",
        "z": "number (optional)",
        "score": "number"
      }
    ],
    "keypointName2": [...]
  },
  "practicePoseData": {
    "keypointName1": [
      {
        "x": "number",
        "y": "number",
        "z": "number (optional)",
        "score": "number"
      }
    ],
    "keypointName2": [...]
  }
}
```

**Success Response Body (Action):**
```json
{
  "feedback": "string"
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

**Description:** Retrieves the feedback text and accuracy value for a specific feedback record.

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


# API Specification: ManageVideo Concept

**Purpose:** To allow dancers and choreographers to upload and manage practice/reference videos, storing the actual video files in Google Cloud Storage and their metadata in MongoDB.

---

## API Endpoints

### POST /api/ManageVideo/upload

**Description:** Uploads a video file to Google Cloud Storage and records its metadata in MongoDB.

**Requirements:**
- videoType must be 'practice' or 'reference'.
- filePath must point to an existing, readable video file.

**Effects:**
- A new video entry is created in MongoDB with a GCS URL, and the video file is uploaded to GCS.

**Request Body:**
```json
{
  "owner": "User",
  "videoType": "'practice' | 'reference'",
  "filePath": "string"
}
```

**Success Response Body (Action):**
```json
{
  "video": "Video"
}
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
  "video": "Video",
  "caller": "User"
}
```

**Success Response Body (Action):**
```json
{
  "videoType": "'practice' | 'reference'",
  "gcsUrl": "string",
  "feedback": "Feedback[]"
}
```

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
  "video": "Video",
  "caller": "User"
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

### POST /api/ManageVideo/_getOwnedVideos

**Description:** Retrieves all video documents owned by a specific user.

**Requirements:**
- None

**Effects:**
- Returns an array of VideoDoc objects.

**Request Body:**
```json
{
  "owner": "User"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "Video",
    "owner": "User",
    "videoType": "'practice' | 'reference'",
    "gcsUrl": "string",
    "gcsFileName": "string",
    "feedback": "Feedback[]"
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


# API Specification: PoseBreakdown Concept

**Purpose:** extract poses from videos and represent them as collections of parts and points, which can later be compared

---

## API Endpoints

### POST /api/PoseBreakdown/extractPoses

**Description:** Processes a video source to detect and extract human poses frame by frame, storing the detected pose data. Note: The `videoSource` argument is expected to be a video URL string when interacting with the API.

**Requirements:**
- The video exists and can be processed.

**Effects:**
- Processes each frame.
- Runs pose detection on each frame.
- Stores `PoseData` for each detected pose.
- Returns the generated `poseIDs` for all stored poses.

**Request Body:**
```json
{
  "videoSource": "string"
}
```

**Success Response Body (Action):**
```json
{
  "poseIDs": [
    "string"
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PoseBreakdown/_getPoseData

**Description:** Retrieves the detailed pose data (including parts and their point coordinates) for a specific pose identifier.

**Requirements:**
- The `poseID` must correspond to a previously extracted and stored pose.

**Effects:**
- If the `poseID` exists, returns an array containing the `PoseData` object associated with it.
- If the `poseID` does not exist, returns an empty array.

**Request Body:**
```json
{
  "poseID": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "poseID": "string",
    "partData": [
      {
        "part": "string",
        "pointData": {
          "x": "number",
          "y": "number",
          "z": "number"
        }
      }
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```