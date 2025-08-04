# MELODY Playlist App - Current Issues Documentation

## **Audio Processing Issues**

### Agent Audio Bugs
**Location:** `VoiceAgent.js` (frontend/src/components/) and `audio-processor.js` (frontend/public/)
**Issue:** Agent audio output experiences intermittent choppiness during playback. The problem persists despite audio buffering mechanisms being in place. The issue affects the real-time voice communication feature where users interact with the AI agent through speech.

---

## **Performance & Optimization Issues**

### Agent Context Window Growth
**Location:** `voiceAgentController.js` (backend/controllers/)
**Issue:** During extended conversations with the voice agent, the conversation history array grows rapidly, leading to increased token consumption and higher API costs. The context window management system is not efficiently pruning older conversation entries, causing exponential growth in processing requirements for longer sessions.

---

## **Image Processing Functionality**

### Generate from Images Feature Reliability
**Location:** `playlistController.js` (backend/controllers/) - `createPlaylistFromImage` function and `openaiController.js` (backend/controllers/) - `imageToPrompt` function
**Issue:** The image-to-playlist generation feature has a high failure rate due to image processing errors occurring between the uploaded image handling and OpenAI API communication. Additionally, when the feature does work, the AI-generated descriptions from images are of poor quality, resulting in irrelevant and low-quality playlist generation that doesn't match the image content.

---

## **Development Environment Issues**

### React Deprecated Packages
**Location:** Frontend package dependencies
**Issue:** Multiple deprecated npm packages are present in the React frontend, along with several development warnings being generated during build and runtime processes.

---

## **User Interface Issues**

### Homepage 3D Model Positioning
**Location:** `Home.js` (frontend/src/pages/) - ModelViewer component
**Issue:** The 3D model (ticker) positioning is inconsistent across different devices and screen sizes. The model either appears too far below the login button or positioned too close to it, with no stable positioning solution working universally. The interactive functionality of the model must be preserved during any positioning fixes.

### Spotify iFrame Positioning
**Location:** `EditPlaylist.js` (frontend/src/pages/) and in-site player pages
**Issue:** The Spotify iFrame components that display playlist content are extending beyond the intended boundaries of the website layout, causing visual overflow that cuts off parts of the component and affects the overall user interface integrity.

---

## **Major Feature Updates & Infrastructure**

### Features Page Content Gap
**Location:** Features/documentation pages
**Issue:** The features page does not include information about the new voice agent mode and top charts functionality, leaving users unaware of these available features.

### Deployment Infrastructure
**Location:** Project root/deployment configuration
**Issue:** The application lacks Docker containerization, making deployment processes more complex and less standardized across different environments.

### API Compliance Review
**Location:** Spotify API integration throughout the application
**Issue:** Need to review current Spotify API usage against their updated policies, particularly regarding the integration of their API services with AI/ML services, to ensure continued compliance and avoid potential service interruptions.

---


