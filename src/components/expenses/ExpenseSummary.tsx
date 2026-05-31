import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';
import { expensesApi } from '../../api/expenses';

export default function ExpenseSummary({ year, month, showFeedback }: any) {
  const [summary, setSummary] = useState<any>(null);

  const load = async () => {
    try {
      const res = await expensesApi.summary({ period: 'monthly', year, month });
      if (res.data?.status === 'success') setSummary(res.data.data);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load summary');
    }
  };

  useEffect(() => { load(); }, [year, month]);

  if (!summary) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Monthly Summary</Typography>
        <Typography variant="caption">{summary.month}/{summary.year} • Total: INR {summary.total}</Typography>
        <List>
          {Object.keys(summary.totals || {}).map(k => (
            <ListItem key={k}>
              <ListItemText primary={k} secondary={`INR ${summary.totals[k]}`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
