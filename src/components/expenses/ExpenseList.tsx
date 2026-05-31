import React, { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, MenuItem } from '@mui/material';
import { expensesApi } from '../../api/expenses';

export default function ExpenseList({ onEdit, showFeedback }: any) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [category, setCategory] = useState('');

  const load = async () => {
    try {
      const res = await expensesApi.list({ category: category || undefined });
      if (res.data?.status === 'success') setExpenses(res.data.data.expenses || []);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load expenses');
    }
  };

  useEffect(() => { load(); }, [category]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesApi.remove(id);
      showFeedback('success', 'Expense deleted');
      load();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField select size="small" label="Category" value={category} onChange={e => setCategory(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Travel">Travel</MenuItem>
          <MenuItem value="Government Fees">Government Fees</MenuItem>
          <MenuItem value="Office Supplies">Office Supplies</MenuItem>
          <MenuItem value="Tech Subscriptions">Tech Subscriptions</MenuItem>
          <MenuItem value="Task Expense">Task Expense</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <Button variant="contained" onClick={load}>Refresh</Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Spent Date</TableCell>
                <TableCell>By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map(e => (
                <TableRow key={e._id}>
                  <TableCell>{e.title}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.amount}</TableCell>
                  <TableCell>{e.spentDate ? new Date(e.spentDate).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{e.spentByName || e.spentBy || ''}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => onEdit(e)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(e._id)}>Delete</Button>
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
