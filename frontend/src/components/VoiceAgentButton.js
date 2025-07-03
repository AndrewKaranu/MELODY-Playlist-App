import * as React from 'react';
import Button from '@mui/material/Button';

const ButtonUsage = () => {
    const redirectCreate = () => {
        window.location.href = 'http://localhost:3000/VoiceAgent';
      };
    return <Button onClick={redirectCreate} variant="contained">Voice Agent</Button>;
  }

export default ButtonUsage;