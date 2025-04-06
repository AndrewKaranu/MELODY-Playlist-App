import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Searchbar.css';
import Notification from './Notification'; // Import the Notification component

const SearchBar = ({ playlistId, onSongSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [notification, setNotification] = useState({ message: '', isVisible: false });

  useEffect(() => {
    const searchSongs = async () => {
      if (query.length > 1) {
        try {
          const response = await axios.get(`http://localhost:4000/api/playlists/search?query=${query}`, {
            withCredentials: true
          });
          setResults(response.data);
        } catch (error) {
          console.error('Error searching for tracks:', error);
        }
      } else {
        setResults([]);
      }
    };

    const timeoutId = setTimeout(searchSongs, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  const handleSongSelect = (song) => {
    setSelectedSongs([...selectedSongs, song]);
    setResults([]);
    setQuery('');
  };

  const handleConfirm = async () => {
    try {
      await axios.post('/api/playlists/add-tracks', {
        playlistId: playlistId,
        trackUris: selectedSongs.map(song => song.id)
      }, {
        withCredentials: true
      });

      // Show notification instead of alert
      setNotification({ message: 'Tracks added to playlist!', isVisible: true });

      setSelectedSongs([]);
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, isVisible: false });
  };

  return (
    <div className='search'>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for songs..."
      />
      {results.length > 0 && (
        <ul>
          {results.map((track) => (
            <li key={track.id} onClick={() => handleSongSelect(track)}>
              <img src={track.imageUrl} alt={track.name} width="50" />
              {track.name} by {track.artists}
            </li>
          ))}
        </ul>
      )}
      {selectedSongs.length > 0 && (
        <div>
          <h4>Selected Songs:</h4>
          <ul>
            {selectedSongs.map((song, index) => (
              <li key={index}>
                {song.name} by {song.artists}
              </li>
            ))}
          </ul>
          <button onClick={handleConfirm}>Add to Playlist</button>
        </div>
      )}

      {/* Notification pop-up */}
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
      />
    </div>
  );
};

export default SearchBar;
