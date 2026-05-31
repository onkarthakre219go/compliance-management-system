import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Paper, 
  TextField, 
  Alert, 
  Stack,
  Tabs,
  Tab,
  MenuItem,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ComponentsDemo() {
  const [activeTab, setActiveTab] = useState(0);
  const [inputText, setInputText] = useState('');
  const [selectValue, setSelectValue] = useState('one');

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
          Reusable MUI Component Toolkit
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Inspect reusable UI configurations customized with exact typography sizes, modern transitions, and colors matching the system theme.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: '1px solid #1e293b' }}
        >
          <Tab label="Interactive Buttons" sx={{ fontWeight: 600, textTransform: 'none' }} />
          <Tab label="Data Cards & Badges" sx={{ fontWeight: 600, textTransform: 'none' }} />
          <Tab label="Form Control Inputs" sx={{ fontWeight: 600, textTransform: 'none' }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* ==================== TAB 0: BUTTONS ==================== */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Interactive Buttons & State Triggers
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                A collection of styled buttons showing hover states, linear slopes, and start/end icon coordinates of MuiButton.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ p: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Contained / Primary</Typography>
                      <Button variant="contained" color="primary" fullWidth startIcon={<SendIcon />}>
                        Dispatch Request
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ p: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Outlined / Secondary</Typography>
                      <Button variant="outlined" color="secondary" fullWidth endIcon={<CheckCircleIcon />}>
                        Mark Complete
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ p: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Async Loading Frame</Typography>
                      <Button variant="contained" color="secondary" fullWidth disabled>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'text.disabled' }} />
                        Saving to Database...
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ==================== TAB 1: CARDS ==================== */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Data Visualization Cards & Alerts
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Styled alerts and modern layouts ideal for warning modals and dashboard counters.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ border: '1px solid #065f46', bgcolor: '#022c22' }}>
                      Operation succeeded - JWT token generated successfully.
                    </Alert>
                    <Alert icon={<InfoIcon fontSize="inherit" />} severity="info" sx={{ border: '1px solid #1e3a8a', bgcolor: '#172554' }}>
                      Redux Toolkit middleware detected state changes safely.
                    </Alert>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
                    <CardContent>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                        BOILERPLATE MODULE LOGS
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                        100% Completed
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        All core modules compile safely with strict TypeScript checking enabled.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ==================== TAB 2: INPUTS ==================== */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Form Control Inputs & Selects
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Type-safe input controls with placeholder values and custom style parameters overrides.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Standard Full-Width Input"
                    placeholder="Enter email e.g. partner@firm.com"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    helperText={inputText ? `Active preview: ${inputText}` : 'Requires a valid text token'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Active Select Option"
                    value={selectValue}
                    onChange={(e) => setSelectValue(e.target.value)}
                  >
                    <MenuItem value="one">Option segment 1 (Standard)</MenuItem>
                    <MenuItem value="two">Option segment 2 (Advanced)</MenuItem>
                    <MenuItem value="three">Option segment 3 (Pro)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}

        </Box>
      </Paper>
    </Box>
  );
}
