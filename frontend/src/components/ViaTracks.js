import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViaTracksForm.css';
import Notification from './Notification';
import LoadingScreen from './LoadingScreen';
const ViaTracksForm = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistId, setPlaylistId] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', isVisible: false });

  useEffect(() => {
    // Fetch top tracks on component mount
    const fetchTopTracks = async (timeRange) => {
      try {
        const response = await axios.get('http://localhost:4000/api/playlists/toptracks', {
          params: { timeRange },
          withCredentials: true,
        });
        setTopTracks(response.data.topTracks.map(track => ({
          ...track,
          releaseDate: new Date(track.releaseDate).getFullYear() > 2022 ? track.releaseDate : null,
        })));
      } catch (error) {
        console.error('Error fetching top tracks:', error);
      }
    };
    fetchTopTracks(timeframe);
  }, [timeframe]);

  useEffect(() => {
    const searchSongs = async () => {
      if (query.length > 1) {
        try {
          const response = await axios.get(`http://localhost:4000/api/playlists/search?query=${query}`, {
            withCredentials: true
          });
          setSearchResults(response.data.map(track => ({
            ...track,
            releaseDate: new Date(track.releaseDate).getFullYear() > 2022 ? track.releaseDate : null,
          })));
        } catch (error) {
          console.error('Error searching for tracks:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchSongs, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  const addTrack = (track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      const newSelectedTracks = [...selectedTracks, track];
      setSelectedTracks(newSelectedTracks);
      if (newSelectedTracks.length === 1) {
        setSidebarOpen(true);
      }
    }
    setSearchResults([]);
    setQuery('');
  };

  const removeTrack = (trackId) => {
    setSelectedTracks(selectedTracks.filter(track => track.id !== trackId));
  };

  const generatePlaylist = async () => {
    try {
      if (selectedTracks.length === 0) {
        setError('No tracks selected');
        return;
      }
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/api/playlists/createWithTracks', { 
        noOfSongs: selectedTracks.length,
        providedTracks: selectedTracks
      });

      if (response.data.error?.includes('Daily playlist limit reached')) {
        setNotification({
          message: 'Daily playlist limit (10) reached. Please try again tomorrow.',
          isVisible: true
        });
        setIsLoading(false);
        return;
      }

      setPlaylistId(response.data.tempId);
    } catch (error) {
      console.error('Error generating playlist:', error);
      if (error.response?.data?.error?.includes('Daily playlist limit reached')) {
        setNotification({
          message: 'Daily playlist limit (10) reached. Please try again tomorrow.',
          isVisible: true
        });
      } else {
        setError('Error generating playlist. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, isVisible: false });
  };
  if (isLoading || playlistId) {
    return (
      <LoadingScreen 
        playlistId={playlistId}
        onError={(errorMessage) => {
          setError(errorMessage);
          setIsLoading(false);
          setPlaylistId(null);
        }}
        onComplete={(newPlaylistId) => {
          setIsLoading(false);
          
        }}
      />
    );
  }
    const toggleSearch = () => {
      setShowSearch(!showSearch);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="via-tracks-form">
      <h2>Create Playlist from Songs</h2>
      <p>Works best with songs released before 2022</p>
      
      <button onClick={toggleSearch}>Search for songs</button>

      <h3>Top Tracks</h3>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        <option value="short_term">Last 4 weeks</option>
        <option value="medium_term">Last 6 months</option>
        <option value="long_term">All time</option>
      </select>

      <div className="top-items">
        {topTracks.map(track => (
          <div key={track.id} className="top-item">
            <img src={track.imageUrl} alt={track.name} />
            <p>{track.name}</p>
            <p>{track.artists}</p>
            <button onClick={() => addTrack(track)}>Add to Playlist</button>
          </div>
        ))}
      </div>

      {showSearch && (
        <div className="search-results">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search for songs..."
          />
          <ul>
            {searchResults.map((track) => (
              <li key={track.id} onClick={() => addTrack(track)}>
                <img src={track.imageUrl} alt={track.name} width="50" />
                <div>
                  <p>{track.name}</p>
                  <p>{track.artists}</p>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={toggleSearch}>Close</button>
        </div>
      )}

  <div className={`selected-tracks-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="toggle-sidebar" onClick={toggleSidebar}>
          {sidebarOpen ? '>' : '<'}
        </button>
        <h3>Selected Tracks</h3>
        <ul>
          {selectedTracks.map(track => (
            <li key={track.id}>
              <img src={track.imageUrl} alt={track.name} />
              <div className="track-info">
                <p>{track.name}</p>
                <p>{track.artists}</p>
              </div>
              <button onClick={() => removeTrack(track.id)}>X</button>
            </li>
          ))}
        </ul>
        {selectedTracks.length > 0 && (
          <button className="generate-playlist" onClick={generatePlaylist}>Generate Playlist</button>
        )}
      </div>
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default ViaTracksForm;