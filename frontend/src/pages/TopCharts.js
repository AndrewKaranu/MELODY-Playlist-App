import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/CreatePlaylist.css';
import '../components/TopTracks.css';
import '../components/TopArtists.css';

const TopCharts = () => {
  const [activeView, setActiveView] = useState('tracks');
  const [items, setItems] = useState([]);
  const [timeframe, setTimeframe] = useState('medium_term');
  const embedControllerRef = useRef(null);
  const playlistUrl = 'https://open.spotify.com/embed/iframe-api/v1';
  const navigate = useNavigate();

  // Fetch top tracks or artists when activeView or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      const endpoint = activeView === 'tracks' ? 'toptracks' : 'topartists';
      try {
        const res = await axios.get(`http://localhost:4000/api/playlists/${endpoint}`, {
          params: { timeRange: timeframe },
          withCredentials: true,
        });
        const data = activeView === 'tracks' ? res.data.topTracks : res.data.topArtists;
        setItems(data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [activeView, timeframe]);

  // Initialize Spotify IFrame API
  useEffect(() => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const el = document.getElementById('embed-iframe');
      if (el && !embedControllerRef.current) {
        IFrameAPI.createController(el, { width: '100%', height: '160', uri: '' }, (controller) => {
          embedControllerRef.current = controller;
        });
      }
    };

    // Then inject Spotify IFrame API script once
    if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
      const script = document.createElement('script');
      script.src = playlistUrl;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handle click: if track, play directly; if artist, fetch top track then play
  const handleClick = async (id) => {
    let uri;
    if (activeView === 'tracks') {
      uri = `spotify:track:${id}`;
    } else {
      try {
        const res = await axios.get('http://localhost:4000/api/playlists/artist-top-tracks', {
          params: { artistId: id },
          withCredentials: true,
        });
        const top = res.data.artistTopTracks?.[0];
        uri = top ? `spotify:track:${top.id}` : null;
      } catch (e) {
        console.error('Error fetching artist top track:', e);
      }
    }
    if (uri && embedControllerRef.current) {
      embedControllerRef.current.loadUri(uri);
      embedControllerRef.current.play();
    }
    // show player
    const iframe = document.querySelector('#embed-iframe iframe');
    if (iframe) iframe.style.display = 'block';
  };

  return (
    <div className="create-playlist">
      <div className="button-group-2">
        <button onClick={() => setActiveView('tracks')} className={activeView === 'tracks' ? 'active' : ''}>Top Tracks</button>
        <button onClick={() => setActiveView('artists')} className={activeView === 'artists' ? 'active' : ''}>Top Artists</button>
      </div>
      <div className="form-container">
          <div className={activeView === 'tracks' ? 'top-tracks-container' : 'top-artists-container'}>
          <div id="embed-iframe" className="player"></div>
          <h3>{activeView === 'tracks' ? 'Top Tracks' : 'Top Artists'}</h3>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="short_term">Last 4 weeks</option>
            <option value="medium_term">Last 6 months</option>
            <option value="long_term">All time</option>
          </select>
          <div className="podium">
            {items.length >= 3 && [1, 0, 2].map((idx, order) => (
              <div key={items[idx].id} className={`podium-item ${['second','first','third'][order]}`}> 
                <button
                  className={`${activeView === 'tracks' ? 'tracks' : 'artists'} pod`}
                  onClick={() => handleClick(items[idx].id)}
                  style={{ backgroundImage: `url(${items[idx].imageUrl})` }}
                />
                <p>{items[idx].name}</p>
                {activeView === 'tracks' && <p id="artist">{items[idx].artists}</p>}
              </div>
            ))}
          </div>
          <div className="rest-list">
            {items.slice(3).map((item, i) => (
              <div key={item.id} className="rest-item">
                <span className="rank-number">{i + 4}</span>
                <button
                  className="tracks"
                  onClick={() => handleClick(item.id)}
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
                <div>
                  <p>{item.name}</p>
                  {activeView === 'tracks' && <p id="artist">{item.artists}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="back-to-dashboard" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default TopCharts;