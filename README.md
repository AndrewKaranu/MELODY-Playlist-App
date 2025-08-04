# MELODY - AI Powered Playlist Generator

## Overview

MELODY is a music application built on the MERN stack (MongoDB, Express, React, Node.js). It leverages the power of artificial intelligence to transform your musical ideas and preferences into personalized Spotify playlists. Whether you're looking for an interactive music expeirence with our agent or your'e inspired by a text prompt, an image, or your favorite songs and artists, MELODY crafts unique soundtracks tailored just for you.

## Features



### Voice Agent (MELODY VOICE AGENT)
*   **Spotify Playback Controls:** Full control over music playback including play, pause, skip, volume adjustment, and seeking to specific positions
*   **Queue Management:** Add songs to queue, view currently playing tracks, manage devices, and transfer playback between devices
*   **Music Discovery Tools:** Intelligent music search and recommendation system that finds songs based on genres, moods, artist similarities, and descriptive queries
*   **Playlist Operations:** Create, modify, and play custom playlists directly on your Spotify account through voice commands
*   **Search Functions:** Advanced music search capabilities using natural language, track names, or descriptive phrases
*   **Web Search Integration:** Access to current music information, artist news, concert schedules, and real-time music industry updates
*   **Voice Processing:** Real-time voice-to-voice conversation using OpenAI Realtime API for natural music discussions
*   **Context Management:** Remembers conversation history and user preferences to provide personalized recommendations

### Core Playlist Generation
*   **Generate via Prompt:** Describe the vibe, mood, or theme you're looking for, and our AI will generate a personalized playlist to match.
*   **Generate from Songs:** Use your favorite tracks as inspiration to discover new music. Our AI analyzes your chosen songs and creates a playlist with similar musical elements and vibes.
*   **Create from Artists:** Select artists you love, and we'll expand your musical horizons by generating a playlist that captures their essence while introducing you to new artists you might enjoy.
*   **Generate from Images:** Upload any image, and our AI will interpret its mood, colors, and composition to create a playlist that captures its essence in musical form.
*   **Generate custom playlist covers:** Let your imagination run wild in a prompt that is used to generate a custom playlist cover.

### Personal Music Analytics
*   **Top Tracks Analysis:** View and play your most-played songs across different time periods (last 4 weeks, 6 months, or all time).
*   **Top Artists Dashboard:** Discover your favorite artists and track your listening patterns over time.
*   **Interactive Podium Display:** See your top 3 tracks or artists displayed in an elegant podium format with instant playback.
*   **Historical Listening Data:** Analyze your music taste evolution with comprehensive listening statistics from your Spotify account.

### Spotify Integration
*   **Seamless Connection:** Connect to your Spotify account to generate and save playlists directly to your library.
*   **Real-time Playback Control:** Control your Spotify playback directly from the app with instant response.
*   **Queue Management:** Add songs to your queue and manage your listening experience without leaving the app.

## Technologies Used

*   **Frontend:** React, CSS
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Amazon S3
*   **AI & Voice:** OpenAI API (GPT models + Realtime API for voice interaction)
*   **Real-time Communication:** WebSocket for voice agent functionality
*   **Music APIs:** Spotify Web API, Spotify Web Playback SDK
*   **Other:** Spotify IFrame API for embedded players


## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone [repository URL]
    ```
2.  **Install dependencies:**

    *   Frontend:

        ```bash
        cd frontend
        npm install
        ```
    *   Backend:

        ```bash
        cd backend
        npm install
        ```
3.  **Configuration:**

    *   Create a `.env` file in the backend directory and add the following environment variables:

        ```
        # Server Configuration
        PORT=4000

        # MongoDB Configuration
        MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database

        # Spotify API Configuration
        CLIENT_ID=your_spotify_client_id
        CLIENT_SECRET=your_spotify_client_secret
        REDIRECT_URI=http://localhost:4000/api/auth/spotify/callback

        # Session and Security
        SESSION_SECRET=your_session_secret_key
        SUPER_SECRET=your_jwt_secret_key

        # OpenAI API Configuration
        OPENAI_API_KEY=sk-proj-your_openai_api_key

        # Google Search API (for web search functionality)
        GOOGLE_SEARCH_API_KEY=your_google_search_api_key
        GOOGLE_SEARCH_CX_ID=your_custom_search_engine_id

        # Last.fm API (for music discovery)
        LASTFM_API_KEY=your_lastfm_api_key
        ```

    **How to obtain API credentials:**

    *   **MongoDB Atlas:** Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas), create a database user, and copy the connection string
    *   **Spotify API:** Visit [developer.spotify.com](https://developer.spotify.com), create an app, and get your Client ID and Secret from the app dashboard
    *   **OpenAI API:** Sign up at [platform.openai.com](https://platform.openai.com), go to API Keys section, and create a new secret key
    *   **Google Search API:** Enable the Custom Search API at [console.cloud.google.com](https://console.cloud.google.com), create credentials, and set up a Custom Search Engine at [cse.google.com](https://cse.google.com)
    *   **Last.fm API:** Register for an API account at [last.fm/api/account/create](https://last.fm/api/account/create) to get your API key
    *   **Session Secrets:** Generate random strings for SESSION_SECRET and SUPER_SECRET (used for JWT and session security)
4.  **Run the application:**

    *   Backend:

        ```bash
        cd backend
        npm start
        ```
    *   Frontend:

        ```bash
        cd frontend
        npm start
        ```

    *   The frontend will typically run on `http://localhost:3000`, and the backend on `http://localhost:[PORT]`.

## Key Features Deep Dive

### Voice Agent (MELODY AI)
The voice agent feature transforms MELODY into your personal AI music companion. Using OpenAI's Realtime API, you can have natural conversations about music while controlling your Spotify playback in real-time.

**How to use:**
1. Connect to your Spotify account
2. Initialize a voice session from the dashboard
3. Start speaking naturally about music - ask for recommendations, request specific songs, or discuss your music preferences
4. MELODY will respond with voice and automatically control your Spotify playback

**Voice Commands Examples:**
- "Play some upbeat 80s music"
- "Create a playlist for my workout"
- "Find songs similar to The Beatles"
- "Skip to the next track"
- "What's currently playing?"
- "Let's discuss about this artist/genre/song"

### Top Charts & Analytics
Discover your personal music statistics with detailed analytics about your listening habits.

**Features:**
- **Top Tracks:** View your most-played songs with beautiful podium display for top 3
- **Top Artists:** See your favorite artists ranked by listening frequency  
- **Time Periods:** Analyze your taste across different timeframes:
  - Last 4 weeks (recent discoveries)
  - Last 6 months (current favorites)
  - All time (lifetime preferences)
- **Interactive Playback:** Click any track or artist to instantly start playing
- **Visual Rankings:** Elegant display with album artwork and detailed information

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.
