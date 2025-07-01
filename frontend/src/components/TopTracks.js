import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViaTracksForm.css';
const TopTracks = () => {
  const [query, setQuery] = useState('');
  const [topTracks, setTopTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');
  const [showSearch, setShowSearch] = useState(false);

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


  return (
    <div className="via-tracks-form">

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

          </div>
        ))}
      </div>
      </div>
  );
};

export default TopTracks;