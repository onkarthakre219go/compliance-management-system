import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, MenuItem } from '@mui/material';
import { expensesApi } from '../../api/expenses';

export default function ExpenseForm({ expense, onCancel, onSaved, showFeedback }: any) {
  const [title, setTitle] = useState(expense?.title || '');
  const [category, setCategory] = useState(expense?.category || 'Other');
  const [amount, setAmount] = useState(expense?.amount || 0);
  const [spentDate, setSpentDate] = useState(expense?.spentDate ? new Date(expense.spentDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
  const [spentBy, setSpentBy] = useState(expense?.spentBy || 'usr_associate');
  const [description, setDescription] = useState(expense?.description || '');

  const handleSave = async () => {
    try {
      const payload = { title, category, amount, spentDate, spentBy, description };
      if (expense) {
        await expensesApi.update(expense._id, payload);
        showFeedback('success', 'Expense updated');
      } else {
        await expensesApi.create(payload);
        showFeedback('success', 'Expense created');
      }
      onSaved && onSaved();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save expense');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
      <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
      <TextField select label="Category" value={category} onChange={e => setCategory(e.target.value)} fullWidth>
        <MenuItem value="Travel">Travel</MenuItem>
        <MenuItem value="Government Fees">Government Fees</MenuItem>
        <MenuItem value="Office Supplies">Office Supplies</MenuItem>
        <MenuItem value="Tech Subscriptions">Tech Subscriptions</MenuItem>
        <MenuItem value="Task Expense">Task Expense</MenuItem>
        <MenuItem value="Other">Other</MenuItem>
      </TextField>
      <TextField label="Amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} fullWidth />
      <TextField label="Spent Date" type="date" value={spentDate} onChange={e => setSpentDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
      <TextField label="Spent By (user id)" value={spentBy} onChange={e => setSpentBy(e.target.value)} fullWidth />
      <TextField label="Notes" value={description} onChange={e => setDescription(e.target.value)} multiline rows={3} fullWidth />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleSave}>Save</Button>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
      </Box>
    </Box>
  );
}
