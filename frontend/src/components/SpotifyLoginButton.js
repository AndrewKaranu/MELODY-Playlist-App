import React from 'react';
import './styles/LoginButton.css';

const SpotifyLoginButton = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/spotify';
  };

  return (

    <button onClick={handleLogin}>
      Login with Spotify
    </button>
  );
};

export default SpotifyLoginButton;
