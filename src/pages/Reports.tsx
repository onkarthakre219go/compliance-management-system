import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import { reportsApi } from '../api/reports';
import ReportExport from '../components/ReportExport';

type ReportType = 'active' | 'inactive' | 'grade' | 'government-pending' | 'professional-pending';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('active');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<'A' | 'B' | 'C' | 'D' | ''>('');

  const reportTitle = useMemo(() => {
    switch (activeReport) {
      case 'active': return 'Active Clients';
      case 'inactive': return 'Inactive Clients';
      case 'grade': return 'Grade Wise Clients';
      case 'government-pending': return 'Government Fees Pending';
      case 'professional-pending': return 'Professional Fees Pending';
      default: return 'Reports';
    }
  }, [activeReport]);

  const loadReport = async () => {
    try {
      setError(null);
      setLoading(true);

      if (activeReport === 'grade') {
        const params = gradeFilter ? { type: 'grade', grade: gradeFilter } : { type: 'grade' };
        const response = await reportsApi.clients(params);
        setData(response.data?.data);
      } else if (activeReport === 'active' || activeReport === 'inactive') {
        const response = await reportsApi.clients({ type: activeReport });
        setData(response.data?.data);
      } else {
        const response = await reportsApi.fees(activeReport);
        setData(response.data?.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, gradeFilter]);

  const renderClientTable = () => {
    if (!data?.clients || !data.clients.length) {
      return <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No clients match this report.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>PAN</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Client Type</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.clients.map((client: any) => (
              <TableRow key={client._id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.pan}</TableCell>
                <TableCell>
                  <Chip label={client.status} color={client.status === 'active' ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>{client.grade}</TableCell>
                <TableCell>{client.clientType}</TableCell>
                <TableCell>{client.assignedToUser?.fullName || 'Unassigned'}</TableCell>
                <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderGradeSummary = () => {
    const totals = data?.totals || {};
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
        {(['A', 'B', 'C', 'D'] as const).map((grade) => (
          <Card key={grade} sx={{ minWidth: 180, flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Grade {grade}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totals[grade] || 0}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderFeeTable = () => {
    if (!data?.invoices || !data.invoices.length) {
      return <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No pending invoices found for this fee type.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Fee Type</TableCell>
              <TableCell>Amount Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.invoices.map((invoice: any) => (
              <TableRow key={invoice.invoiceId}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.feeType}</TableCell>
                <TableCell>INR {invoice.amountDue.toLocaleString()}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 800 }}>
        Reports Module
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 640 }}>
        Pick a report to review client segments and outstanding fee obligations across the compliance portfolio.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(
          [
            { key: 'active', label: 'Active Clients' },
            { key: 'inactive', label: 'Inactive Clients' },
            { key: 'grade', label: 'Grade Wise Clients' },
            { key: 'government-pending', label: 'Government Fees Pending' },
            { key: 'professional-pending', label: 'Professional Fees Pending' }
          ] as { key: ReportType; label: string }[]
        ).map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
            <Button
              fullWidth
              variant={activeReport === item.key ? 'contained' : 'outlined'}
              onClick={() => { setActiveReport(item.key); setGradeFilter(''); }}
              sx={{ py: 2, textTransform: 'none' }}
            >
              {item.label}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {reportTitle}
        </Typography>
        {activeReport === 'grade' && (
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Use the grade filter to view a single grade cohort, or leave blank for a summary of all grades.
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {activeReport === 'grade' && (
            <Button
              variant={gradeFilter === 'A' ? 'contained' : 'outlined'}
              onClick={() => setGradeFilter('A')}
            >
              Grade A
            </Button>
          )}
          {activeReport === 'grade' && (
            <Button
              variant={gradeFilter === 'B' ? 'contained' : 'outlined'}
              onClick={() => setGradeFilter('B')}
            >
              Grade B
            </Button>
          )}
          {activeReport === 'grade' && (
            <Button
              variant={gradeFilter === 'C' ? 'contained' : 'outlined'}
              onClick={() => setGradeFilter('C')}
            >
              Grade C
            </Button>
          )}
          {activeReport === 'grade' && (
            <Button
              variant={gradeFilter === 'D' ? 'contained' : 'outlined'}
              onClick={() => setGradeFilter('D')}
            >
              Grade D
            </Button>
          )}
          {activeReport === 'grade' && gradeFilter && (
            <Button variant="text" onClick={() => setGradeFilter('')}>
              Clear grade filter
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}

        {!loading && !error && (
          <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Export Options
            </Typography>
            <ReportExport
              reportType={activeReport}
              reportTitle={reportTitle}
              filters={{ grade: gradeFilter || undefined }}
              disabled={loading}
            />
          </Box>
        )}

        {!loading && !error && (
          <>
            {activeReport === 'grade' ? renderGradeSummary() : null}
            {activeReport === 'active' || activeReport === 'inactive' || (activeReport === 'grade' && gradeFilter) ? renderClientTable() : null}
            {(activeReport === 'government-pending' || activeReport === 'professional-pending') ? (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>
                  Total outstanding: INR {Number(data?.totalOutstanding || 0).toLocaleString()}
                </Typography>
                {renderFeeTable()}
              </>
            ) : null}
          </>
        )}
      </Card>
    </Box>
  );
}
