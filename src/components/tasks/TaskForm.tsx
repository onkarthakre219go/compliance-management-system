import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, MenuItem } from '@mui/material';
import { tasksApi } from '../../api/tasks';

export default function TaskForm({ task, onCancel, onSaved, showFeedback }: any) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [clientId, setClientId] = useState(task?.clientId || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '');

  const handleSave = async () => {
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
      showFeedback('error', err.message || 'Failed to save task');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
      <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
      <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} multiline rows={3} fullWidth />
      <TextField label="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} fullWidth />
      <TextField label="Assigned To (user id)" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} fullWidth />
      <TextField select label="Priority" value={priority} onChange={e => setPriority(e.target.value)} fullWidth>
        <MenuItem value="Low">Low</MenuItem>
        <MenuItem value="Medium">Medium</MenuItem>
        <MenuItem value="High">High</MenuItem>
        <MenuItem value="Critical">Critical</MenuItem>
      </TextField>
      <TextField label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button variant="contained" onClick={handleSave}>Save</Button>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
      </Box>
    </Box>
  );
}
