import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from '@mui/material';
import { invoicesApi } from '../api/invoices';

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await invoicesApi.list();
        if (res.data?.status === 'success') {
          setInvoices(res.data.data.invoices || []);
        } else {
          setInvoices([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Invoices
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.clientName || inv.clientId}</TableCell>
                      <TableCell>
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell align="right">
                        INR {(inv.totalAmount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={inv.status} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
