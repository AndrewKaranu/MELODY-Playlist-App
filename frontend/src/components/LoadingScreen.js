import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistGame from '../pages/ArtistGame';
import './styles/LoadingScreen.css';

const LoadingScreen = ({ playlistId, onError, onComplete }) => {
    const [status, setStatus] = useState('Starting playlist generation...');
    const [isComplete, setIsComplete] = useState(false);
    const [spotifyId, setSpotifyId] = useState(null);
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const pollStatus = async () => {
        if (!playlistId) return;

        try {
            const response = await fetch(`/api/playlists/status/${playlistId}`);
            
            if (response.status === 404) {
                setIsComplete(true);
                onComplete(playlistId);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setStatus(data.status);

            if (data.status === 'complete') {
                setIsComplete(true);
                setSpotifyId(data.spotifyId);
                onComplete(data.playlistId);
            } else if (data.status === 'error') {
                onError(data.message || 'An error occurred during playlist generation');
            } else {
                timeoutRef.current = setTimeout(pollStatus, 2000);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            timeoutRef.current = setTimeout(pollStatus, 5000);
        }
    };

    useEffect(() => {
        pollStatus();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [playlistId]);

    const handleViewPlaylist = () => {
        navigate(`/playlist/${spotifyId}`);
    };

    return (
        <div className="loading-screen">
            <h2>Generating Your Playlist</h2>
            {!isComplete && (
                <>
                    <p>{status}</p>
                    <div className="loader"></div>
                </>
            )}
            {isComplete && (
                <button onClick={handleViewPlaylist}>View Your Playlist</button>
            )}
            <ArtistGame />
        </div>
    );
};

export default LoadingScreen;