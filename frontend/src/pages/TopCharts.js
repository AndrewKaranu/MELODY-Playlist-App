import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaylistForm from '../components/PlaylistForm';
import HistoryForm from '../components/ViaSongs';
import ViaTracksForm from '../components/ViaTracks';
import ViaArtistsForm from '../components/viaArtists';
import ImageInputForm from '../components/ViaImage';
import './styles/CreatePlaylist.css';

const TopCharts = () => {
  const [activeView, setActiveView] = useState('tracks');
  const navigate = useNavigate();

  const renderActiveView = () => {
    switch (activeView) {
      case 'tracks':
        return <ViaTracksForm />;
      case 'artists':
        return <ViaArtistsForm />;
      case 'prompt':
      default:
        return <PlaylistForm />;
    }
  };

  return (
    <div className="create-playlist">
      <div className="button-group-2">
        <button
          onClick={() => setActiveView('tracks')}
          className={activeView === 'tracks' ? 'active' : ''}
        >
          Top Tracks
        </button>
        <button
          onClick={() => setActiveView('artists')}
          className={activeView === 'artists' ? 'active' : ''}
        >
          Top Artists
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

export default TopCharts;