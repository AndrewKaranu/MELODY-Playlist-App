import * as React from 'react';
import Button from '@mui/material/Button';

const ButtonUsage = () => {
    const redirectCreate = () => {
        window.location.href = 'http://localhost:3000/OpenGame';
      };
    return <Button onClick={redirectCreate} variant="contained">Higher or Lower</Button>;
  }

export default ButtonUsage;