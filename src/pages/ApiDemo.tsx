import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { addTelemetryLog } from '../store/demoSlice';
import { apiClient, healthApi } from '../api/apiClient';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Paper, 
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import CodeIcon from '@mui/icons-material/Code';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function ApiDemo() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Trigger real backend API call using custom Axios hooks
  const checkHealthStatus = async () => {
    setLoading(true);
    setResponse(null);
    setErrorInfo(null);
    dispatch(addTelemetryLog({ type: 'AXIOS_REQ_DISPATCH', payload: 'GET /api/health initiating via apiClient instance.' }));

    try {
      const res = await healthApi.checkStatus();
      setResponse(res.data);
      dispatch(addTelemetryLog({ 
        type: 'AXIOS_REQ_SUCCESS', 
        payload: `GET /api/health responded with Status Code ${res.status}: ${JSON.stringify(res.data)}` 
      }));
    } catch (err: any) {
      setErrorInfo(err.message || 'An error occurred during request execution');
      dispatch(addTelemetryLog({ 
        type: 'AXIOS_REQ_FAILED', 
        payload: `GET /api/health rejected: ${err.message}` 
      }));
    } finally {
      setLoading(false);
    }
  };

  // Trigger custom 404 test call to demonstrate error interceptors
  const triggerNotFoundResource = async () => {
    setLoading(true);
    setResponse(null);
    setErrorInfo(null);
    dispatch(addTelemetryLog({ type: 'AXIOS_REQ_DISPATCH', payload: 'GET /api/auth/non-existent-endpoint initiating.' }));

    try {
      const res = await apiClient.get('/auth/non-existent-endpoint-test-route');
      setResponse(res.data);
    } catch (err: any) {
      setErrorInfo(err.message || 'Expected route lookup failure.');
      dispatch(addTelemetryLog({ 
        type: 'AXIOS_REQ_FAILED', 
        payload: `Intercepted error successfully! Message: ${err.message}` 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
          Axios HTTP API Integration
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Explore an asynchronous API client layered with automated request/response filters, authorization handlers, and JWT token rotation mechanics.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* API Control Controls */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NetworkCheckIcon color="primary" />
                <span>Trigger Axios Request</span>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Ping the relative background server to test client-server connectivity, analyzing the serialized response object below.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={checkHealthStatus}
                  disabled={loading}
                  startIcon={<SwapCallsIcon />}
                >
                  Query /api/health
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={triggerNotFoundResource}
                  disabled={loading}
                  startIcon={<WarningAmberIcon />}
                >
                  Test Interceptor Error
                </Button>
              </Box>

              {loading && (
                <Box sx={{ width: '100%', mt: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Processing network frame...
                  </Typography>
                  <LinearProgress color="primary" />
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon color="success" />
                <span>Compliance & Cron Simulator</span>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Trigger the background compliance scheduler (Cron Job) or generate regulatory checklist items dynamically for targeted constitutions.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={async () => {
                    setLoading(true);
                    setResponse(null);
                    setErrorInfo(null);
                    dispatch(addTelemetryLog({ type: 'CRON_EXEC_START', payload: 'POST /api/compliance/cron/simulate triggering.' }));
                    try {
                      const res = await apiClient.post('/compliance/cron/simulate');
                      setResponse(res.data);
                      dispatch(addTelemetryLog({ type: 'CRON_EXEC_SUCCESS', payload: 'Compliance scheduler run complete.' }));
                    } catch (err: any) {
                      setErrorInfo(err.message || 'Error running cron');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Run Compliance Cron Job
                </Button>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={async () => {
                      setLoading(true);
                      setResponse(null);
                      setErrorInfo(null);
                      dispatch(addTelemetryLog({ type: 'COMPLIANCE_AUTO_GEN', payload: 'Triggering client cli_alpha (Pvt Ltd) tasks.' }));
                      try {
                        const res = await apiClient.post('/compliance/clients/cli_alpha/auto-generate');
                        setResponse(res.data);
                      } catch (err: any) {
                        setErrorInfo(err.message || 'Error generating Pvt Ltd client compliance');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Gen Pvt Ltd (Alpha)
                  </Button>

                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={async () => {
                      setLoading(true);
                      setResponse(null);
                      setErrorInfo(null);
                      dispatch(addTelemetryLog({ type: 'COMPLIANCE_AUTO_GEN', payload: 'Triggering client cli_zenith (LLP) tasks.' }));
                      try {
                        const res = await apiClient.post('/compliance/clients/cli_zenith/auto-generate');
                        setResponse(res.data);
                      } catch (err: any) {
                        setErrorInfo(err.message || 'Error generating LLP client compliance');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Gen LLP (Zenith)
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, border: '1px solid #1e293b' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Interceptor Configurations
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Our Axios integration automatically injects authentication headers and checks for 401 token expiry codes. Here are the core features:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Chip label="Bearer Authentication Injection" variant="outlined" size="small" />
                <Chip label="Response Normalization" variant="outlined" size="small" />
                <Chip label="Authorization Refresh Handler" variant="outlined" size="small" />
                <Chip label="Timeout Threshold [10s]" variant="outlined" size="small" />
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* API response representation */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, border: '1px solid #1e293b', bgcolor: '#020617', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <CodeIcon sx={{ color: 'secondary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Response & Error Console
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
              HTTP Data Stream Output
            </Typography>

            <Box 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: 12, 
                bgcolor: '#090d16', 
                p: 2.5, 
                borderRadius: 1.5,
                border: '1px solid #1a2333',
                height: 320,
                overflowY: 'auto'
              }}
            >
              {loading && !response && !errorInfo && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 12, textAlign: 'center' }}>
                  Awaiting background response packet...
                </Typography>
              )}

              {!loading && !response && !errorInfo && (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 12, textAlign: 'center' }}>
                  No active request outputs. Click the trigger buttons on the left to invoke queries.
                </Typography>
              )}

              {response && (
                <Box sx={{ color: '#34d399' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    SUCCESSFUL TRANSACTION [200 OK]
                  </Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </Box>
              )}

              {errorInfo && (
                <Box sx={{ color: '#f87171' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                    INTERCEPTED EXCEPTION CAUSE:
                  </Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    Error: {errorInfo}
                  </pre>
                  <Divider sx={{ my: 2, borderColor: '#3b1818' }} />
                  <Typography variant="body2" color="text.secondary">
                    Recommendation: Verify route schemas on server side. Our interceptor captures raw exceptions and parses them to ensure client UI controls never freeze or crash.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
