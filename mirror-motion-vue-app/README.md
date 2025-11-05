# Mirror Motion Vue App

## Overview
Mirror Motion is a dance practice application that helps users improve their dance moves through video comparison and pose analysis. Users can upload reference dance videos and practice attempts, then receive automated feedback on their performance through pose matching and synchronized playback.

## Features
- User authentication (login/signup)
- Video upload and categorization (reference/practice)
- Video library management
- Automated pose analysis and comparison
- Synchronized video playback with pose overlays
- Performance feedback with accuracy scores
- Timestamp-specific improvement suggestions

## Project Structure
```
mirror-motion-vue-app
├── public
│   └── index.html          # Main HTML file
├── src
│   ├── App.vue            # Root component
│   ├── main.js            # Application entry point
│   ├── components
│   │   ├── GeneralFeedbackBox.vue  # Feedback display component
│   │   └── ... 
│   ├── pages
│   │   ├── AuthPage.vue           # Login/Signup page
│   │   ├── UploadVideo.vue        # Video upload page
│   │   ├── VideoLibrary.vue       # Video management page
│   │   └── PracticeLibrary.vue    # Practice video comparison
│   ├── services
│   │   ├── userService.js         # Authentication API
│   │   ├── manageVideosService.js # Video management API
│   │   ├── poseBreakdownService.js # Pose analysis
│   │   └── feedbackService.js     # Feedback generation
│   ├── router
│   │   └── index.js              # Route configurations
│   ├── styles
│   │   └── generalStyle.css      # Global styles
│   └── assets                    # Static assets
├── package.json
└── README.md
```

## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mirror-motion-vue-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run serve
   ```

4. **Access the application:**
   Navigate to `http://localhost:8080`

## User Journey
1. Log in or create a new account
2. Upload reference dance videos
3. Upload practice attempts
4. View reference videos in the library
5. Generate feedback for each practice videos
6. Compare synchronized playback
7. Track improvements over time

## Technologies
- Vue.js 3
- Vue Router
- MediaPipe Pose Detection
- HTML5 Video API
- Local Storage for Auth

## Backend Integration
The frontend connects to a backend server running on `localhost:8000` that handles:
- User authentication
- Video storage and retrieval
- Pose data processing
- Feedback generation