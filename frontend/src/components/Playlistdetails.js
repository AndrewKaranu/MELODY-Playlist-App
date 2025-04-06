import { usePlaylistContext } from "../hooks/usePlaylistsContext";
import { useNavigate } from "react-router-dom";

const PlaylistDetails = ({ playlist, onDelete }) => {
  const { dispatch } = usePlaylistContext();
  const navigate = useNavigate();

  const handleDelete = async () => {
    const response = await fetch('/api/playlists/' + playlist._id, {
      method: 'DELETE'
    });
    const json = await response.json();

    if (response.ok) {
      dispatch({ type: 'DELETE_PLAYLIST', payload: json });
      onDelete(playlist._id); // Call the onDelete function passed from parent
    }
  };

  const handleViewDetails = () => {
    navigate(`/playlist/${playlist.spotifyId}`);
  };

  const handleEdit = () => {
    navigate(`/EditPlaylist/${playlist.spotifyId}`);
  };

  return (
    <div className="playlist-details">
      <h4>{playlist.title}</h4>
      <p><strong>Description: </strong>{playlist.description}</p>
      <p><strong>Number of songs: </strong>{playlist.noOfSongs}</p>
      <p><strong>Created at: </strong>{new Date(playlist.createdAt).toLocaleString()}</p>
      <a href={playlist.spotifyUrl} target="_blank" rel="noopener noreferrer">View on Spotify</a>
      <button onClick={handleViewDetails}>View in player</button>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default PlaylistDetails;