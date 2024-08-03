import React from 'react';
import { useParams } from 'react-router-dom';

const PlaylistPlayer = () => {
  const { id } = useParams();
  const playlistUrl = `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;

  console.log("This Here: "+id)

  return (
    <div>
      <h2>Playlist Player</h2>
      <iframe
        style={{ borderRadius: '12px', minHeight: '360px' }}
        src={playlistUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  );
};

export default PlaylistPlayer;
