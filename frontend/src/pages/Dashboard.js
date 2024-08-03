import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SpotifyLogoutButton from "../components/SpotifyLogoutButton";
import CreatePlaylistButton from "../components/CreatePlayListButton";
import OpenGameButton from "../components/OpenGameButton";
import Playlistdetails from "../components/Playlistdetails";
import { usePlaylistContext } from "../hooks/usePlaylistsContext";
import './styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const { playlists, dispatch } = usePlaylistContext();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/auth/current-user', { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const fetchPlaylists = async () => {
      try {
        const response = await fetch("/api/playlists");
        const json = await response.json();
        if (response.ok) {
          dispatch({ type: 'SET_PLAYLIST', payload: json });
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    fetchUser();
    fetchPlaylists();
  }, [dispatch]);

  return (
    <div className="dashboard">
      {user ? (
        <>
          <h1>Welcome, {user.username}</h1>
          <p>Email: {user.email}</p>
        </>
      ) : (
        <p>Loading user information...</p>
      )}
      <div className="dashboard-buttons">
        <div className="createPlaylist">
          <CreatePlaylistButton />
        </div>
        <div className="OpenGame">
          <OpenGameButton />
        </div>
        <div className="logout">
          <SpotifyLogoutButton />
        </div>
      </div>
      <div className="playlists">
        {playlists && playlists.map(playlist => (
          <Playlistdetails key={playlist._id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
