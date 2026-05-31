import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 12,
        textAlign: 'center' 
      }}
    >
      <Typography variant="h1" color="primary" sx={{ fontWeight: 800, mb: 1, textShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Path Not Indexed
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 450, mb: 4 }}>
        The frontend router intercepted this path request, but there is no view registered under this coordinate segment.
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/clients')}
        startIcon={<ArrowBackIcon />}
      >
        Return to Clients
      </Button>
    </Box>
  );
}
