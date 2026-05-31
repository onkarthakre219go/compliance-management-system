import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: SidebarItem[] = [
  { name: 'Clients', path: '/clients', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
  { name: 'Tasks', path: '/tasks', icon: <AssignmentIcon sx={{ fontSize: 18 }} /> },
  { name: 'Invoices', path: '/invoices', icon: <ReceiptLongIcon sx={{ fontSize: 18 }} /> },
  { name: 'Compliance Calendar', path: '/compliance-calendar', icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
  { name: 'Reports', path: '/reports', icon: <AssessmentIcon sx={{ fontSize: 18 }} /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Paper
      sx={{
        width: 250,
        height: '100%',
        borderRight: '1px solid #1e293b',
        bgcolor: '#090d16',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          Compliance CMS
        </Typography>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            background: '#1e293b',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#10b981',
            fontFamily: 'monospace',
          }}
        >
          CMS
        </span>
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ flexGrow: 1, px: 2, py: 3 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: 2,
                    bgcolor: isActive ? '#1e293b' : 'transparent',
                    border: isActive ? '1px solid #334155' : '1px solid transparent',
                    color: isActive ? '#818cf8' : 'text.secondary',
                    '&:hover': {
                      bgcolor: '#141b2d',
                      color: '#ffffff',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? '#818cf8' : 'text.secondary',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: isActive ? 700 : 500, fontSize: '13.5px' }}>
                        {item.name}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #1e293b', bgcolor: '#060a11' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', display: 'block' }}>
          Compliance Management
        </Typography>
      </Box>
    </Paper>
  );
}
