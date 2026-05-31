import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import Sidebar from './Sidebar';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginPage from '../pages/LoginPage';
import { useAppDispatch, useAppSelector } from '../store';
import { logoutUserThunk, validateSessionThunk } from '../store/authSlice';

export default function Layout() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (localStorage.getItem('cms_session_token')) {
      dispatch(validateSessionThunk());
    }
  }, [dispatch]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#020617',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', bgcolor: '#020617' }}>
      
      {/* Sidebar Controller */}
      <Sidebar />

      {/* Primary viewport panel */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden' 
        }}
      >
        
        {/* System level bar */}
        <Box 
          sx={{ 
            height: 64, 
            borderBottom: '1px solid #1e293b', 
            bgcolor: '#090d16', 
            px: 4, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'monospace', letterSpacing: 0.5 }}>
              Compliance Management System
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user.fullName} ({user.role})
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={() => dispatch(logoutUserThunk())}
              sx={{ textTransform: 'none' }}
            >
              Sign out
            </Button>
            <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
              UTC TIME: {timeStr}
            </span>
          </Box>
        </Box>

        {/* Content workspace window */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            bgcolor: '#020617', 
            px: 4, 
            py: 3 
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
