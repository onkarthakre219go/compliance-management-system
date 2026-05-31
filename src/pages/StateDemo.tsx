import React from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  incrementCounter, 
  decrementCounter, 
  selectMetric, 
  clearTelemetryLogs 
} from '../store/demoSlice';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

export default function StateDemo() {
  const dispatch = useAppDispatch();
  const counter = useAppSelector((state) => state.demo.counter);
  const metrics = useAppSelector((state) => state.demo.metrics);
  const selectedMetricId = useAppSelector((state) => state.demo.selectedMetricId);
  const telemetryLogs = useAppSelector((state) => state.demo.telemetryLogs);

  const selectedMetric = metrics.find(m => m.id === selectedMetricId);

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
          Redux State Management Laboratory
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Interact with global immutable data stores defined using Redux Toolkit. See dispatches trigger immediate updates across views.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: interactive components */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Counter Section */}
            <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent="Slices" color="secondary" sx={{ mr: 1 }}>
                  <span>Counter Slice</span>
                </Badge>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Dispatched events instantly update the primitive immutable counter value stored inside our `demo` sub-slice.
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', bg: 'slate.950', p: 3, borderRadius: 2 }}>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  onClick={() => dispatch(decrementCounter())}
                  startIcon={<RemoveIcon />}
                >
                  Decrement
                </Button>
                
                <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'monospace', minWidth: 60, textAlign: 'center', color: 'primary.light' }}>
                  {counter}
                </Typography>

                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => dispatch(incrementCounter())}
                  startIcon={<AddIcon />}
                >
                  Increment
                </Button>
              </Box>
            </Paper>

            {/* Config Metric Selector Section */}
            <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Cross-Component Selection Store
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Select a framework coordinate row from the state-held array, updating dependent elements on the right.
              </Typography>

              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                {metrics.map((m) => (
                  <Grid size={{ xs: 12 }} key={m.id}>
                    <Button
                      fullWidth
                      variant={selectedMetricId === m.id ? 'contained' : 'outlined'}
                      color={selectedMetricId === m.id ? 'secondary' : 'inherit'}
                      onClick={() => dispatch(selectMetric(m.id))}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5, 
                        px: 2,
                        textAlign: 'left',
                        fontFamily: 'monospace',
                        textTransform: 'none',
                        borderColor: '#1e293b'
                      }}
                      startIcon={<SettingsIcon />}
                    >
                      {m.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>

          </Box>
        </Grid>

        {/* Right Side: Reactive displays / Telemetry logs */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Value Display Mirror */}
            <Card sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #022c22 100%)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'secondary.light' }}>
                  Active Subscriber State
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  This card subscribes directly to changes in the Redux store selector.
                </Typography>
                <Divider sx={{ my: 1.5, borderColor: '#1e293b' }} />

                <Box sx={{ py: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    Selected Row Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
                    {selectedMetric ? selectedMetric.name : 'None Selected'}
                  </Typography>

                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    Current Saved Value Parameter
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                    {selectedMetric ? selectedMetric.value : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Redux Telemetry Log Terminal */}
            <Paper sx={{ p: 3, border: '1px solid #1e293b', bgcolor: '#020617' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary.light">
                  Redux Action Dispatch Logs
                </Typography>
                <IconButton 
                  size="small" 
                  color="warning" 
                  onClick={() => dispatch(clearTelemetryLogs())}
                  disabled={telemetryLogs.length === 0}
                  title="Clear telemetry stack"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Box 
                sx={{ 
                  maxHeight: 250, 
                  overflowY: 'auto', 
                  fontFamily: 'monospace', 
                  fontSize: '11px',
                  bgcolor: '#090d16',
                  p: 2, 
                  borderRadius: 1.5,
                  border: '1px solid #1a2333',
                  color: '#34d399'
                }}
              >
                {telemetryLogs.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 6, textAlign: 'center' }}>
                    No dispatched events currently recorded. Trigger events on the left to stream logs.
                  </Typography>
                ) : (
                  <List dense sx={{ p: 0 }}>
                    {telemetryLogs.map((log) => (
                      <ListItem key={log.id} sx={{ p: 0, mb: 1.5, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                              <span style={{ color: '#818cf8', fontWeight: 700 }}>[{log.type}]</span>
                              <span style={{ color: '#64748b' }}>{log.timestamp}</span>
                            </Box>
                          }
                          secondary={
                            <span style={{ color: '#cbd5e1', wordBreak: 'break-all' }}>{log.payload}</span>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
