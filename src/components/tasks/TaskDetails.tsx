import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, ListItemText } from '@mui/material';
import { tasksApi } from '../../api/tasks';

export default function TaskDetails({ taskId, onBack, showFeedback }: any) {
  const [task, setTask] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  const load = async () => {
    try {
      const res = await tasksApi.get(taskId);
      if (res.data?.status === 'success') setTask(res.data.data.task);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load task');
    }
  };

  useEffect(() => { load(); }, [taskId]);

  const handleAddComment = async () => {
    try {
      // in this mock, authorId comes from localStorage user id or fallback
      const authorId = (localStorage.getItem('cms_session_user') as any) || 'usr_associate';
      await tasksApi.addComment(taskId, { authorId, text: commentText });
      setCommentText('');
      load();
    } catch (err: any) { showFeedback('error', err.message || 'Failed to add comment'); }
  };

  if (!task) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Button onClick={onBack} sx={{ mb: 1 }}>Back</Button>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">{task.title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{task.description}</Typography>
        <Typography variant="caption">Status: {task.status} • Priority: {task.priority} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Comments</Typography>
        <List>
          {(task.comments || []).map((c: any) => (
            <ListItem key={c._id} divider>
              <ListItemText primary={c.text} secondary={`By ${c.authorId} on ${new Date(c.createdAt).toLocaleString()}`} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField fullWidth value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." />
          <Button variant="contained" onClick={handleAddComment}>Add</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Attachments</Typography>
        <List>
          {(task.attachments || []).map((a: any) => (
            <ListItem key={a._id} divider>
              <ListItemText primary={a.filename} secondary={a.url || a.mimeType} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
