import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { tasksApi } from '../api/tasks';

function statLabel(count: number, label: string) {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>{count}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
    </Box>
  );
}

export default function EmployeeTaskDashboard() {
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await tasksApi.list();
        if (res.data?.status === 'success') setTasks(res.data.data.tasks || []);
        else setTasks([]);
      } catch (err) {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || tasks === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const now = new Date();
  const upcomingWindowDays = 7;
  const upcomingCutoff = new Date(now.getTime() + upcomingWindowDays * 24 * 3600 * 1000);

  const completed = tasks.filter(t => t.status === 'Completed');
  const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Under Review');
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed');
  const upcoming = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= upcomingCutoff && t.status !== 'Completed');

  const shortList = (arr: any[]) => arr.slice(0, 5).map(t => (
    <ListItem key={t._id} divider>
      <ListItemText primary={t.title} secondary={`${t.clientName || t.clientId} • ${t.priority}`} />
    </ListItem>
  ));

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Employee Task Dashboard</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              {statLabel(pending.length, 'Pending Tasks')}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              {statLabel(overdue.length, 'Overdue Tasks')}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              {statLabel(completed.length, 'Completed Tasks')}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              {statLabel(upcoming.length, `Upcoming (${upcomingWindowDays}d)`) }
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Overdue Tasks</Typography>
              <List>{shortList(overdue)}</List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Upcoming Tasks</Typography>
              <List>{shortList(upcoming)}</List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
