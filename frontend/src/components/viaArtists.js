import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './ViaArtistsForm.css';
import LoadingScreen from './LoadingScreen';
import Notification from './Notification';

const ViaArtistsForm = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistId, setPlaylistId] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', isVisible: false });

  useEffect(() => {
    const fetchTopArtists = async (timeRange) => {
      try {
        const response = await axios.get('http://localhost:4000/api/playlists/topartists', {
          params: { timeRange },
          withCredentials: true,
        });
        setTopArtists(response.data.topArtists);
      } catch (error) {
        console.error('Error fetching top artists:', error);
      }
    };
    fetchTopArtists(timeframe);
  }, [timeframe]);

  useEffect(() => {
    const searchArtists = async () => {
      if (query.length > 1) {
        try {
          const response = await axios.get(`http://localhost:4000/api/playlists/searchArtists?query=${query}`, {
            withCredentials: true
          });
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error searching for artists:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchArtists, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  const addArtist = (artist) => {
    if (!selectedArtists.find(a => a.id === artist.id)) {
      const newSelectedArtists = [...selectedArtists, artist];
      setSelectedArtists(newSelectedArtists);
      if (newSelectedArtists.length === 1) {
        setSidebarOpen(true);
      }
    }
    setSearchResults([]);
    setQuery('');
  };

  const removeArtist = (artistId) => {
    setSelectedArtists(selectedArtists.filter(artist => artist.id !== artistId));
  };

  const generatePlaylist = async () => {
    try {
      if (selectedArtists.length === 0) {
        setError('No artists selected');
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await axios.post('/api/playlists/createWithArtists', { 
        noOfSongs: 30,
        providedArtists: selectedArtists
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
    <div className="via-artists-form">
      <h2>Create Playlist from Artists</h2>
      
      <button onClick={toggleSearch}>Search for artists</button>

      <h3>Top Artists</h3>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        <option value="short_term">Last 4 weeks</option>
        <option value="medium_term">Last 6 months</option>
        <option value="long_term">All time</option>
      </select>

      <div className="top-items">
        {topArtists.map(artist => (
          <div key={artist.id} className="top-item">
            <img src={artist.imageUrl} alt={artist.name} />
            <p>{artist.name}</p>
            <button onClick={() => addArtist(artist)}>Add to Playlist</button>
          </div>
        ))}
      </div>

      {showSearch && (
        <div className="search-results">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search for artists..."
          />
          <ul>
            {searchResults.map((artist) => (
              <li key={artist.id} onClick={() => addArtist(artist)}>
                <img src={artist.imageUrl} alt={artist.name} width="50" />
                <p>{artist.name}</p>
              </li>
            ))}
          </ul>
          <button onClick={toggleSearch}>Close</button>
        </div>
      )}

      <div className={`selected-artists-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="toggle-sidebar" onClick={toggleSidebar}>
          {sidebarOpen ? '>' : '<'}
        </button>
        <h3>Selected Artists</h3>
        <ul>
          {selectedArtists.map(artist => (
            <li key={artist.id}>
              <img src={artist.imageUrl} alt={artist.name} />
              <div className="artist-info">
                <p>{artist.name}</p>
              </div>
              <button onClick={() => removeArtist(artist.id)}>X</button>
            </li>
          ))}
        </ul>
        {selectedArtists.length > 0 && (
          <button className="generate-playlist" onClick={generatePlaylist}>Generate Playlist</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default ViaArtistsForm;