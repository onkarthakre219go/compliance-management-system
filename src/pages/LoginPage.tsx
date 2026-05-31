import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, loginUserThunk } from '../store/authSlice';

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
        justifyContent: 'center',
        bgcolor: '#020617',
        px: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          bgcolor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
          Compliance Management System
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
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
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          autoComplete="current-password"
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ py: 1.25, textTransform: 'none', fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
        </Button>

        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.disabled' }}>
          Demo: admin@firm.com / password123
        </Typography>
      </Paper>
    </Box>
  );
}
