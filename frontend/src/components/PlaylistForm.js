import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { usePlaylistContext } from "../hooks/usePlaylistsContext";

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

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

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
                setError(json.error);
            } else {
                setPrompt('');
                setNoOfSongs(1);
                setCoverImage(null);
                setCoverPrompt('');
                setError(null);
                console.log('New Playlist Added', json);
                dispatch({type: 'CREATE_PLAYLIST', payload: json});
                navigate('/dashboard');
            }
        } catch (error) {
            setError('An error occurred while creating the playlist');
        }
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        setCoverImage(file);
        setUseCoverPrompt(false);
    };

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Create a new playlist</h3>
            <label>Prompt:</label>
            <input
                type="text"
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
            />
            <label>Number of Songs:</label>
            <input
                type="number"
                onChange={(e) => setNoOfSongs(parseInt(e.target.value, 10))}
                value={noOfSongs}
                min="1"
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
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    disabled={useCoverPrompt}
                />
                Upload Cover Image
            </label>
            <label>
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
                Generate Cover Image
            </label>
            {useCoverPrompt && (
                <input
                    type="text"
                    placeholder="Enter prompt for cover image"
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                />
            )}
            <button>Create Playlist</button>
            {error && <div className="error">{error}</div>}
        </form>
    );
};

export default PlaylistForm;