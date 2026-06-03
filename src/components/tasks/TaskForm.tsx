import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, MenuItem, CircularProgress } from '@mui/material';
import { tasksApi } from '../../api/tasks';
import { apiClient } from '../../api/apiClient';

export default function TaskForm({ task, onCancel, onSaved, showFeedback }: any) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [clientId, setClientId] = useState(task?.clientId || '');
  const [clients, setClients] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await apiClient.get('/clients');
        if (res.data?.status === 'success') {
          setClients(res.data.data.clients || []);
        }
      } catch (err) {
        showFeedback('error', 'Failed to load clients');
      }
    };
    loadClients();
  }, [showFeedback]);

  const handleSave = async () => {
    if (!title || !clientId || !dueDate) {
      showFeedback('error', 'Please fill in all required fields (Title, Client, Due Date)');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { title, description, clientId, assignedTo, priority, dueDate };
      if (task) {
        await tasksApi.update(task._id, payload);
        showFeedback('success', 'Task updated');
      } else {
        await tasksApi.create(payload);
        showFeedback('success', 'Task created');
      }
      onSaved && onSaved();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
      <TextField label="Title *" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
      <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} multiline rows={3} fullWidth />
      <TextField
        select
        label="Client *"
        value={clientId}
        onChange={e => setClientId(e.target.value)}
        fullWidth
        disabled={loading}
      >
        <MenuItem value="">Select a client</MenuItem>
        {clients.map((client: any) => (
          <MenuItem key={client._id} value={client._id}>
            {client.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Assigned To (user id)" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} fullWidth disabled={loading} />
      <TextField select label="Priority" value={priority} onChange={e => setPriority(e.target.value)} fullWidth disabled={loading}>
        <MenuItem value="Low">Low</MenuItem>
        <MenuItem value="Medium">Medium</MenuItem>
        <MenuItem value="High">High</MenuItem>
        <MenuItem value="Critical">Critical</MenuItem>
      </TextField>
      <TextField
        label="Due Date *"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 160, flex: 1,
          '& input::-webkit-calendar-picker-indicator': {
            filter: 'invert(1)',
            cursor: 'pointer',
          }
         }}
        fullWidth
        disabled={loading}
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancel</Button>
      </Box>
    </Box>
  );
}
