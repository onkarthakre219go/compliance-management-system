import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from 'lucide-react';
import { reportsApi } from '../api/reports';

type ReportType = 'active' | 'inactive' | 'grade' | 'government-pending' | 'professional-pending';

interface ReportExportProps {
  reportType: ReportType;
  reportTitle: string;
  filters?: {
    grade?: string;
  };
  disabled?: boolean;
}

/**
 * Component for downloading reports in Excel and PDF formats
 */
export default function ReportExport({
  reportType,
  reportTitle,
  filters = {},
  disabled = false,
}: ReportExportProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setError(null);
      setExporting(format);

      let response;
      if (reportType === 'active' || reportType === 'inactive' || reportType === 'grade') {
        // Client report
        const params: any = { type: reportType };
        if (filters.grade) {
          params.grade = filters.grade;
        }

        response =
          format === 'excel'
            ? await reportsApi.exportClientsExcel(params)
            : await reportsApi.exportClientsPDF(params);
      } else {
        // Fee report
        response =
          format === 'excel'
            ? await reportsApi.exportFeesExcel(reportType as 'government-pending' | 'professional-pending')
            : await reportsApi.exportFeesPDF(reportType as 'government-pending' | 'professional-pending');
      }

      // Create download link
      const blob = new Blob([response.data], {
        type:
          format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = reportTitle.toLowerCase().replace(/\s+/g, '-');
      link.download = `${baseFilename}-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowDialog(false);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={exporting === 'excel' ? <CircularProgress size={18} /> : <DownloadIcon size={18} />}
          onClick={() => handleExport('excel')}
          disabled={disabled || exporting !== null}
          sx={{ textTransform: 'none' }}
        >
          Export Excel
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={exporting === 'pdf' ? <CircularProgress size={18} /> : <DownloadIcon size={18} />}
          onClick={() => handleExport('pdf')}
          disabled={disabled || exporting !== null}
          sx={{ textTransform: 'none' }}
        >
          Export PDF
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
}
