import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  FormHelperText,
  Divider,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ContactMailIcon from '@mui/icons-material/ContactMail';

import { Client, Contact, Teammate } from '../../types';
import { apiClient } from '../../api/apiClient';

interface ClientFormProps {
  client: Client | null; // Null means Add Client, otherwise Edit Client
  teammates: Teammate[];
  onCancel: () => void;
  onSaveSuccess: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

interface ClientFormInput {
  name: string;
  tradeName: string;
  constitution: 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited' | 'Public Limited' | 'Trust' | 'Individual';
  pan: string;
  gstType: 'Regular' | 'Composition' | 'Unregistered' | 'None';
  filingFrequency: 'Monthly' | 'Quarterly' | 'None';
  assignedTo: string;
  tagsString: string;
  status: 'active' | 'inactive';
  grade: 'A' | 'B' | 'C' | 'D';
  clientType: 'Corporate' | 'Retail' | 'HNW' | 'SME' | 'Others';
}

export default function ClientForm({ client, teammates, onCancel, onSaveSuccess, showFeedback }: ClientFormProps) {
  const isEditMode = !!client;

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormInput>({
    defaultValues: {
      name: '',
      tradeName: '',
      constitution: 'Individual',
      pan: '',
      gstType: 'None',
      filingFrequency: 'None',
      assignedTo: '',
      tagsString: '',
      status: 'active',
      grade: 'B',
      clientType: 'SME'
    }
  });

  // Manage associated multiple contact points locally
  const [contacts, setContacts] = useState<Partial<Contact>[]>([]);

  // Sub-contacts creation temporary holder states
  const [tempName, setTempName] = useState('');
  const [tempDesignation, setTempDesignation] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempIsPrimary, setTempIsPrimary] = useState(false);
  const [tempError, setTempError] = useState<string | null>(null);

  // Prefill hook
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        tradeName: client.tradeName || '',
        constitution: client.constitution,
        pan: client.pan,
        gstType: client.gstType,
        filingFrequency: client.filingFrequency,
        assignedTo: client.assignedTo || '',
        tagsString: client.tags ? client.tags.join(', ') : '',
        status: client.status,
        grade: client.grade || 'B',
        clientType: client.clientType || 'SME'
      });
      setContacts(client.contacts ? [...client.contacts] : []);
    } else {
      reset({
        name: '',
        tradeName: '',
        constitution: 'Individual',
        pan: '',
        gstType: 'None',
        filingFrequency: 'None',
        assignedTo: '',
        tagsString: '',
        status: 'active',
        grade: 'B',
        clientType: 'SME'
      });
      setContacts([]);
    }
  }, [client, reset]);

  // Inline Contact Add
  const handleAddNewContact = () => {
    setTempError(null);
    if (!tempName.trim()) {
      setTempError('Representative/Contact Name is mandatory.');
      return;
    }
    if (!tempEmail.trim() || !tempEmail.includes('@')) {
      setTempError('Please state a valid corporate email.');
      return;
    }
    if (!tempPhone.trim() || tempPhone.trim().length < 6) {
      setTempError('A valid telephone phone reference is required.');
      return;
    }

    const item: Partial<Contact> = {
      name: tempName.trim(),
      designation: tempDesignation.trim(),
      email: tempEmail.trim().toLowerCase(),
      phone: tempPhone.trim(),
      isPrimary: tempIsPrimary || contacts.length === 0,
      alternatePhone: ''
    };

    // If this contact is marked primary, untoggle others
    let updated = [...contacts];
    if (item.isPrimary) {
      updated = updated.map(c => ({ ...c, isPrimary: false }));
    }

    setContacts([...updated, item]);

    // Flush temporary inline inputs
    setTempName('');
    setTempDesignation('');
    setTempEmail('');
    setTempPhone('');
    setTempIsPrimary(false);
  };

  const handleRemoveContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(c => c.isPrimary)) {
      // Re-assign primary indicator to first element safely
      updated[0].isPrimary = true;
    }
    setContacts(updated);
  };

  // Submit Handler
  const onSubmit = async (data: ClientFormInput) => {
    const uppercasePan = data.pan.toUpperCase().trim();
    const cleanTags = data.tagsString
      ? data.tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    const payload = {
      name: data.name.trim(),
      tradeName: data.tradeName.trim() || undefined,
      constitution: data.constitution,
      pan: uppercasePan,
      gstType: data.gstType,
      filingFrequency: data.filingFrequency,
      assignedTo: data.assignedTo || undefined,
      tags: cleanTags,
      status: data.status,
      grade: data.grade,
      clientType: data.clientType,
      contacts: contacts // Pass locally managed contact cards array
    };

    try {
      if (isEditMode && client) {
        const response = await apiClient.patch(`/clients/${client._id}`, payload);
        if (response.data?.status === 'success') {
          showFeedback('success', `Client "${payload.name}" updated successfully.`);
          onSaveSuccess();
        }
      } else {
        const response = await apiClient.post('/clients', payload);
        if (response.data?.status === 'success') {
          showFeedback('success', `Client "${payload.name}" registered successfully with ${contacts.length} contacts.`);
          onSaveSuccess();
        }
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Action completed with errors.');
    }
  };

  return (
    <Box>
      {/* Header action panel */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1.5 }}>
        <IconButton onClick={onCancel} sx={{ color: 'white', bgcolor: '#0f172a', border: '1px solid #1e293b' }} size="small" id="btn-back-to-ledger">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>
            {isEditMode ? `Repair Profile: ${client?.name}` : 'Setup Legal Business Profile'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Establish entity structure, Tax PAN bindings, tracking parameters, and assign contact points below.
          </Typography>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={4}>
          {/* LEFT COLUMN: Core Details */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-core-profile-form">
              <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 800, mb: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                1. Core Profile Details
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Client Legal Registered Name"
                    variant="outlined"
                    id="form-input-name"
                    {...register('name', {
                      required: 'Legal entity name is mandatory',
                      minLength: { value: 3, message: 'Name must have at least 3 characters' }
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message || 'The standard corporate name as displayed in official incorporation articles.'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Trade Name / Brand Name (Optional)"
                    variant="outlined"
                    id="form-input-tradeName"
                    {...register('tradeName')}
                    helperText="Optional commercial brand designation labels."
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="constitution"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Legal Constitution Type"
                        id="form-select-constitution"
                        {...field}
                      >
                        <MenuItem value="Individual">Individual</MenuItem>
                        <MenuItem value="Proprietorship">Proprietorship</MenuItem>
                        <MenuItem value="Partnership">Partnership</MenuItem>
                        <MenuItem value="LLP">LLP</MenuItem>
                        <MenuItem value="Private Limited">Limited / Private Limited</MenuItem>
                        <MenuItem value="Public Limited">Public Limited</MenuItem>
                        <MenuItem value="Trust">Trust Agency / NGO</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Permanent Account Number (PAN)"
                    variant="outlined"
                    id="form-input-pan"
                    placeholder="e.g. AAACA1234F"
                    slotProps={{
                      htmlInput: {
                        style: { textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }
                      }
                    }}
                    {...register('pan', {
                      required: 'Tax Identification PAN is mandatory',
                      pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Format does not meet standard Indian regulation (e.g. ABCDE1234F)'
                      }
                    })}
                    error={!!errors.pan}
                    helperText={errors.pan?.message || 'Alphanumeric tax identity code.'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Context Search Tags (Comma Separated)"
                    variant="outlined"
                    id="form-input-tags"
                    placeholder="e.g. Audit-ready, High-priority, SME"
                    {...register('tagsString')}
                    helperText="Comma separated values used for internal filters."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, borderColor: '#1e293b' }} />

              <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 800, mb: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                2. Compliance & Account Allocation Settings
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="grade"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Corporate Grade Rating"
                        id="form-select-grade"
                        {...field}
                      >
                        <MenuItem value="A">Grade A (Premium Key Account)</MenuItem>
                        <MenuItem value="B">Grade B (Medium Standard)</MenuItem>
                        <MenuItem value="C">Grade C (SME/Retail Basic)</MenuItem>
                        <MenuItem value="D">Grade D (Pro-Bono / Dormant)</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="clientType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Client Category Classification"
                        id="form-select-type"
                        {...field}
                      >
                        <MenuItem value="Corporate">Corporate Group</MenuItem>
                        <MenuItem value="Retail">Retail Business</MenuItem>
                        <MenuItem value="HNW">High Net Worth Individual (HNW)</MenuItem>
                        <MenuItem value="SME">Small/Medium Enterprise (SME)</MenuItem>
                        <MenuItem value="Others">Others Classification</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="assignedTo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Responsible Teammate / Lead"
                        id="form-select-assignedTo"
                        {...field}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {teammates.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.fullName} ({t.role})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="gstType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="GST Tax Registration System"
                        id="form-select-gstType"
                        {...field}
                      >
                        <MenuItem value="Regular">GST Regular Taxpayer</MenuItem>
                        <MenuItem value="Composition">Composition Scheme</MenuItem>
                        <MenuItem value="Unregistered">Unregistered Dealer</MenuItem>
                        <MenuItem value="None">None (Direct Incometax Filing)</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="filingFrequency"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Regular Compliance Frequency"
                        id="form-select-filingFrequency"
                        {...field}
                      >
                        <MenuItem value="Monthly">Monthly Cycle</MenuItem>
                        <MenuItem value="Quarterly">Quarterly Cycle</MenuItem>
                        <MenuItem value="None">No Active Compliance Cycle</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                      Operational Status
                    </Typography>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              id="form-switch-status"
                              checked={field.value === 'active'}
                              onChange={(e) => field.onChange(e.target.checked ? 'active' : 'inactive')}
                              color="primary"
                            />
                          }
                          label={
                            <Chip
                              label={field.value === 'active' ? 'Active' : 'Inactive'}
                              size="small"
                              color={field.value === 'active' ? 'primary' : 'default'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          }
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* RIGHT COLUMN: Contact Management */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, border: '1px solid #1e293b', bgcolor: '#090d16', borderRadius: 2 }} id="paper-contacts-form-aside">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#10b981', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Multiple Contacts ({contacts.length})
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Provide key business lines
                </Typography>
              </Box>

              {/* Dynamic scroll representation */}
              {contacts.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed #1e293b', borderRadius: 2, mb: 4 }} id="contacts-list-empty">
                  <ContactMailIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    No contacts assigned. A client record should ideally have at least one primary point of contact.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }} id="contacts-summary-stack">
                  {contacts.map((c, i) => (
                    <Card key={i} sx={{ bgcolor: '#0f172a', border: c.isPrimary ? '1px solid #3b82f6' : '1px solid #1e293b', position: 'relative' }}>
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ position: 'absolute', top: 6, right: 6 }}
                        onClick={() => handleRemoveContact(i)}
                        id={`btn-remove-contact-${i}`}
                      >
                        <ClearIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                      <CardContent sx={{ p: '14px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {c.name}
                          </Typography>
                          {c.isPrimary && (
                            <Chip label="Primary" size="small" color="primary" sx={{ height: 16, fontSize: '9px', fontWeight: 800 }} />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', mt: 0.1, fontWeight: 500 }}>
                          {c.designation || 'Corporate Representative'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8', fontFamily: 'monospace' }}>
                            <EmailIcon sx={{ fontSize: 11 }} /> {c.email}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8', fontFamily: 'monospace' }}>
                            <PhoneIcon sx={{ fontSize: 11 }} /> {c.phone}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Append Contact Component */}
              <Box sx={{ bgcolor: '#060910', border: '1px dashed #334155', p: 2.5, borderRadius: 2 }} id="contact-append-widget">
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, display: 'block', mb: 2 }}>
                  DESIGNATE BUSINESS REPRESENTATIVE
                </Typography>

                {tempError && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0 }} onClose={() => setTempError(null)}>
                    {tempError}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Contact Full Name"
                      id="temp-contact-name"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Designation (e.g. Managing Partner)"
                      id="temp-contact-designation"
                      value={tempDesignation}
                      onChange={(e) => setTempDesignation(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      label="Email ID"
                      id="temp-contact-email"
                      placeholder="e.g. rep@business.com"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Reference"
                      id="temp-contact-phone"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          id="temp-contact-switch-primary"
                          checked={tempIsPrimary}
                          onChange={(e) => setTempIsPrimary(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>Default Primary Contact</Typography>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      id="btn-add-contact-sub"
                      onClick={handleAddNewContact}
                      startIcon={<AddIcon fontSize="small" />}
                      sx={{ textTransform: 'none', py: 0.5 }}
                    >
                      Append Contact
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Global form controls submission block */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel} variant="outlined" color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            id="btn-save-client-record"
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
            sx={{ fontWeight: 700, px: 4 }}
          >
            {isSubmitting ? 'Saving record...' : 'Save Portfolio'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
