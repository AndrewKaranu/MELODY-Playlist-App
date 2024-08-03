import React from 'react';
import { useParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

const EditPlaylist = () => {
  const { id } = useParams();
  const playlistUrl = `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;

  return (
    <div>
      <h2>Edit a Playlist</h2>
      <div>
        <h1>Manage Your Playlists</h1>
        <SearchBar playlistId={id} />
        <div>
      <iframe
        style={{ borderRadius: '12px', minHeight: '360px' }}
        src={playlistUrl}
        width="100%"
        height="150%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
      </div>
    </div>
  );
};

export default EditPlaylist;
