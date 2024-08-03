import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaylistForm from '../components/PlaylistForm';
import HistoryForm from '../components/ViaSongs';
import ViaTracksForm from '../components/ViaTracks';
import ViaArtistsForm from '../components/viaArtists';
import ImageInputForm from '../components/ViaImage';
import './styles/CreatePlaylist.css';

const CreatePlaylist = () => {
  const [activeView, setActiveView] = useState('prompt');
  const navigate = useNavigate();

  const renderActiveView = () => {
    switch (activeView) {
      case 'history':
        return <HistoryForm />;
      case 'tracks':
        return <ViaTracksForm />;
      case 'artists':
        return <ViaArtistsForm />;
      case 'images':
        return <ImageInputForm />;
      case 'prompt':
      default:
        return <PlaylistForm />;
    }
  };

  return (
    <div className="create-playlist">
      <div className="button-group">
        <button
          onClick={() => setActiveView('prompt')}
          className={activeView === 'prompt' ? 'active' : ''}
        >
          Generate via Prompt
        </button>
        <button
          onClick={() => setActiveView('tracks')}
          className={activeView === 'tracks' ? 'active' : ''}
        >
          Generate from Songs
        </button>
        <button
          onClick={() => setActiveView('artists')}
          className={activeView === 'artists' ? 'active' : ''}
        >
          Generate from Artists
        </button>
        <button
          onClick={() => setActiveView('images')}
          className={activeView === 'images' ? 'active' : ''}
        >
          Generate from Images
        </button>
      </div>
      <div className="form-container">
        {renderActiveView()}
      </div>
      <button className="back-to-dashboard" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default CreatePlaylist;