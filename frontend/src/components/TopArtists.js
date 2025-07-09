import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TopArtists.css';

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
        setTopArtists(response.data.topArtists || []);
      } catch (error) {
        console.error('Error fetching top artists:', error);
      }
    };
    fetchTopArtists(timeframe);
  }, [timeframe]);


  return (
    <div className="top-artists-container" id="top-artists-container">
      <h3>Top Artists</h3>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        <option value="short_term">Last 4 weeks</option>
        <option value="medium_term">Last 6 months</option>
        <option value="long_term">All time</option>
      </select>
      <div className="podium">
        {topArtists.length >= 3 && (
          <>
            <div className="podium-item second">
              <div 
                className="artists pod" 
                style={{backgroundImage: `url(${topArtists[1].imageUrl})`}}
                alt={topArtists[1].name}
              >
              </div>
              <p>{topArtists[1].name}</p>
            </div>
            <div className="podium-item first">
              <div 
                className="artists pod" 
                style={{backgroundImage: `url(${topArtists[0].imageUrl})`}}
                alt={topArtists[0].name}
              >
              </div>
              <p>{topArtists[0].name}</p>
            </div>
            <div className="podium-item third">
              <div 
                className="artists pod" 
                style={{backgroundImage: `url(${topArtists[2].imageUrl})`}}
                alt={topArtists[2].name}
              >
              </div>
              <p>{topArtists[2].name}</p>
            </div>
          </>
        )}
      </div>
      <div className="rest-list">
        {topArtists.slice(3).map((artist, index) => (
          <div key={artist.id} className="rest-item">
            <span className="rank-number">{index + 4}</span>
            <div
              className="artists"
              style={{backgroundImage: `url(${artist.imageUrl})`}}
            >
            </div>
            <div className="artist-info">
              <p>{artist.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopArtists;