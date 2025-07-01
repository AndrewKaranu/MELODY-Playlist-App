import * as React from 'react';
import Button from '@mui/material/Button';

const ButtonUsage = () => {
    const redirectCreate = () => {
        window.location.href = 'http://localhost:3000/TopCharts';
      };
    return <Button onClick={redirectCreate} variant="contained">Top Charts</Button>;
  }

export default ButtonUsage;