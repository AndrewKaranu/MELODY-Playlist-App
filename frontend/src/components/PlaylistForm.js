import React, { useState } from "react";
import { usePlaylistContext } from "../hooks/usePlaylistsContext";
import LoadingScreen from "./LoadingScreen";
import Notification from "./Notification";

const PlaylistForm = () => {
    const { dispatch } = usePlaylistContext();
    const [prompt, setPrompt] = useState('');
    const [noOfSongs, setNoOfSongs] = useState(1);
    const [useHistory, setUseHistory] = useState(false);
    const [timeframe, setTimeframe] = useState('short_term');
    const [error, setError] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPrompt, setCoverPrompt] = useState('');
    const [useCoverPrompt, setUseCoverPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playlistId, setPlaylistId] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [notification, setNotification] = useState({ message: '', isVisible: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
    
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('noOfSongs', noOfSongs);
        if (useHistory) {
            formData.append('timeframe', timeframe);
        }
    
        if (coverImage) {
            formData.append('coverImage', coverImage);
        } else if (useCoverPrompt) {
            formData.append('coverPrompt', coverPrompt);
        }
    
        const endpoint = useHistory ? '/api/playlists/createWithHistory' : '/api/playlists/create';
    
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });
    
            const json = await response.json();
    
            if (!response.ok) {
                if (json.error?.includes('Daily playlist limit reached')) {
                    setNotification({
                        message: 'Daily playlist limit (10) reached. Please try again tomorrow.',
                        isVisible: true
                    });
                }
                setError(json.error);
                setIsLoading(false);
            } else {
                setPlaylistId(json.tempId);
                setPrompt('');
                setNoOfSongs(1);
                setCoverImage(null);
                setCoverPrompt('');
                setError(null);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, isVisible: false });
    };

    if (isLoading || playlistId) {
        return <LoadingScreen 
            playlistId={playlistId} 
            onError={(errorMessage) => {
                setError(errorMessage);
                setIsLoading(false);
                setPlaylistId(null);
            }}
            onComplete={(newPlaylistId) => {
                setPlaylistId(newPlaylistId);
                setIsLoading(false);
                setIsComplete(true);
            }}
        />;
    }

    if (isComplete) {
        return <LoadingScreen 
            playlistId={playlistId} 
            onError={(errorMessage) => {
                setError(errorMessage);
                setIsComplete(false);
                setPlaylistId(null);
            }}
            onComplete={(newPlaylistId) => {
                setPlaylistId(newPlaylistId);
                setIsComplete(true);
            }}
        />;
    }

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        setCoverImage(file);
        setUseCoverPrompt(false);
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Create a new playlist</h3>
            <label>Prompt:</label>
            <input
                type="text"
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
                required
            />
            <label>Number of Songs:</label>
            <input
                type="number"
                onChange={(e) => setNoOfSongs(parseInt(e.target.value, 10))}
                value={noOfSongs}
                min="1"
                required
            />
            <label>
                <input
                    type="checkbox"
                    checked={useHistory}
                    onChange={(e) => setUseHistory(e.target.checked)}
                />
                Use Listening History
            </label>
            {useHistory && (
                <label>Timeframe:
                    <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                        <option value="short_term">Last 4 weeks</option>
                        <option value="medium_term">Last 6 months</option>
                        <option value="long_term">All time</option>
                    </select>
                </label>
            )}
            <h4>Playlist Cover</h4>
            
            <label>
            <h4>Generate Cover Image (beta)</h4>
                <input
                
                    type="checkbox"
                    checked={useCoverPrompt}
                    onChange={(e) => {
                        setUseCoverPrompt(e.target.checked);
                        if (e.target.checked) {
                            setCoverImage(null);
                        }
                    }}
                />
                {useCoverPrompt && (
                <input
                    type="text"
                    placeholder="Enter prompt for cover image"
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                />
            )}
                
            </label>
            <label>
                Upload image
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    disabled={useCoverPrompt}
                />
                
            </label>
            
            
            <button>Create Playlist</button>
            {error && <div className="error">{error}</div>}

            <Notification
                message={notification.message}
                isVisible={notification.isVisible}
                onClose={handleCloseNotification}
            />
        </form>
    );
};

export default PlaylistForm;