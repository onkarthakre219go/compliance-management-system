import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';

// @mui icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import InfoIcon from '@mui/icons-material/Info';
import RuleIcon from '@mui/icons-material/Rule';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

import { apiClient } from '../api/apiClient';
import { ComplianceTemplate, ChecklistItem } from '../types';

const CLIENT_TYPES = ['Pvt Ltd', 'Public Ltd', 'LLP', 'OPC', 'Partnership', 'Proprietorship'] as const;
const CATEGORIES = ['GST', 'Income Tax', 'Corporate Law', 'Audit', 'MSME', 'FEMA', 'Other'] as const;
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'One-Time'] as const;
const DUE_DATE_RULES = [
  { value: 'DayOfMonth', label: 'Day of Current Month' },
  { value: 'DaysAfterMonthEnd', label: 'Days After Month End' },
  { value: 'DaysAfterQuarterEnd', label: 'Days After Quarter End' },
  { value: 'DaysAfterYearEnd', label: 'Days After Financial Year End' },
  { value: 'SpecificDate', label: 'Specific Target Date' },
];

export default function ComplianceTemplates() {
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ComplianceTemplate | null>(null);

  // Dialog states
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [openAutomate, setOpenAutomate] = useState<boolean>(false);
  
  // Form states
  const [formId, setFormId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('GST');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>('Monthly');
  const [averageMinutes, setAverageMinutes] = useState<number>(30);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  
  // Form checklist items
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState<string>('');
  const [newChecklistMandatory, setNewChecklistMandatory] = useState<boolean>(true);

  // Form Rule configurations
  const [ruleType, setRuleType] = useState<string>('DayOfMonth');
  const [daysOffset, setDaysOffset] = useState<number>(15);
  const [specificDate, setSpecificDate] = useState<string>('');
  
  // Reminder Rules
  const [reminders, setReminders] = useState<number[]>([5, 2, 1]);
  const [reminderChannel, setReminderChannel] = useState<'Email' | 'Sms' | 'App' | 'Email & App'>('Email & App');

  // Automation Wizard configuration
  const [autoYear, setAutoYear] = useState<number>(new Date().getFullYear());
  const [autoMonth, setAutoMonth] = useState<number>(new Date().getMonth());

  // Feedback Snackbar state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/compliance/templates');
      if (res.data?.status === 'success') {
        const list = res.data.data.templates || [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplate(list[0]);
        }
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Could not fetch templates list.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  // Helper to open form in create mode
  const handleOpenCreateForm = () => {
    setIsEditing(false);
    setFormId('');
    setTitle('');
    setDescription('');
    setCategory('GST');
    setFrequency('Monthly');
    setAverageMinutes(30);
    setSelectedClientTypes([...CLIENT_TYPES]); // Default to all
    setChecklist([
      { itemText: 'Verify original invoice and vouchers roster.', isMandatory: true },
      { itemText: 'Submit details and export electronic acknowledgment challan.', isMandatory: true }
    ]);
    setNewChecklistItem('');
    setRuleType('DayOfMonth');
    setDaysOffset(15);
    setSpecificDate('');
    setReminders([5, 2, 1]);
    setReminderChannel('Email & App');
    setOpenForm(true);
  };

  // Helper to open form in edit mode
  const handleOpenEditForm = (t: ComplianceTemplate) => {
    setIsEditing(true);
    setFormId(t._id);
    setTitle(t.title);
    setDescription(t.description || '');
    setCategory(t.category);
    setFrequency(t.frequency);
    setAverageMinutes(t.averageMinutesToComplete || 30);
    setSelectedClientTypes(t.applicableClientTypes || []);
    setChecklist(t.checklistItems || []);
    setNewChecklistItem('');
    setRuleType(t.dueDateRule?.ruleType || 'DayOfMonth');
    setDaysOffset(t.dueDateRule?.daysOffset || 0);
    setSpecificDate(t.dueDateRule?.specificDate ? t.dueDateRule.specificDate.substring(0, 10) : '');
    setReminders(t.reminderRules?.daysBefore || [5, 2, 1]);
    setReminderChannel(t.reminderRules?.channel || 'Email & App');
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  // Toggle Client types
  const handleToggleClientType = (ctype: string) => {
    setSelectedClientTypes(prev => 
      prev.includes(ctype) ? prev.filter(c => c !== ctype) : [...prev, ctype]
    );
  };

  // Checklist operators
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, { itemText: newChecklistItem.trim(), isMandatory: newChecklistMandatory }]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  // Form submit handler
  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      showFeedback('error', 'Please specify a title for the template.');
      return;
    }
    if (selectedClientTypes.length === 0) {
      showFeedback('error', 'Select at least one applicable Client Type.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      frequency,
      averageMinutesToComplete: averageMinutes,
      applicableClientTypes: selectedClientTypes,
      checklistItems: checklist,
      dueDateRule: {
        ruleType,
        daysOffset,
        specificDate: ruleType === 'SpecificDate' && specificDate ? new Date(specificDate) : undefined
      },
      reminderRules: {
        daysBefore: reminders,
        channel: reminderChannel
      }
    };

    try {
      if (isEditing) {
        const res = await apiClient.patch(`/compliance/templates/${formId}`, payload);
        if (res.data?.status === 'success') {
          showFeedback('success', `Compliance template "${title}" successfully updated.`);
          fetchTemplates();
          setOpenForm(false);
        }
      } else {
        const res = await apiClient.post('/compliance/templates', payload);
        if (res.data?.status === 'success') {
          showFeedback('success', `Defined new template "${title}" on system database.`);
          fetchTemplates();
          setOpenForm(false);
        }
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error occurred while saving compliance template.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${selectedTemplate?.title}"?`)) return;
    try {
      const res = await apiClient.delete(`/compliance/templates/${templateId}`);
      if (res.data?.status === 'success') {
        showFeedback('success', 'Compliance template successfully removed from workspace database.');
        fetchTemplates();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove compliance template.');
    }
  };

  // Trigger automated simulation run
  const handleAutomateRun = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await apiClient.post(`/compliance/templates/${selectedTemplate._id}/generate-calendar`, {
        year: autoYear,
        targetMonth: autoMonth
      });

      if (res.data?.status === 'success') {
        showFeedback(
          'success', 
          `Synchronized benchmark "${res.data.data.calendarEvent.title}" into the master compliance calendar.`
        );
        setOpenAutomate(false);
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to automate compliance scheduling run.');
    }
  };

  // Helper to preview due date dynamically in the browser
  const calculateDueDatePreview = (template: ComplianceTemplate, year: number, month: number) => {
    const rType = template.dueDateRule?.ruleType || 'DayOfMonth';
    const offset = template.dueDateRule?.daysOffset || 0;
    let previewStr = '';

    if (rType === 'DayOfMonth') {
      const d = new Date(year, month, offset || 1);
      previewStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (rType === 'DaysAfterMonthEnd') {
      const monthEnd = new Date(year, month + 1, 0);
      const d = new Date(monthEnd.getTime() + offset * 24 * 3600 * 1000);
      previewStr = `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (${offset} days after ${monthEnd.toLocaleDateString(undefined, { month: 'short' })} month-end)`;
    } else if (rType === 'DaysAfterQuarterEnd') {
      const q = Math.floor(month / 3);
      const qEndMonth = (q + 1) * 3 - 1;
      const qEnd = new Date(year, qEndMonth + 1, 0);
      const d = new Date(qEnd.getTime() + offset * 24 * 3600 * 1000);
      previewStr = `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (${offset} days after Q${q+1} end: ${qEnd.toLocaleDateString()})`;
    } else if (rType === 'DaysAfterYearEnd') {
      const fyEnd = new Date(year, 2, 31);
      const d = new Date(fyEnd.getTime() + offset * 24 * 3600 * 1000);
      previewStr = `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (${offset} days after Financial Year end: March 31)`;
    } else if (rType === 'SpecificDate' && template.dueDateRule?.specificDate) {
      previewStr = new Date(template.dueDateRule.specificDate).toLocaleDateString();
    }

    return previewStr || 'Invalid Rule Data';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'GST': return 'info';
      case 'Income Tax': return 'error';
      case 'Corporate Law': return 'warning';
      case 'Audit': return 'success';
      default: return 'secondary';
    }
  };

  const getFreqColor = (freq: string) => {
    switch (freq) {
      case 'Monthly': return '#10b981';
      case 'Quarterly': return '#6366f1';
      case 'Half-Yearly': return '#a855f7';
      case 'Annual': return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.025em', mb: 1 }}>
            Compliance Template Module
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 800 }}>
            Configure client-specific compliance architectures, trigger schedule planners, define statutory due date offsets, and reminder dispatch policies.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreateForm}
          startIcon={<AddIcon />}
          sx={{ py: 1.2, px: 2.5, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Define Template
        </Button>
      </Box>

      {loading ? (
        <Typography sx={{ color: 'white' }}>Loading master templates...</Typography>
      ) : (
        <Grid container spacing={3}>
          
          {/* LEFT COLUMN: LIST OF DEFINED COMPLIANCE TEMPLATES */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                ACTIVE TEMPLATES ({templates.length})
              </Typography>

              {templates.map((t) => (
                <Card 
                  key={t._id} 
                  onClick={() => setSelectedTemplate(t)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: selectedTemplate?._id === t._id ? '#1e293b' : '#090d16',
                    border: selectedTemplate?._id === t._id ? '1px solid #6366f1' : '1px solid #1e293b',
                    transition: 'all 0.2s',
                    '&:hover': {
                      border: '1px solid #4f46e5',
                      bgcolor: '#131c30'
                    }
                  }}
                >
                  <CardContent sx={{ p: '20px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip 
                        label={t.category} 
                        size="small" 
                        color={getCategoryColor(t.category)} 
                        sx={{ fontWeight: 'bold', fontSize: 10 }}
                      />
                      <Typography variant="caption" sx={{ color: getFreqColor(t.frequency), fontWeight: 800 }}>
                        {t.frequency.toUpperCase()}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '15px', mb: 1 }}>
                      {t.title}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {t.applicableClientTypes?.map((ct) => (
                        <span 
                          key={ct} 
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            background: '#151f32',
                            color: '#94a3b8',
                            border: '1px solid #1e293b',
                            padding: '1.5px 5px',
                            borderRadius: '4px'
                          }}
                        >
                          {ct}
                        </span>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {templates.length === 0 && (
                <Paper sx={{ p: 3, bgcolor: '#090d16', border: '1px solid #1e293b', textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>No compliance templates defined yet.</Typography>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* RIGHT COLUMN: ACTIVE DETAILS, RULES PREVIEW, CHECKLIST AND CALENDAR WIZARD */}
          <Grid size={{ xs: 12, md: 8 }}>
            {selectedTemplate ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* 1. Header Details panel */}
                <Paper sx={{ p: 4, bgcolor: '#090d16', border: '1px solid #1e293b', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                        <Chip label={selectedTemplate.category} color={getCategoryColor(selectedTemplate.category)} size="small" sx={{ fontWeight: 800 }} />
                        <Chip label={selectedTemplate.frequency} size="small" sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontWeight: 800, border: '1px solid #312e81' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{selectedTemplate.averageMinutesToComplete || 30} mins completing average</Typography>
                        </Box>
                      </Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
                        {selectedTemplate.title}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton color="secondary" onClick={() => handleOpenEditForm(selectedTemplate)} sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteTemplate(selectedTemplate._id)} sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 3 }}>
                    {selectedTemplate.description || 'No descriptive guide specified for this dynamic template.'}
                  </Typography>

                  <Divider sx={{ borderColor: '#1e293b', mb: 3 }} />

                  {/* Applicable Clients constitutional tags */}
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', mb: 1 }}>
                    APPLICABLE CONSTITUTIONAL CLIENT TYPES
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {selectedTemplate.applicableClientTypes?.map((type) => (
                      <Chip key={type} label={type} avatar={<Avatar sx={{ bgcolor: '#111827', color: '#10b981', fontSize: 9 }}>C</Avatar>} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b', color: 'white', fontWeight: 'bold' }} />
                    ))}
                  </Box>
                </Paper>

                {/* 2. Due Date Math & Reminder schedule policies */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#090d16', border: '1px solid #1e293b', borderRadius: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <RuleIcon sx={{ color: '#818cf8', fontSize: 18 }} />
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                          Statutory Due Date Rule
                        </Typography>
                      </Box>
                      
                      <Box sx={{ p: 2, bgcolor: '#020617', border: '1px solid #1e293b', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                          {selectedTemplate.dueDateRule?.ruleType ? DUE_DATE_RULES.find(r => r.value === selectedTemplate.dueDateRule.ruleType)?.label : 'Standard Offset'}
                        </Typography>
                        
                        {selectedTemplate.dueDateRule?.ruleType !== 'SpecificDate' ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Calculated offset is <strong>{selectedTemplate.dueDateRule?.daysOffset || 0} days</strong> following the selected reporting baseline cycle.
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Designated fixed date: {selectedTemplate.dueDateRule.specificDate ? new Date(selectedTemplate.dueDateRule.specificDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#090d16', border: '1px solid #1e293b', borderRadius: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <NotificationsActiveIcon sx={{ color: '#fbbf24', fontSize: 18 }} />
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                          Reminder Protocols
                        </Typography>
                      </Box>
                      
                      <Box sx={{ p: 2, bgcolor: '#020617', border: '1px solid #1e293b', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                          Via {selectedTemplate.reminderRules?.channel || 'App Broadcast'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {selectedTemplate.reminderRules?.daysBefore?.map((days) => (
                            <Chip 
                              key={days} 
                              label={`${days}d Before`} 
                              size="small" 
                              sx={{ bgcolor: '#0f172a', border: '1px solid #ef4444', color: '#f87171', fontWeight: 'bold' }} 
                            />
                          )) || <Typography variant="caption" sx={{ color: 'text.secondary' }}>No reminders programmed.</Typography>}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* 3. checklist items verification */}
                <Paper sx={{ p: 3, bgcolor: '#090d16', border: '1px solid #1e293b', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <PlaylistAddCheckIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>
                      Compliance Checklist Workflow ({selectedTemplate.checklistItems?.length || 0} sub-tasks)
                    </Typography>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {selectedTemplate.checklistItems?.map((item, idx) => (
                      <ListItem 
                        key={idx} 
                        disablePadding 
                        sx={{ 
                          mb: 1, 
                          p: 1.5, 
                          bgcolor: '#020617', 
                          border: '1px solid #1e293b', 
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                            {item.itemText}
                          </Typography>
                        </Box>
                        {item.isMandatory && (
                          <Chip label="Mandatory" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: 8, fontWeight: 'bold' }} />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {/* 4. Automated Planner / Scheduler Runner console */}
                <Paper sx={{ p: 4, bgcolor: '#050b18', border: '2px solid #334155', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                    <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                        Auto-Schedule Compliance Calendar Event
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Automate due date calculations according to regulatory formulas and push events directly on calendar.
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Reporting Year"
                        value={autoYear}
                        onChange={(e) => setAutoYear(parseInt(e.target.value as string, 10))}
                        variant="outlined"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { color: 'white', bgcolor: '#090d16' },
                          '& .MuiInputLabel-root': { color: '#94a3b8' }
                        }}
                      >
                        {[2025, 2026, 2027, 2028].map(yr => (
                          <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Reporting Cycle Month"
                        value={autoMonth}
                        onChange={(e) => setAutoMonth(parseInt(e.target.value as string, 10))}
                        variant="outlined"
                        disabled={selectedTemplate.frequency === 'Annual'}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { color: 'white', bgcolor: '#090d16' },
                          '& .MuiInputLabel-root': { color: '#94a3b8' }
                        }}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((mname, idx) => (
                          <MenuItem key={idx} value={idx}>{mname}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenAutomate(true)}
                        startIcon={<AutoAwesomeIcon />}
                        sx={{ py: 1.8, fontWeight: 700, borderRadius: 2 }}
                      >
                        Calculate Run
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

              </Box>
            ) : (
              <Paper sx={{ p: 5, bgcolor: '#090d16', border: '1px solid #1e293b', textAlign: 'center', borderRadius: 3 }}>
                <InfoIcon sx={{ color: 'text.secondary', fontSize: 40, mb: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 'bold' }}>No compliance template selected.</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>Select an active architecture from the sidebar or click "Define Template" to configure.</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* DEFINITION FORM DIALOG MODAL (Create/Edit) */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#090d16',
            color: 'white',
            border: '1px solid #1e293b',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #1e293b', p: 3, fontWeight: 'bold' }}>
          {isEditing ? `Edit: ${title}` : 'Define New Compliance Template'}
        </DialogTitle>
        <DialogContent sx={{ p: 4, mt: 1 }}>
          <Grid container spacing={3}>
            
            {/* Core particulars */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                margin="dense"
                label="Compliance Name / Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                variant="outlined"
                sx={{ mb: 2, '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                margin="dense"
                label="Statutory Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                required
                sx={{ mb: 2, '& .MuiOutlinedInput-input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
              >
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                margin="dense"
                label="Filing Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof FREQUENCIES[number])}
                required
                sx={{ mb: 2, '& .MuiOutlinedInput-input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
              >
                {FREQUENCIES.map(freq => (
                  <MenuItem key={freq} value={freq}>{freq}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                margin="dense"
                label="Average Duration (Minutes)"
                type="number"
                value={averageMinutes}
                onChange={(e) => setAverageMinutes(parseInt(e.target.value as string, 10))}
                sx={{ mb: 2, '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Policy Instructions / Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 2, '& textarea': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
              />
            </Grid>

            {/* Applicable client constitutional types checkboxes (COMPLIANCE MAPPING) */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ borderColor: '#1e293b', mb: 2 }} />
              <Typography variant="subtitle2" sx={{ color: '#c084fc', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon /> Applicable Constitutional Business Categories
              </Typography>
              <FormGroup row>
                {CLIENT_TYPES.map((ctype) => (
                  <FormControlLabel
                    key={ctype}
                    control={
                      <Checkbox
                        checked={selectedClientTypes.includes(ctype)}
                        onChange={() => handleToggleClientType(ctype)}
                        sx={{ color: '#1e293b', '&.Mui-checked': { color: '#c084fc' } }}
                      />
                    }
                    label={ctype}
                    sx={{ color: 'white', mr: 3 }}
                  />
                ))}
              </FormGroup>
            </Grid>

            {/* Due Date offsets configuration */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ borderColor: '#1e293b', my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RuleIcon /> Statutory Due Date Calculus Config
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Due Date calculation formula"
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                  >
                    {DUE_DATE_RULES.map(rule => (
                      <MenuItem key={rule.value} value={rule.value}>{rule.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {ruleType !== 'SpecificDate' ? (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Day Offset (e.g. 11 for GSTR-1, 31 for Quarter End)"
                      type="number"
                      value={daysOffset}
                      onChange={(e) => setDaysOffset(parseInt(e.target.value as string, 10))}
                      sx={{ '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                    />
                  </Grid>
                ) : (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Specific Year Filing Deadline"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Reminders Dispatch schedule */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ borderColor: '#1e293b', my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: '#facc15', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon /> Reminder Dispatch Program
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Days Before list (comma-separated, e.g. 5,2,1)"
                    value={reminders.join(',')}
                    onChange={(e) => setReminders(e.target.value.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n)))}
                    placeholder="5,2,1"
                    sx={{ '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Reminder Delivery Channel"
                    value={reminderChannel}
                    onChange={(e) => setReminderChannel(e.target.value as any)}
                    sx={{ '& .MuiOutlinedInput-input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                  >
                    {['Email', 'Sms', 'App', 'Email & App'].map(chan => (
                      <MenuItem key={chan} value={chan}>{chan}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Grid>

            {/* Checklist Workflow Items */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ borderColor: '#1e293b', my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: '#4ade80', fontWeight: 'bold', mb: 2 }}>
                Filing Checklist Workflow Builder
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add procedural milestone (e.g., Collect GST challan)"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  sx={{ '& input': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newChecklistMandatory}
                      onChange={(e) => setNewChecklistMandatory(e.target.checked)}
                      sx={{ color: '#312e81', '&.Mui-checked': { color: '#10b981' } }}
                    />
                  }
                  label="Mandatory"
                  sx={{ color: 'white', minWidth: 120 }}
                />

                <Button 
                  variant="outlined" 
                  color="success" 
                  onClick={handleAddChecklistItem}
                  sx={{ height: 50, border: '1px solid #10b981 !important' }}
                >
                  Add
                </Button>
              </Box>

              <List sx={{ p: 0, bgcolor: '#020617', border: '1px solid #1e293b', borderRadius: 2, maxH: 220, overflowY: 'auto' }}>
                {checklist.map((item, idx) => (
                  <ListItem key={idx} sx={{ borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: 'white' }}>{item.itemText}</Typography>
                      {item.isMandatory && <Chip label="Required" color="error" variant="outlined" size="small" sx={{ height: 16, fontSize: 8, fontWeight: 'bold' }} />}
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleRemoveChecklistItem(idx)}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItem>
                ))}
                {checklist.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 3, textAlign: 'center' }}>
                    Setup list items above to enforce standard office workflow check sheets for junior practitioners.
                  </Typography>
                )}
              </List>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #1e293b' }}>
          <Button onClick={handleCloseForm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveTemplate}>Save Template</Button>
        </DialogActions>
      </Dialog>

      {/* AUTOMATE SIMULATION CONFIRMATION DIALOG MODAL */}
      <Dialog
        open={openAutomate}
        onClose={() => setOpenAutomate(false)}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#090d16',
            color: 'white',
            border: '2px solid #334155',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #1e293b' }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} /> Schedule Automation
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Filing Run Details:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Confirming scheduling command will calculate the deadline, extract checklist structures, and inject events directly on client schedules.
              </Typography>

              <Box sx={{ p: 2.5, bgcolor: '#020617', border: '1px solid #1e293b', borderRadius: 2, mb: 2 }}>
                <span style={{ fontSize: '11px', background: '#312e81', color: '#818cf8', fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                  CALCULATED COMPLIANCE DATE PREVIEW
                </span>
                <Typography variant="h5" sx={{ color: '#10b981', mt: 1.5, fontWeight: 'bold' }}>
                  {calculateDueDatePreview(selectedTemplate, autoYear, autoMonth)}
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Note: This automates calendar dispatch configurations. Connected associates will receive auto-generated workflow tasks in compliance alignment.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #1e293b' }}>
          <Button onClick={() => setOpenAutomate(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAutomateRun}>Confirm Run</Button>
        </DialogActions>
      </Dialog>

      {/* Dynamic Toast Feedback alerts */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={feedback?.type} 
          variant="filled" 
          onClose={() => setFeedback(null)}
          sx={{ width: '100%', fontWeight: 'bold' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
