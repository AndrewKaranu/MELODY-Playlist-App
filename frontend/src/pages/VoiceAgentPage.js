import React from 'react';
import VoiceAgent from '../components/VoiceAgent';
import './styles/VoiceAgentPage.css';

const VoiceAgentPage = () => {
  return (
    <div className="voice-agent-page">
      <div className="container">
        <div className="page-header">
          {/* <h1>🎵 MELODY Voice Agent</h1> */}
          <p>Talk to your AI music companion and control your Spotify with voice commands</p>
        </div>
        <VoiceAgent />
      </div>
    </div>
  );
};

export default VoiceAgentPage;
