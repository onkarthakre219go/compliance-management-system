import React, { useState } from 'react';
import { Box } from '@mui/material';
import TaskDashboard from './TaskDashboard';
import TaskForm from '../components/tasks/TaskForm';
import TaskDetails from '../components/tasks/TaskDetails';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

export default function TasksManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => setFeedback({ type, message });

  return (
    <Box sx={{ py: 1 }}>
      {viewMode === 'list' && (
        <TaskDashboard
          onAdd={() => { setSelectedTask(null); setViewMode('add'); }}
          onEdit={(t) => { setSelectedTask(t); setViewMode('edit'); }}
          onView={(t) => { setSelectedTask(t); setViewMode('view'); }}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'add' && (
        <TaskForm
          task={null}
          onCancel={() => setViewMode('list')}
          onSaved={() => setViewMode('list')}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'edit' && selectedTask && (
        <TaskForm
          task={selectedTask}
          onCancel={() => setViewMode('list')}
          onSaved={() => setViewMode('list')}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'view' && selectedTask && (
        <TaskDetails
          taskId={selectedTask._id}
          onBack={() => setViewMode('list')}
          showFeedback={showFeedback}
        />
      )}
    </Box>
  );
}
