import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import './styles/EditPlaylist.css';
import './styles/CreatePlaylist.css';


const EditPlaylist = () => {
  const { id } = useParams();
  const playlistUrl = `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;
  const navigate = useNavigate();

  return (
    <div className='edit'>
      <div>
        <h1>Search Songs to add</h1>
        <SearchBar playlistId={id} className="search-bar"/>
        <div>
      <iframe className='playlist-iframe'
        style={{ borderRadius: '12px', minHeight: '360px' }}
        src={playlistUrl}
        width="80%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
      <button className="back-to-dashboard" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
    </div>
      </div>
    </div>
  );
};

export default EditPlaylist;
