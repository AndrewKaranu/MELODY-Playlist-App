import React from 'react';

const SpotifyLogoutButton = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/logout';
  };

  return (
    <button onClick={handleLogin}>
      Logout
    </button>
  );
};

export default SpotifyLogoutButton;
