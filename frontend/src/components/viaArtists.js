import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './ViaArtistsForm.css';

const ViaArtistsForm = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');
  const [showSearch, setShowSearch] = useState(false);


  useEffect(() => {
    // Fetch top artists on component mount
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
      setSelectedArtists([...selectedArtists, artist]);
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
        console.error('No artists selected');
        return;
      }

      const response = await axios.post('/api/playlists/createWithArtists', { 
        noOfSongs: 30,  //Code into frontend
        providedArtists: selectedArtists
      });
      console.log('Generated playlist:', response.data);
    } catch (error) {
      console.error('Error generating playlist:', error);
    }
  };
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };
  return (
    <div>
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

      <h3>Selected Artists</h3>
      <ul>
        {selectedArtists.map(artist => (
          <li key={artist.id}>
            {artist.name}
            <button onClick={() => removeArtist(artist.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <button onClick={generatePlaylist}>Generate Playlist</button>
    </div>
  );
};

export default ViaArtistsForm;