import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { Role } from '../../types';

interface RoleGuardProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 620, p: 4, bgcolor: '#0f172a', border: '1px solid #262f4b' }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1, color: 'white' }}>
              Authentication Required
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              You must be signed in to access this page. Please sign in again or refresh your session.
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Current route: {location.pathname}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role as Role)) {
    return (
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 620, p: 4, bgcolor: '#0f172a', border: '1px solid #262f4b' }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1, color: 'white' }}>
              Access Denied
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Your current role <strong>{auth.user.role}</strong> does not have permission to view this section.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.location.assign('/')}
              sx={{ textTransform: 'none' }}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
