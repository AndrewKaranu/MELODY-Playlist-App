import * as React from 'react';
import Button from '@mui/material/Button';

const ButtonUsage = () => {
    const redirectCreate = () => {
        window.location.href = 'http://localhost:3000/CreatePlaylist';
      };
    return <Button onClick={redirectCreate} variant="contained">Create Playlist</Button>;
  }

export default ButtonUsage;