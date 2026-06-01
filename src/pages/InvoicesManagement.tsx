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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import { invoicesApi } from '../api/invoices';
import InvoiceForm from '../components/invoices/InvoiceForm';
import ClientLedger from './ClientLedger';
import SalesExpenses from './SalesExpenses';
import { Tabs, Tab } from '@mui/material';

export default function InvoicesManagement() {
  const [tab, setTab] = useState<'list' | 'ledger' | 'sales'>('list');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [scheduleReminder, setScheduleReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadInvoices = async () => {
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

  const displayStatus = (status: string) => {
    if (status === 'Overdue') return 'Overdue';
    if (status === 'Sent') return 'Sent';
    if (status === 'Paid') return 'Paid';
    return 'Pending';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Overdue':
        return 'error';
      case 'Sent':
        return 'success';
      case 'Paid':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const openSendModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEmailTo(invoice.clientEmail || '');
    setEmailBody(
      `Hello ${invoice.clientName || 'Client'},\n\nPlease find attached Invoice ${invoice.invoiceNumber} due on ${invoice.dueDate}.\n\nThank you,\nYour Company`
    );
    setScheduleReminder(false);
    setReminderDays(3);
    setSendOpen(true);
  };

  const handleCloseSend = () => {
    setSendOpen(false);
    setSelectedInvoice(null);
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    if (!emailTo) {
      setFeedback('Please enter recipient email');
      return;
    }

    try {
      const payload: any = {
        to: [emailTo],
        html: emailBody,
      };
      if (scheduleReminder) {
        payload.reminderRules = {
          daysBefore: [reminderDays],
          channel: 'Email',
        };
      }

      const response = await invoicesApi.send(selectedInvoice._id, payload);
      if (response.data?.status === 'success') {
        setFeedback('Invoice sent successfully');
        setInvoices((prev) =>
          prev.map((inv) =>
            inv._id === selectedInvoice._id
              ? {
                  ...inv,
                  status: 'Sent',
                  reminderRules: payload.reminderRules,
                }
              : inv
          )
        );
        handleCloseSend();
      } else {
        setFeedback('Failed to send invoice');
      }
    } catch (err: any) {
      setFeedback(err.response?.data?.message || err.message || 'Failed to send invoice');
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Invoices
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="List" value="list" />
          <Tab label="Client Ledger" value="ledger" />
          <Tab label="Sales & Expenses" value="sales" />
        </Tabs>
      </Box>

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

      {tab === 'list' && (
        <>
          <Box sx={{ mb: 4 }}>
            <InvoiceForm existingInvoices={invoices} onInvoiceCreated={loadInvoices} />
          </Box>

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
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv._id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.clientName || inv.clientId}</TableCell>
                          <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell align="right">INR {(inv.totalAmount ?? 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={displayStatus(inv.status)} color={statusColor(inv.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="contained" onClick={() => openSendModal(inv)}>
                              Send Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {tab === 'ledger' && <ClientLedger />}

      {tab === 'sales' && <SalesExpenses />}

      <Dialog open={sendOpen} onClose={handleCloseSend} fullWidth maxWidth="sm">
        <DialogTitle>Send Invoice</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice details'}
          </Typography>
          <TextField
            fullWidth
            label="To"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Email Body"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={scheduleReminder}
                onChange={(e) => setScheduleReminder(e.target.checked)}
              />
            }
            label="Schedule reminder"
          />
          {scheduleReminder && (
            <FormControl fullWidth>
              <InputLabel id="reminder-days-label">Reminder Before</InputLabel>
              <Select
                labelId="reminder-days-label"
                value={reminderDays}
                label="Reminder Before"
                onChange={(e) => setReminderDays(Number(e.target.value))}
              >
                {[1, 3, 5, 7].map((day) => (
                  <MenuItem key={day} value={day}>
                    {day} days before due date
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSend}>Cancel</Button>
          <Button variant="contained" onClick={handleSendInvoice}>
            Send Invoice
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!feedback}
        autoHideDuration={5000}
        onClose={() => setFeedback(null)}
        message={feedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
