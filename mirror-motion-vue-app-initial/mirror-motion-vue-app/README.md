# Mirror Motion Vue App

## Overview
The Mirror Motion Vue App is a frontend application that allows users to upload a video and extract pose landmarks from it. The extracted pose data is then displayed visually on the screen.

## Project Structure
```
mirror-motion-vue-app
├── public
│   └── index.html          # Main HTML file for the application
├── src
│   ├── App.vue            # Root component of the Vue application
│   ├── main.js            # Entry point for the Vue application
│   ├── components
│   │   ├── HelloWorld.vue  # Component displaying a welcome message
│   │   ├── VideoUploader.vue # Component for uploading videos
│   │   └── PoseCanvas.vue  # Component for displaying pose landmarks
│   ├── services
│   │   └── poseService.js  # Functions for API interactions
│   ├── utils
│   │   └── videoUtils.js   # Utility functions for video processing
│   └── assets              # Directory for static assets
├── package.json            # npm configuration file
├── vue.config.js           # Vue CLI configuration settings
├── .eslintrc.js           # ESLint configuration file
└── README.md               # Documentation for the project
```

## Setup Instructions
1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd mirror-motion-vue-app
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm run serve
   ```

4. **Open your browser:**
   Navigate to `http://localhost:8080` to view the application.

## Usage
- Use the **Video Uploader** component to select and upload a video file.
- The application will process the video and extract pose landmarks.
- The **Pose Canvas** component will display the extracted pose landmarks visually.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.