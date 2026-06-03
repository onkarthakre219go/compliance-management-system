import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, Link } from '@mui/material';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [firmName, setFirmName] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firmName || !fullName || !username || !email || !password) return setError('Please fill all required fields');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { username, firmName, fullName, email, password });
      if (res.data?.status === 'success') {
        navigate('/');
      } else {
        setError(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-end' },
        px: 2,
        backgroundImage: `linear-gradient(rgba(6,10,20,0.5), rgba(6,10,20,0.5)), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=60')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520, mr: { xs: 0, md: 8 }, my: { xs: 4, md: 0 } }}>
        <Paper component="form" onSubmit={handleSubmit} sx={{ width: '100%', p: 4, borderRadius: 2, bgcolor: 'rgba(7,22,40,0.8)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
            Create your account
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 3 }}>
            Register your CA firm to start managing clients, invoices and compliance.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Hidden fields to reduce browser autofill */}
          <input autoComplete="username" name="fake-username" style={{ display: 'none' }} />
          <input autoComplete="new-password" name="fake-password" style={{ display: 'none' }} />

          <TextField label="Firm name" value={firmName} onChange={(e) => setFirmName(e.target.value)} fullWidth required sx={{ mb: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />
          <TextField label="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth required sx={{ mb: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth required helperText="At least 3 characters" sx={{ mb: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />
          <TextField label="Email" name="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required sx={{ mb: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />
          <TextField label="Password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required sx={{ mb: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />
          <TextField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth required sx={{ mb: 3, background: 'rgba(0,0,0,0.25)', borderRadius: 1 }} slotProps={{ input: { sx: { color: '#fff' } } }} />

          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.25, textTransform: 'none', fontWeight: 700, bgcolor: '#d4af37', color: '#07203a', '&:hover': { bgcolor: '#b98f2b' } }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              Already have an account?
            </Typography>
            <Link component={RouterLink} to="/login" underline="none" sx={{ color: '#d4af37', fontWeight: 700 }}>
              Back to sign in
            </Link>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
