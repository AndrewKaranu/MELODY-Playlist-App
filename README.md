# MELODY - AI Powered Playlist Generator

## Overview

MELODY is a music application built on the MERN stack (MongoDB, Express, React, Node.js). It leverages the power of artificial intelligence to transform your musical ideas and preferences into personalized Spotify playlists. Whether you're inspired by a text prompt, an image, or your favorite songs and artists, MELODY crafts unique soundtracks tailored just for you.

## Features

*   **Generate via Prompt:** Describe the vibe, mood, or theme you're looking for, and our AI will generate a personalized playlist to match.
*   **Generate from Songs:** Use your favorite tracks as inspiration to discover new music. Our AI analyzes your chosen songs and creates a playlist with similar musical elements and vibes.
*   **Create from Artists:** Select artists you love, and we'll expand your musical horizons by generating a playlist that captures their essence while introducing you to new artists you might enjoy.
*   **Generate from Images:** Upload any image, and our AI will interpret its mood, colors, and composition to create a playlist that captures its essence in musical form.
*   **Generate custom playlist covers** Let your imagination run wild in a prompt that is used to generate a custom playlist cover.
*   **Spotify Integration:** Seamlessly connect to your Spotify account to generate and save playlists directly to your library.

## Technologies Used

*   **Frontend:** React, CSS
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Amazon S3
*   **AI:** Open AI API
*   **Other:** Spotify API

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
        PORT=[port number]
        MONGO_URI=[MongoDB connection string]
        SPOTIFY_CLIENT_ID=[Your Spotify Client ID]
        SPOTIFY_CLIENT_SECRET=[Your Spotify Client Secret]
        SPOTIFY_REDIRECT_URI=[Your Spotify Redirect URI]
        ```

    *   Obtain your Spotify API credentials by creating an app on the Spotify Developer Dashboard.
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

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.
