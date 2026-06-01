import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import { invoicesApi } from '../api/invoices';
import { apiClient } from '../api/apiClient';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';

export default function ClientLedger() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);

  const printableRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = useReactToPrint({ content: () => printableRef.current, documentTitle: `Ledger-${selectedClient}-${year}` });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await apiClient.get('/clients', { params: { status: 'active' } });
        setClients(res.data?.data?.clients || []);
      } catch (err) {
        setClients([]);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedClient) return setInvoices([]);
      setLoading(true);
      try {
        const res = await invoicesApi.list({ clientId: selectedClient });
        const all = res.data?.data?.invoices || [];
        // filter by financial year Apr 1 (year) to Mar 31 (year+1)
        const start = new Date(year, 3, 1, 0, 0, 0); // Apr 1
        const end = new Date(year + 1, 2, 31, 23, 59, 59); // Mar 31 next year
        const filtered = all.filter((inv: any) => {
          const d = inv.issueDate ? new Date(inv.issueDate) : null;
          if (!d) return false;
          return d >= start && d <= end;
        });
        setInvoices(filtered);
      } catch (err) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedClient, year]);

  const rows = useMemo(() => {
    return invoices.map((inv) => {
      const gov = (inv.items || []).reduce((s: number, it: any) => {
        const feeType = it.feeType || (String(it.description || '').toLowerCase().includes('government') ? 'Government' : 'Professional');
        return s + (feeType === 'Government' ? Number(it.amount || 0) : 0);
      }, 0);
      const prof = (inv.items || []).reduce((s: number, it: any) => {
        const feeType = it.feeType || (String(it.description || '').toLowerCase().includes('government') ? 'Government' : 'Professional');
        return s + (feeType === 'Professional' ? Number(it.amount || 0) : 0);
      }, 0);
      return {
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.issueDate ? new Date(inv.issueDate) : null,
        service: (inv.items && inv.items[0] && inv.items[0].description) || '',
        govtFees: gov,
        profFees: prof,
        status: inv.status,
      };
    });
  }, [invoices]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.govt += r.govtFees;
        acc.prof += r.profFees;
        return acc;
      },
      { govt: 0, prof: 0 }
    );
  }, [rows]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Invoice #', 'Date', 'Service', 'Govt Fees', 'Prof Fees', 'Status'],
      ...rows.map((r) => [
        r.invoiceNumber,
        r.date ? r.date.toISOString().split('T')[0] : '',
        r.service,
        r.govtFees,
        r.profFees,
        r.status,
      ]),
      [],
      ['Totals', '', '', totals.govt, totals.prof, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${selectedClient || 'all'}_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>
        Client Ledger
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            size="small"
            label="Client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(String(e.target.value))}
            helperText="Select a client to load ledger data"
          >
            <MenuItem value="">-- Select client --</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Financial Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <MenuItem key={y} value={y}>
                  {`${y}-${String(y + 1).slice(2)}`}
                </MenuItem>
              );
            })}
          </TextField>
        </Grid>

        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Button variant="outlined" onClick={exportExcel} disabled={!selectedClient || loading}>
            Export Excel
          </Button>
          <Button variant="outlined" onClick={handlePrint} disabled={!selectedClient || loading}>
            Export PDF
          </Button>
        </Grid>
      </Grid>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Service</TableCell>
                <TableCell align="right">Govt Fees</TableCell>
                <TableCell align="right">Prof Fees</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    No records for selected year.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.invoiceNumber}</TableCell>
                    <TableCell>{r.date ? r.date.toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{r.service}</TableCell>
                    <TableCell align="right">{r.govtFees.toLocaleString()}</TableCell>
                    <TableCell align="right">{r.profFees.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={
                        r.status === 'Paid' ? 'primary' : r.status === 'Overdue' ? 'error' : 'warning'
                      } />
                    </TableCell>
                  </TableRow>
                ))
              )}

              {rows.length > 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    Totals
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {totals.govt.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {totals.prof.toLocaleString()}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2, display: 'none' }}>
        <div ref={printableRef} />
      </Box>
    </Box>
  );
}
