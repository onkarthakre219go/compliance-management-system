import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { tasksApi } from '../api/tasks';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

const viewModes = ['kanban', 'list', 'calendar'] as const;
const statusOptions = ['To Do', 'In Progress', 'Review', 'Done'] as const;
const priorityOptions = ['Low', 'Medium', 'High'] as const;
const complianceOptions = ['ROC', 'GST', 'ITR', 'FEMA', 'TDS'] as const;

function mapStatusFilter(status: string) {
  const mapping: Record<string, string> = {
    'To Do': 'Pending',
    'In Progress': 'In Progress',
    Review: 'Under Review',
    Done: 'Completed'
  };
  return mapping[status] || status;
}

function mapComplianceType(value: string) {
  const mapping: Record<string, string> = {
    ROC: 'Corporate Law',
    GST: 'GST',
    ITR: 'Income Tax',
    FEMA: 'FEMA',
    TDS: 'GST'
  };
  return mapping[value] || value;
}

interface Props {
  onAdd: () => void;
  onView: (task: any) => void;
  onEdit: (task: any) => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export default function TaskDashboard({ onAdd, onView, onEdit, showFeedback }: Props) {
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<typeof viewModes[number]>('list');
  const [assignedTo, setAssignedTo] = useState('');
  const [clientName, setClientName] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [complianceType, setComplianceType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await tasksApi.list();
        if (res.data?.status === 'success') {
          setTasks(res.data.data.tasks || []);
        } else {
          setTasks([]);
          showFeedback('error', 'Unable to load tasks.');
        }
      } catch (err: any) {
        setTasks([]);
        showFeedback('error', err.message || 'Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showFeedback]);

  const filterConfig = useMemo(() => ({ assignedTo, clientName, priority, status, dueFrom, dueTo, complianceType, search }), [assignedTo, clientName, priority, status, dueFrom, dueTo, complianceType, search]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      if (assignedTo && task.assignedToUser?.fullName !== assignedTo) return false;
      if (clientName && !task.clientName?.toLowerCase().includes(clientName.toLowerCase())) return false;
      if (priority && task.priority !== priority) return false;
      if (status && task.status !== mapStatusFilter(status)) return false;
      if (complianceType) {
        const target = mapComplianceType(complianceType);
        if (!task.templateCategory && !task.templateName) return false;
        if (task.templateCategory) {
          if (task.templateCategory !== target) return false;
        } else if (task.templateName) {
          if (!task.templateName.toLowerCase().includes(complianceType.toLowerCase())) return false;
        }
      }
      if (dueFrom) {
        const startValue = new Date(dueFrom);
        if (!task.dueDate || new Date(task.dueDate) < startValue) return false;
      }
      if (dueTo) {
        const endValue = new Date(dueTo);
        if (!task.dueDate || new Date(task.dueDate) > endValue) return false;
      }
      if (search) {
        const query = search.toLowerCase();
        const matchTitle = task.title?.toLowerCase().includes(query);
        const matchClient = task.clientName?.toLowerCase().includes(query);
        const matchDescription = task.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchClient && !matchDescription) return false;
      }
      return true;
    });
  }, [tasks, filterConfig]);

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, dueToday: 0, overdue: 0, completedThisMonth: 0 };

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(midnight.getTime() + 24 * 60 * 60 * 1000 - 1);

    const total = tasks.length;
    const dueToday = tasks.filter((task) => task.dueDate && new Date(task.dueDate) >= midnight && new Date(task.dueDate) <= endOfDay && task.status !== 'Completed').length;
    const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < midnight && task.status !== 'Completed').length;
    const completedThisMonth = tasks.filter((task) => {
      if (task.status !== 'Completed') return false;
      const completedAt = task.actualCompletionDate ? new Date(task.actualCompletionDate) : new Date(task.updatedAt || task.createdAt);
      return completedAt.getFullYear() === now.getFullYear() && completedAt.getMonth() === now.getMonth();
    }).length;

    return { total, dueToday, overdue, completedThisMonth };
  }, [tasks]);

  const assignedToOptions = useMemo(() => {
    if (!tasks) return [];
    const names = tasks
      .map((task) => task.assignedToUser?.fullName || 'Unassigned')
      .filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [tasks]);

  const clientOptions = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((task) => task.clientName).filter(Boolean)));
  }, [tasks]);

  const taskColumns = useMemo(
    () => [
      { key: 'Pending', label: 'To Do' },
      { key: 'In Progress', label: 'In Progress' },
      { key: 'Under Review', label: 'Review' },
      { key: 'Completed', label: 'Done' }
    ],
    []
  );

  const calendarEvents = useMemo(() => {
    return filteredTasks.map((task) => ({
      title: `${task.title} • ${task.clientName || 'Client'}`,
      start: task.dueDate ? new Date(task.dueDate) : new Date(),
      end: task.dueDate ? new Date(task.dueDate) : new Date(),
      resource: task,
      allDay: true
    }));
  }, [filteredTasks]);

  if (loading || tasks === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Task Dashboard</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        View tasks in a board, table or calendar and refine the queue with smart filters.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Tasks', value: stats.total },
          { label: 'Due Today', value: stats.dueToday },
          { label: 'Overdue', value: stats.overdue },
          { label: 'Completed This Month', value: stats.completedThisMonth }
        ].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Filters & Search</Typography>
        <Button variant="contained" onClick={onAdd} sx={{ px: 3 }}>+ Create Task</Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.04)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Assigned To"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                sx={{ minWidth: 180, flex: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                {assignedToOptions.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Client Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                sx={{ minWidth: 220, flex: 1 }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                sx={{ minWidth: 160, flex: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ minWidth: 180, flex: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="Due from"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ minWidth: 160, flex: 1,
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer',
                  },
                 }}
              />

              <TextField
                type="date"
                label="Due to"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{ minWidth: 160, flex: 1,
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer',
                  },
                 }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Compliance Type"
                value={complianceType}
                onChange={(e) => setComplianceType(e.target.value)}
                sx={{ minWidth: 180, flex: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                {complianceOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="🔍 Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 220, flex: 1 }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button size="small" variant="outlined" onClick={() => {
                setAssignedTo(''); setClientName(''); setPriority(''); setStatus(''); setDueFrom(''); setDueTo(''); setComplianceType(''); setSearch('');
              }}>
                Clear all filters
              </Button>
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching filters
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <ButtonGroup variant="outlined" color="primary">
          {viewModes.map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'contained' : 'outlined'}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'kanban' ? 'Kanban Board' : mode === 'list' ? 'List Table' : 'Calendar'}
            </Button>
          ))}
        </ButtonGroup>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Showing {filteredTasks.length} tasks
        </Typography>
      </Box>

      {viewMode === 'kanban' && (
        <Grid container spacing={2} wrap="wrap" alignItems="flex-start">
          {taskColumns.map((column) => {
            const columnTasks = filteredTasks.filter((task) => task.status === column.key);
            return (
              <Grid item xs={12} sm={6} md={3} lg={3} key={column.key}>
                <Paper sx={{ p: 2, minHeight: 400, bgcolor: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{column.label}</Typography>
                  {columnTasks.map((task) => (
                    <Card key={task._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => onView(task)}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.clientName || task.clientId}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip label={task.priority} size="small" color={task.priority === 'High' || task.priority === 'Critical' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'} />
                          <Chip label={task.assignedToUser?.fullName || 'Unassigned'} size="small" />
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                          Due {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : 'n/a'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>No tasks here.</Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {viewMode === 'calendar' && (
        <Paper sx={{ p: 2, minHeight: 600 }}>
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ minHeight: 600 }}
            onSelectEvent={(event: any) => onView(event.resource)}
          />
        </Paper>
      )}

      {viewMode === 'list' && (
        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task._id} hover>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.clientName || task.clientId}</TableCell>
                    <TableCell>{task.assignedToUser?.fullName || 'Unassigned'}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>{task.templateCategory || task.templateName || '-'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => onView(task)}>View</Button>
                        <Button size="small" onClick={() => onEdit(task)}>Edit</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
