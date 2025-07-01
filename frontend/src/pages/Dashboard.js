import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SpotifyLogoutButton from "../components/SpotifyLogoutButton";
import CreatePlaylistButton from "../components/CreatePlayListButton";
import OpenGameButton from "../components/OpenGameButton";
import Playlistdetails from "../components/Playlistdetails";
import Notification from '../components/Notification';
import { usePlaylistContext } from "../hooks/usePlaylistsContext";
import './styles/Dashboard.css';
import TopChartsButton from "../components/TopChartsButton";
import VoiceAgentButton from "../components/VoiceAgentButton.js";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const { playlists, dispatch } = usePlaylistContext();
  const [localPlaylists, setLocalPlaylists] = useState([]);
  const [notification, setNotification] = useState({ visible: false, message: '' });

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
          // Sort playlists in reverse order (newest first)
          const sortedPlaylists = [...json].reverse();
          dispatch({ type: 'SET_PLAYLIST', payload: sortedPlaylists });
          setLocalPlaylists(sortedPlaylists);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    fetchUser();
    fetchPlaylists();
  }, [dispatch]);

  const handleDelete = (deletedPlaylistId) => {
    setLocalPlaylists(prevPlaylists =>
      prevPlaylists.filter(playlist => playlist._id !== deletedPlaylistId)
    );
    setNotification({ visible: true, message: 'Playlist deleted successfully!' });
  };

  const closeNotification = () => {
    setNotification({ visible: false, message: '' });
  };

  return (
    <div className="dashboard">
      {user ? (
        <div className="user-info">
          {user.profilePicture && (
            <img src={user.profilePicture} alt="Profile" className="profile-picture" />
          )}
          <div className="user-details">
            <h1>Welcome, {user.username}</h1>
            <p>Email: {user.email}</p>
          </div>
        </div>
      ) : (
        <p>Loading user information...</p>
      )}
      <div className="dashboard-buttons">
        <div className="createPlaylist">
          <CreatePlaylistButton />
        </div>
        <div className="createPlaylist">
          <TopChartsButton />
        </div>
        <div className="createPlaylist">
          <VoiceAgentButton />
        </div>
        {/* <div className="OpenGame">
          <OpenGameButton />
        </div> */}
        <div className="logout">
          <SpotifyLogoutButton />
        </div>
      </div>
      <div className="playlists">
        {localPlaylists.map(playlist => (
          <Playlistdetails key={playlist._id} playlist={playlist} onDelete={handleDelete} />
        ))}
      </div>
      <Notification 
        message={notification.message}
        isVisible={notification.visible}
        onClose={closeNotification}
      />
    </div>
  );
};

export default Dashboard;