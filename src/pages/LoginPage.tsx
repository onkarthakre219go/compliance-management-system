import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, loginUserThunk } from '../store/authSlice';
import { Link as RouterLink } from 'react-router-dom';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [emailOrUsername, setEmailOrUsername] = useState('admin@firm.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    await dispatch(
      loginUserThunk({
        emailOrUsername: emailOrUsername.trim(),
        passwordStr: password,
      })
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-end' },
        backgroundImage: `linear-gradient( rgba(6,10,20,0.45), rgba(6,10,20,0.45) ), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=60')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520, mr: { xs: 0, md: 8 }, my: { xs: 6, md: 0 } }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={6}
          sx={{
            width: '100%',
            p: 5,
            bgcolor: 'rgba(7,22,40,0.7)',
            borderRadius: 2,
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 54, height: 54, borderRadius: '50%', bgcolor: '#0b2540', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #d4af37' }}>
              <Typography sx={{ color: '#d4af37', fontWeight: 800, fontFamily: 'monospace' }}>CA</Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 0.2 }}>
                Compliance Management
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                Chartered Accountants firm dashboard
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2 }}>
            Sign in to manage clients, tasks, invoices, and compliance deadlines
          </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

          <TextField
            label="Email or username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            fullWidth
            required
            autoComplete="username"
            sx={{ mb: 2, background: 'rgba(0,0,0,0.35)', borderRadius: 1 }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            autoComplete="current-password"
            sx={{ mb: 3, background: 'rgba(0,0,0,0.35)', borderRadius: 1 }}
            InputProps={{ sx: { color: '#fff' } }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ py: 1.25, textTransform: 'none', fontWeight: 700, bgcolor: '#d4af37', color: '#07203a', '&:hover': { bgcolor: '#b5892f' } }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Demo: admin@firm.com / password123
            </Typography>
            <Link component={RouterLink} to="/register" underline="none" sx={{ color: '#d4af37', fontWeight: 700 }}>
              Create account
            </Link>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
