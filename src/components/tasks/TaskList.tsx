import React, { useEffect, useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { tasksApi } from '../../api/tasks';

interface Props {
  onAdd: () => void;
  onView: (task: any) => void;
  onEdit: (task: any) => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export default function TaskList({ onAdd, onView, onEdit, showFeedback }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);

  const load = async () => {
    try {
      const res = await tasksApi.list();
      if (res.data?.status === 'success') setTasks(res.data.data.tasks || []);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load tasks');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Tasks</Typography>
        <Button variant="contained" onClick={onAdd}>Create Task</Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map(t => (
                <TableRow key={t._id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.clientName || t.clientId}</TableCell>
                  <TableCell>{t.assignedToUser ? t.assignedToUser.fullName : t.assignedTo}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => onView(t)}>View</Button>
                    <Button size="small" onClick={() => onEdit(t)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
