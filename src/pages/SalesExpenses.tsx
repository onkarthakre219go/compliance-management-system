import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Input,
} from '@mui/material';
import { invoicesApi } from '../api/invoices';
import { expensesApi } from '../api/expenses';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

function getInvoiceTotal(inv: any) {
  if (!inv) return 0;
  if (typeof inv.total === 'number') return inv.total;
  if (typeof inv.totalDue === 'number') return inv.totalDue;
  if (typeof inv.amount === 'number') return inv.amount;
  // compute fallback from items
  const items = inv.items || [];
  const itemsSum = items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0);
  const gst = typeof inv.gst === 'number' ? inv.gst : 0;
  const subtotal = typeof inv.subtotal === 'number' ? inv.subtotal : itemsSum;
  return subtotal + gst;
}

export default function SalesExpenses() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [invRes, expRes] = await Promise.all([invoicesApi.list(), expensesApi.list()]);
        setInvoices(invRes?.data?.data?.invoices || []);
        setExpenses(expRes?.data?.data?.expenses || []);
      } catch (err) {
        setInvoices([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, inv) => s + getInvoiceTotal(inv), 0);
    const totalCollected = invoices.reduce((s, inv) => {
      if (inv.status === 'Paid') return s + getInvoiceTotal(inv);
      if (typeof inv.paidAmount === 'number') return s + inv.paidAmount;
      return s;
    }, 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return { totalInvoiced, totalCollected, totalPending: totalInvoiced - totalCollected, totalExpenses };
  }, [invoices, expenses]);

  // monthly revenue trend (last 12 months)
  const monthly = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      months.push({ label, key, value: 0 });
    }
    invoices.forEach((inv) => {
      const date = inv.issueDate ? new Date(inv.issueDate) : inv.createdAt ? new Date(inv.createdAt) : null;
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx >= 0) months[idx].value += getInvoiceTotal(inv);
    });
    return months;
  }, [invoices]);

  const maxVal = Math.max(1, ...monthly.map((m) => m.value));

  const onPickFile = (expenseId: string) => {
    const input = fileInputsRef.current[expenseId];
    if (input) input.click();
  };

  const onFileChange = (expenseId: string, f?: FileList | null) => {
    const file = f && f.length > 0 ? f[0] : null;
    setUploadedFiles((prev) => ({ ...prev, [expenseId]: file }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>
        Sales & Expense Tracker
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Invoiced</Typography>
              <Typography variant="h6">{formatCurrency(totals.totalInvoiced)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Collected</Typography>
              <Typography variant="h6">{formatCurrency(totals.totalCollected)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Pending</Typography>
              <Typography variant="h6">{formatCurrency(totals.totalPending)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Expenses</Typography>
              <Typography variant="h6">{formatCurrency(totals.totalExpenses)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Monthly Revenue (last 12 months)
            </Typography>
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <svg width="100%" height="180" viewBox={`0 0 ${monthly.length * 60} 180`} preserveAspectRatio="none">
                <g transform="translate(0,10)">
                  {monthly.map((m, i) => {
                    const w = 40;
                    const gap = 20;
                    const x = i * (w + gap) + gap / 2;
                    const h = (m.value / maxVal) * 120;
                    const y = 150 - h;
                    return (
                      <g key={m.key}>
                        <rect x={x} y={y} width={w} height={h} fill="#1976d2" rx={4} />
                        <text x={x + w / 2} y={165} fontSize={12} textAnchor="middle" fill="#333">
                          {m.label}
                        </text>
                        <text x={x + w / 2} y={y - 6} fontSize={11} textAnchor="middle" fill="#111">
                          {Math.round(m.value)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Recent Expenses
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.slice(0, 8).map((e) => (
                    <TableRow key={e._id || `${e.id}-${e.date}`}>
                      <TableCell>{e.category || e.type || 'Misc'}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(e.amount || 0))}</TableCell>
                      <TableCell>{e.date ? new Date(e.date).toLocaleDateString() : e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <input
                          ref={(el) => (fileInputsRef.current[e._id || e.id] = el)}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(ev) => onFileChange(e._id || e.id, ev.target.files)}
                        />
                        <Button
                          size="small"
                          variant={uploadedFiles[e._id || e.id] ? 'contained' : 'outlined'}
                          startIcon={<UploadFileIcon />}
                          onClick={() => onPickFile(e._id || e.id)}
                        >
                          {uploadedFiles[e._id || e.id] ? 'Uploaded' : 'Upload'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No expenses recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Expense Tracker (all)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e._id || `${e.id}-${e.date}`}>
                    <TableCell>{e.category || e.type || 'Misc'}</TableCell>
                    <TableCell align="right">{formatCurrency(Number(e.amount || 0))}</TableCell>
                    <TableCell>{e.date ? new Date(e.date).toLocaleDateString() : e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{e.description || ''}</TableCell>
                    <TableCell>
                      <input
                        ref={(el) => (fileInputsRef.current[e._id || e.id] = el)}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(ev) => onFileChange(e._id || e.id, ev.target.files)}
                      />
                      <Button
                        size="small"
                        variant={uploadedFiles[e._id || e.id] ? 'contained' : 'outlined'}
                        startIcon={<UploadFileIcon />}
                        onClick={() => onPickFile(e._id || e.id)}
                      >
                        {uploadedFiles[e._id || e.id] ? 'Uploaded' : 'Upload'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No expenses recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
