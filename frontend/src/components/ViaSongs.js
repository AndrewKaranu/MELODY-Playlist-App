import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { usePlaylistContext } from "../hooks/usePlaylistsContext";

const ViaSongsForm = () => {
    const {dispatch} = usePlaylistContext()
    const [prompt, setPrompt] = useState('')
    const [noOfSongs, setnoOfSongs] = useState(1)
    const [useHistory, setUseHistory] = useState(false)
    const [timeframe, setTimeframe] = useState('short_term')
    const [error, setError] = useState(null)

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        const playlist = {prompt, noOfSongs}
        const endpoint = useHistory ? '/api/playlists//createWithHistory' : '/api/playlists/create'
        const body = useHistory ? {...playlist, timeframe} : playlist

        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok) {
            setPrompt('')
            setnoOfSongs('')
            setError(null)
            console.log('New Playlist Added', json)
            dispatch({type: 'CREATE_PLAYLIST', payload: json})
            navigate('/dashboard')
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Create a new playlist from Songs</h3>
            <label>Prompt:</label>
            <input 
                type="text" 
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
            />
            <label>Number of Songs:</label>
            <input 
                type="number" 
                onChange={(e) => setnoOfSongs(parseInt(e.target.value, 10))}
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
            <button>Create Playlist</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default ViaSongsForm
