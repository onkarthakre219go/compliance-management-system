import React from 'react';
import { useAppSelector } from '../store';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper,
  Chip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';

export default function Dashboard() {
  const metrics = useAppSelector((state) => state.demo.metrics);

  const folderStructure = [
    { name: 'src/api/', desc: 'Axios clients, interceptors for JWT, refresh handler and endpoints', type: 'folder' },
    { name: 'src/store/', desc: 'Redux Toolkit store config, typescript hooks and feature slices', type: 'folder' },
    { name: 'src/theme/', desc: 'Material UI theme values, typography pairings and component style overrides', type: 'folder' },
    { name: 'src/components/', desc: 'Reusable atomic and layout UI components in the application', type: 'folder' },
    { name: 'src/pages/', desc: 'Representations of routing targets and view modules', type: 'folder' },
    { name: 'src/types/', desc: 'Global TS files defining shapes of state, users, and generic utilities', type: 'folder' },
  ];

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
          Architecture Framework Control Panel
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Visualize and interact with the production-ready frontend boilerplate built using React, TypeScript, Redux Toolkit, React Router, Material UI, and Axios.
        </Typography>
      </Box>

      {/* Grid of Core Architecture Capabilities */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.id}>
            <Card sx={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)', boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                    {metric.name}
                  </Typography>
                  <Chip 
                    label={metric.status} 
                    size="small" 
                    color={metric.status === 'optimal' ? 'success' : 'warning'}
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'font-mono' }}>
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Structural Information Section */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <FolderIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Project Folder Layout Structure
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              The system utilizes a clean, modular structure following top-tier industry patterns. Here is the active layout that has been established:
            </Typography>

            <List sx={{ p: 0 }}>
              {folderStructure.map((item, idx) => (
                <ListItem 
                  key={idx} 
                  sx={{ 
                    borderBottom: idx < folderStructure.length - 1 ? '1px solid #1e293b' : 'none',
                    py: 1.5,
                    px: 0
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CodeIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13, color: 'primary.light' }}>{item.name}</Typography>}
                    secondary={<Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{item.desc}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ p: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Technical Foundations
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                  Every layer is engineered to be type-safe, extensible, and fully integrated with standard modern tooling.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  You can browse around page views using the left navigation dock, dispatch global state changes, inspect pre-configured Axios interceptor logs, and play with nested Material UI components seamlessly.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'primary.light' }}>
                  Boilerplate Active State
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Modify client parameters easily or deploy live modules on top.
                </Typography>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Chip label="React 19" variant="outlined" size="small" />
                  <Chip label="TypeScript 5" variant="outlined" size="small" />
                  <Chip label="Redux Toolkit 2" variant="outlined" size="small" />
                </div>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
