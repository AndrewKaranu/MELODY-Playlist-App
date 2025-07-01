import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './ViaArtistsForm.css';

const TopArtists = () => {
  const [topArtists, setTopArtists] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');

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


  return (
    <div className="via-artists-form">
      
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopArtists;