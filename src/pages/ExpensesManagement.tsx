import React, { useState } from 'react';
import { Box, Grid, Button, Snackbar, Alert } from '@mui/material';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseSummary from '../components/expenses/ExpenseSummary';

export default function ExpensesManagement() {
  const [view, setView] = useState<'list'|'add'|'edit'>('list');
  const [selected, setSelected] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success'|'error'; message: string } | null>(null);

  const showFeedback = (type: 'success'|'error', message: string) => setFeedback({ type, message });

  return (
    <Box sx={{ py: 1 }}>
      {view === 'list' && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <ExpenseList onEdit={(e:any) => { setSelected(e); setView('edit'); }} showFeedback={showFeedback} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="contained" onClick={() => { setSelected(null); setView('add'); }}>Add Expense</Button>
            </Box>
            <ExpenseSummary year={new Date().getFullYear()} month={new Date().getMonth()+1} showFeedback={showFeedback} />
          </Grid>
        </Grid>
      )}

      {view === 'add' && (
        <ExpenseForm expense={null} onCancel={() => setView('list')} onSaved={() => setView('list')} showFeedback={showFeedback} />
      )}

      {view === 'edit' && selected && (
        <ExpenseForm expense={selected} onCancel={() => setView('list')} onSaved={() => setView('list')} showFeedback={showFeedback} />
      )}

      <Snackbar open={!!feedback} autoHideDuration={6000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={() => setFeedback(null)} severity={feedback?.type || 'success'} sx={{ width: '100%' }}>{feedback?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
