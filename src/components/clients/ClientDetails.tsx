import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Chip,
  IconButton
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BadgeIcon from '@mui/icons-material/Badge';

import { Client, Teammate } from '../../types';

interface ClientDetailsProps {
  client: Client;
  teammates: Teammate[];
  onBack: () => void;
  onEdit: () => void;
}

export default function ClientDetails({ client, teammates, onBack, onEdit }: ClientDetailsProps) {
  const assigned = teammates.find(t => t.id === client.assignedTo) || client.assignedToUser;

  // Format Date safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box>
      {/* Header controls pane */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={onBack} sx={{ color: 'white', bgcolor: '#0f172a', border: '1px solid #1e293b' }} size="small" id="btn-view-back-ledger">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>
              {client.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Full profile evaluation and registered compliance indices.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          onClick={onEdit}
          id="btn-view-edit-trigger"
          startIcon={<EditIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Edit Business Record
        </Button>
      </Box>

      {/* Main information Grid */}
      <Grid container spacing={3.5}>
        {/* Core Profile block */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-view-core-details">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
                <AccountBalanceIcon sx={{ color: '#818cf8' }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                  Core Corporate Profile
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Full Legal Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                    {client.name}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Trade Brand Identity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                    {client.tradeName || <span style={{ fontStyle: 'italic', color: '#64748b' }}>None Provided</span>}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ borderColor: '#1e293b' }} /></Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Constitutional Foundation
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                    {client.constitution}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Permanent Account Number (PAN)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#fda4af', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {client.pan}
                  </Typography>
                </Grid>

                {client.tags && client.tags.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}><Divider sx={{ borderColor: '#1e293b' }} /></Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.5 }}>
                        Associated Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {client.tags.map(t => (
                          <Chip key={t} label={t} size="small" variant="outlined" sx={{ borderColor: '#1e293b', color: '#94a3b8' }} />
                        ))}
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Contacts list Card */}
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-view-contacts">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
                <ContactMailIcon sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                  Associated Contact Lines ({client.contacts?.length || 0})
                </Typography>
              </Box>

              {!client.contacts || client.contacts.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
                  No contacts are registered for this client directory.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} id="contacts-grid-display">
                  {client.contacts.map((contact, idx) => (
                    <Paper key={contact._id || idx} sx={{ bgcolor: '#0f172a', p: 2.5, border: contact.isPrimary ? '1px solid #818cf8' : '1px solid #1e293b' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 1.5, gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                            {contact.name}
                          </Typography>
                          {contact.isPrimary && (
                            <Chip label="Default Primary Contact" size="small" color="primary" sx={{ height: 18, fontSize: '9px', fontWeight: 800 }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                          {contact.designation || 'Corporate Representative'}
                        </Typography>
                      </Box>
                      <Divider sx={{ borderColor: '#1e293b', my: 1.5 }} />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Email ID</Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', color: '#94a3b8', mt: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {contact.email}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Mobile Number</Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', color: '#94a3b8', mt: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {contact.phone}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* SIDEBAR: Settings & Metrics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Status & Categorization paper */}
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-view-status-badge">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
                <BadgeIcon sx={{ color: '#fda4af' }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                  Classification & Status
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>
                    Operational Status
                  </Typography>
                  <Chip
                    label={client.status === 'active' ? 'Active Account' : 'Inactive'}
                    color={client.status === 'active' ? 'primary' : 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>
                    Tier Assessment
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Grade ${client.grade || 'B'}`}
                      sx={{
                        bgcolor: client.grade === 'A' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: client.grade === 'A' ? '#10b981' : '#f87171',
                        borderColor: client.grade === 'A' ? '#10b981' : '#f87171',
                        fontWeight: 700
                      }}
                      variant="outlined"
                    />
                    <Chip
                      label={client.clientType || 'SME'}
                      sx={{ bgcolor: '#1e1b4b', color: '#a5b4fc', borderColor: '#312e81', fontWeight: 600 }}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>
                    Responsible Lead Partner
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                    {assigned ? (typeof assigned === 'string' ? assigned : (assigned as any).fullName) : 'Unassigned'}
                  </Typography>
                  {assigned && typeof assigned !== 'string' && (assigned as any).role && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Role: {(assigned as any).role}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Compliance Parameters */}
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-view-compliance-schedule">
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3 }}>
                <EventAvailableIcon sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                  Compliance Scheme
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>TAX GST REGISTRATION</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                    {client.gstType === 'None' ? 'Unregistered / Direct IT' : `${client.gstType} Registration`}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>FILING REGULARITY</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#fca5a5' }}>
                    {client.filingFrequency === 'None' ? 'No Filing Loop Required' : `${client.filingFrequency} Filing Cycle`}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* History tracking details */}
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-view-audit-info">
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontWeight: 700, letterSpacing: '0.05em' }}>
                AUDIT TELEMETRY INFO
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>REGISTERED AT</Typography>
                  <Typography variant="caption" style={{ fontFamily: 'monospace', color: 'white' }}>
                    {formatDate(client.createdAt)}
                  </Typography>
                </Box>
                {client.updatedAt && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>LAST UPDATED AT</Typography>
                    <Typography variant="caption" style={{ fontFamily: 'monospace', color: 'white' }}>
                      {formatDate(client.updatedAt)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
