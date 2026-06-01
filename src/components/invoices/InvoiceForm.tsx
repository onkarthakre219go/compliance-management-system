import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { invoicesApi } from '../../api/invoices';
import { apiClient } from '../../api/apiClient';

interface InvoiceFormProps {
  existingInvoices: any[];
  onInvoiceCreated: () => void;
}

interface ClientOption {
  _id: string;
  name: string;
  pan?: string;
}

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function InvoiceForm({ existingInvoices, onInvoiceCreated }: InvoiceFormProps) {
  const [clientId, setClientId] = useState('');
  const [serviceType, setServiceType] = useState('Compliance Advisory');
  const [issueDate, setIssueDate] = useState(formatDate(new Date()));
  const [dueDate, setDueDate] = useState(formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [professionalFees, setProfessionalFees] = useState<number>(0);
  const [govtFees, setGovtFees] = useState<number>(0);
  const [govtFeesReimbursable, setGovtFeesReimbursable] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const nextInvoiceNumber = useMemo(() => {
    const year = new Date(issueDate).getFullYear();
    const pattern = new RegExp(`^CA-${year}-(\\d{4})$`);
    const sequence = existingInvoices.reduce((max, invoice) => {
      const invoiceNumber = String(invoice.invoiceNumber || '');
      const match = invoiceNumber.match(pattern);
      if (!match) return max;
      return Math.max(max, Number(match[1]));
    }, 0);
    return `CA-${year}-${String(sequence + 1).padStart(4, '0')}`;
  }, [existingInvoices, issueDate]);

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === clientId),
    [clients, clientId]
  );

  const formatCurrency = (value: number) => {
    return `INR ${value.toFixed(2)}`;
  };

  const professionalSubtotal = useMemo(() => Number(professionalFees) || 0, [professionalFees]);
  const governmentFeesAmount = useMemo(() => Number(govtFees) || 0, [govtFees]);
  const subtotal = useMemo(
    () => professionalSubtotal + governmentFeesAmount,
    [professionalSubtotal, governmentFeesAmount]
  );
  const gstAmount = useMemo(
    () => (professionalSubtotal * (Number(gstRate) || 0)) / 100,
    [professionalSubtotal, gstRate]
  );
  const totalDue = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const response = await apiClient.get('/clients', { params: { status: 'active' } });
        setClients(response.data?.data?.clients || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: nextInvoiceNumber,
  });

  const handleClientChange = (event: SelectChangeEvent<string>) => {
    setClientId(event.target.value as string);
  };

  const handleCreateInvoice = async () => {
    if (!clientId) {
      setError('Please select a client before creating the invoice.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const invoiceItems: any[] = [
        {
          description: serviceType || 'Compliance Advisory Services',
          amount: professionalSubtotal,
          gstRate: Number(gstRate) || 0,
          sacCode: '9982',
          feeType: 'Professional',
        },
      ];

      if (governmentFeesAmount > 0) {
        invoiceItems.push({
          description: 'Government Fees',
          amount: governmentFeesAmount,
          gstRate: 0,
          sacCode: '9982',
          feeType: 'Government',
          reimbursable: govtFeesReimbursable,
        });
      }

      const payload = {
        clientId,
        issueDate,
        dueDate,
        items: invoiceItems,
        notes: `Auto-generated invoice for ${serviceType}`,
      };

      const response = await invoicesApi.create(payload);
      if (response.data?.status === 'success') {
        setSuccess(`Invoice ${response.data.data.invoice.invoiceNumber} created successfully.`);
        onInvoiceCreated();
      } else {
        setError('Failed to create invoice. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'stretch' }}>
      <Box>
        <Card sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Generate Invoice
          </Typography>

          <Box component="form" noValidate autoComplete="off">
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="invoice-client-label">Client</InputLabel>
              <Select
                labelId="invoice-client-label"
                value={clientId}
                label="Client"
                onChange={handleClientChange}
                disabled={loadingClients}
                renderValue={(value) => {
                  const client = clients.find((item) => item._id === value);
                  return client ? client.name : 'Select client';
                }}
              >
                {loadingClients ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                    <Typography sx={{ ml: 1 }}>Loading clients…</Typography>
                  </MenuItem>
                ) : (
                  clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Service Type"
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              sx={{ mb: 2 }}
            />

            <Card sx={{ mb: 2, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'warning.dark' }}>
                  Govt fees paid from pocket
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Government Fees (INR)"
                  value={govtFees}
                  onChange={(e) => setGovtFees(Number(e.target.value))}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      inputProps: { min: 0, step: '0.01' },
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={govtFeesReimbursable}
                      onChange={(e) => setGovtFeesReimbursable(e.target.checked)}
                      sx={{ color: 'warning.main' }}
                    />
                  }
                  label="Mark as reimbursable"
                  sx={{ color: 'warning.dark' }}
                />
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'info.dark' }}>
                  Professional fees
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Professional Fees (INR)"
                  value={professionalFees}
                  onChange={(e) => setProfessionalFees(Number(e.target.value))}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      inputProps: { min: 0, step: '0.01' },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="GST Rate (%)"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  sx={{ mb: 0 }}
                  slotProps={{
                    input: {
                      inputProps: { min: 0, max: 100, step: '0.1' },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <TextField
              fullWidth
              label="Invoice Number"
              value={nextInvoiceNumber}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />

            <TextField
              fullWidth
              type="date"
              label="Issue Date"
              value={issueDate}
              onChange={(evt) => setIssueDate(evt.target.value)}
              sx={{ mb: 2 }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={dueDate}
              onChange={(evt) => setDueDate(evt.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              disabled={submitting || !clientId}
              onClick={handleCreateInvoice}
              sx={{ textTransform: 'none' }}
            >
              {submitting ? 'Creating Invoice…' : 'Create Invoice'}
            </Button>
          </Box>
        </Card>
      </Box>

      <Box>
        <Card sx={{ p: 2, height: '100%' }}>
          <Box ref={previewRef}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Invoice Preview
            </Typography>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {nextInvoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Issue Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {issueDate}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Bill To
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {selectedClient?.name || 'Select a client'}
                  </Typography>
                  {selectedClient?.pan && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      PAN: {selectedClient.pan}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Due Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {dueDate}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Invoice Items
              </Typography>

              <Card sx={{ mb: 2, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.dark', mb: 1 }}>
                    Govt fees paid from pocket
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatCurrency(governmentFeesAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Reimbursable: {govtFeesReimbursable ? 'Yes' : 'No'}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.dark', mb: 1 }}>
                    Professional fees
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatCurrency(professionalSubtotal)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {serviceType || 'Compliance Advisory Services'}
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    GST ({gstRate}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrency(gstAmount)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Grand Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totalDue)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handlePrint}
              disabled={!nextInvoiceNumber}
              sx={{ textTransform: 'none' }}
            >
              Generate PDF
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateInvoice}
              disabled={submitting || !clientId}
              sx={{ textTransform: 'none' }}
            >
              {submitting ? 'Creating…' : 'Create Invoice'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
