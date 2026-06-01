import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import PublishIcon from '@mui/icons-material/Publish';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import BusinessIcon from '@mui/icons-material/Business';

import { apiClient } from '../../api/apiClient';

interface ClientBulkImportProps {
  onBack: () => void;
  onImportSuccess: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

interface ParsedRecord {
  rowNumber: number;
  name: string;
  tradeName: string;
  constitution: string;
  pan: string;
  clientType: string;
  grade: string;
  gstType: string;
  filingFrequency: string;
  tags: string;
  assignedTo: string;
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
  errors: string[];
  isValid: boolean;
}

export default function ClientBulkImport({ onBack, onImportSuccess, showFeedback }: ClientBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Post-import summary modal/dialog
  const [openSummary, setOpenSummary] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: { row: number; name: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download high-fidelity Excel starting template dynamically
  const handleDownloadTemplate = () => {
    const sampleHeaders = [
      {
        'Legal Business Name (Required)': 'Meta Platforms Private Limited',
        'Trade Name': 'Facebook India',
        'Legal Constitution (Required)': 'Private Limited',
        'Tax PAN ID (Required)': 'ABCDE1234F',
        'Client Category (Corporate/Retail/HNW/SME/Others)': 'Corporate',
        'Tier Rating (A/B/C/D)': 'A',
        'GST Tax Scheme (Regular/Composition/Unregistered/None)': 'Regular',
        'Filing Frequency (Monthly/Quarterly/None)': 'Monthly',
        'Context Tags (Comma Separated)': 'tax-ready, cloud-client',
        'Owner Assigned To (Name/Email/ID)': 'onkarthakre219@gmail.com',
        'Contact Representative Full Name': 'Onkar Thakre',
        'Contact Designation': 'Finance Manager',
        'Contact Email': 'onkar@meta.com',
        'Contact Telephone Reference': '9876543210'
      },
      {
        'Legal Business Name (Required)': 'Acme Web Services Proprietorship',
        'Trade Name': 'Acme AWS Solutions',
        'Legal Constitution (Required)': 'Proprietorship',
        'Tax PAN ID (Required)': 'XYZPQ9876L',
        'Client Category (Corporate/Retail/HNW/SME/Others)': 'SME',
        'Tier Rating (A/B/C/D)': 'B',
        'GST Tax Scheme (Regular/Composition/Unregistered/None)': 'None',
        'Filing Frequency (Monthly/Quarterly/None)': 'None',
        'Context Tags (Comma Separated)': 'development, micro-entity',
        'Owner Assigned To (Name/Email/ID)': '',
        'Contact Representative Full Name': 'John Doe',
        'Contact Designation': 'Proprietor Manager',
        'Contact Email': 'representative@acme.com',
        'Contact Telephone Reference': '8888999977'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleHeaders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients Portfolio Import');
    XLSX.writeFile(workbook, 'Compliance_Clients_Ledger_Template.xlsx');
    showFeedback('success', 'Excel validation template downloaded successfully.');
  };

  // Maps elastic spreadsheets columns intelligently matching common wording
  const elasticHeaderMapping = (row: any): ParsedRecord => {
    const keys = Object.keys(row);
    const getVal = (aliases: string[]): string => {
      const match = keys.find(k => aliases.some(alias => k.toLowerCase().includes(alias.toLowerCase())));
      return match ? String(row[match]).trim() : '';
    };

    const record = {
      rowNumber: 0,
      name: getVal(['legal business', 'client name', 'legal name', 'name']),
      tradeName: getVal(['trade name', 'brand name', 'commercial', 'trade brand']),
      constitution: getVal(['constitution', 'structure', 'incorporation']),
      pan: getVal(['pan', 'tax id', 'identifier']),
      clientType: getVal(['category', 'client type', 'type']),
      grade: getVal(['tier', 'grade', 'rating']),
      gstType: getVal(['gst', 'tax scheme']),
      filingFrequency: getVal(['frequency', 'filing']),
      tags: getVal(['tags', 'comma separated']),
      assignedTo: getVal(['owner', 'assigned', 'account lead', 'teammate']),
      contactName: getVal(['representative', 'contact representative', 'contact full name', 'contact name']),
      contactDesignation: getVal(['designation', 'role']),
      contactEmail: getVal(['contact email', 'email id', 'email']),
      contactPhone: getVal(['telephone', 'phone reference', 'phone', 'mobile']),
      errors: [] as string[],
      isValid: true
    };

    return record;
  };

  // In-UI row level compliance validator
  const validateExcelRow = (record: ParsedRecord, index: number): ParsedRecord => {
    const errors: string[] = [];
    const rowNum = index + 1;

    if (!record.name) {
      errors.push('Blank Legal Business Name detected.');
    }
    if (!record.constitution) {
      errors.push('Legal Constitution configuration is blank.');
    } else {
      const validConstitutions = ['Pvt Ltd', 'Public Ltd', 'LLP', 'OPC', 'Partnership', 'Proprietorship', 'Private Limited', 'Public Limited', 'Trust', 'Individual'];
      const matched = validConstitutions.some(v => v.toLowerCase() === record.constitution.toLowerCase());
      if (!matched) {
        errors.push(`Invalid Legal Constitution ("${record.constitution}"). Expected: ${validConstitutions.join('/')}`);
      }
    }

    if (!record.pan) {
      errors.push('PAN code is blank.');
    } else {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const uppercasePan = record.pan.toUpperCase();
      if (!panRegex.test(uppercasePan)) {
        errors.push(`Invalid PAN structure ("${uppercasePan}"). Mandates 10-char alphanumeric sequence (e.g. ABCDE1234F).`);
      }
    }

    return {
      ...record,
      rowNumber: rowNum,
      errors,
      isValid: errors.length === 0
    };
  };

  // Perform parsing using sheetjs/xlsx package
  const handleProcessExcel = (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bin = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(bin, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array safely
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rawJson.length === 0) {
          showFeedback('error', 'Empty sheet spreadsheet uploaded. Check content and re-submit.');
          setIsParsing(false);
          return;
        }

        const formatted = rawJson.map((row, idx) => {
          const mapped = elasticHeaderMapping(row);
          return validateExcelRow(mapped, idx);
        });

        setParsedData(formatted);
        showFeedback('success', `Excel parsed successfully: ${formatted.length} business rows mapped.`);
      } catch (err: any) {
        showFeedback('error', `Parsing failed: ${err.message || 'Check Excel format schemas'}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Drag Drop handlers
  const handleDragOn = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragOff = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        handleProcessExcel(droppedFile);
      } else {
        showFeedback('error', 'Unsupported file extension. Please provide an .xlsx Excel spreadsheet format.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFile = e.target.files?.[0];
    if (targetFile) {
      handleProcessExcel(targetFile);
    }
  };

  const handleTriggerInputFile = () => {
    fileInputRef.current?.click();
  };

  const handleResetWorkspace = () => {
    setFile(null);
    setParsedData([]);
  };

  // Persists valid entities back to API database
  const handleBulkImportSave = async () => {
    const clientsToSubmit = parsedData.filter(item => item.isValid);
    if (clientsToSubmit.length === 0) {
      showFeedback('error', 'No valid directory rows detected to import. Repair errors inside Excel and retry.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post('/clients/bulk-import', { clients: clientsToSubmit });
      if (response.data?.status === 'success') {
        const payload = response.data.data;
        setImportSummary(payload);
        setOpenSummary(true);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Import transaction aborted with errors.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSummary = () => {
    setOpenSummary(false);
    onImportSuccess();
  };

  // Math metrics representation
  const countTotalRows = parsedData.length;
  const countValidRows = parsedData.filter(r => r.isValid).length;
  const countErrorRows = parsedData.filter(r => !r.isValid).length;

  return (
    <Box>
      {/* Dynamic Header Block */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1.5 }}>
        <IconButton onClick={onBack} sx={{ color: 'white', bgcolor: '#0f172a', border: '1px solid #1e293b' }} size="small" id="btn-import-back-ledger">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>
            Portfolio Bulk Import Wizard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Seamlessly initialize or synchronize compliance accounts using standard Excel spreadsheet files.
          </Typography>
        </Box>
      </Box>

      {/* Upload Drag zone card or active preview table */}
      {!file ? (
        <Paper 
          onDragOver={handleDragOn}
          onDragLeave={handleDragOff}
          onDrop={handleDrop}
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            border: dragOver ? '2px dashed #3b82f6' : '1px dashed #1e293b', 
            bgcolor: dragOver ? '#0f172a' : '#090d16',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: 3
          }}
          onClick={handleTriggerInputFile}
          id="drop-zone-excel"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".xlsx,.xls,.csv" 
            id="hidden-file-input"
          />
          <CloudUploadIcon sx={{ fontSize: 64, color: dragOver ? 'primary.main' : 'text.secondary', mb: 3 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
            Drag and Drop Excel File Click to Upload
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxW: '600px', mx: 'auto', mb: 4 }}>
            Provides full parsing compatibility with standard MS Excel spreadsheets (.xlsx, .xls) and CSV sheets. Ensure that the sheet names and header columns map correctly.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              id="btn-trigger-upload"
              startIcon={<PublishIcon />}
              sx={{ fontWeight: 'bold', textTransform: 'none', px: 3 }}
            >
              Select Document
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              id="btn-download-sample"
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering file upload click
                handleDownloadTemplate();
              }}
              startIcon={<DownloadIcon />}
              sx={{ fontWeight: 'bold', textTransform: 'none', px: 3 }}
            >
              Download Excel Template
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box>
          {/* Work metrics banner */}
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#090d16', border: '1px solid #1e293b' }} id="panel-metrics-banner">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 800, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ color: '#818cf8', fontSize: 20 }} /> File: {file.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Intelligent parsing completed. Preview and validate rows before committing records databases.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  id="btn-reset-import"
                  onClick={handleResetWorkspace}
                  startIcon={<RotateLeftIcon />}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Change Spreadsheet
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  id="btn-commit-import-db"
                  onClick={handleBulkImportSave}
                  disabled={isSaving || countValidRows === 0}
                  startIcon={isSaving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  {isSaving ? 'Registering Portfolios...' : `Import ${countValidRows} Valid Clients`}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: '#1e293b' }} />

            {/* Micro scorecard layout */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }} id="import-score-boxes">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BackupTableIcon sx={{ color: '#94a3b8' }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                  Total Rows: <strong>{countTotalRows}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#10b981' }} />
                <Typography variant="body2" sx={{ color: '#10b981' }}>
                  Valid & Saveable: <strong>{countValidRows}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ color: '#ef4444' }} />
                <Typography variant="body2" sx={{ color: '#ef4444' }}>
                  Validation Errors (Will Be Skipped): <strong>{countErrorRows}</strong>
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Active Data Preview Grid table mapping */}
          {isParsing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Paper sx={{ border: '1px solid #1e293b', bgcolor: '#090d16', overflow: 'hidden' }} id="import-preview-container">
              <TableContainer sx={{ maxM: '70vh' }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: '#0f172a' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>Row</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>Legal Partner Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>Constitution</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>PAN ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>Assigned Lead</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }}>Representative</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }} align="center">Filing Schedule</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, bgcolor: '#0a0f1d' }} align="center">Validation Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} hover sx={{ bgcolor: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.05)' }}>
                        {/* Num */}
                        <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                          {row.rowNumber}
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>
                            {row.name ? row.name : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>[Missing Business Name]</span>}
                          </Typography>
                          {row.tradeName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Co: {row.tradeName}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Constitution */}
                        <TableCell sx={{ color: '#cfd8dc' }}>
                          {row.constitution || <span style={{ color: '#ef4444' }}>[Missing]</span>}
                        </TableCell>

                        {/* PAN */}
                        <TableCell>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: row.pan ? '#fda4af' : '#ef4444' }}>
                            {row.pan ? row.pan.toUpperCase() : '[BLANK]'}
                          </span>
                        </TableCell>

                        {/* Lead */}
                        <TableCell sx={{ color: '#cfd8dc' }}>
                          {row.assignedTo || <span style={{ fontStyle: 'italic', color: '#64748b' }}>Unassigned</span>}
                        </TableCell>

                        {/* Rep Details */}
                        <TableCell>
                          {row.contactName ? (
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                              {row.contactName}
                              {row.contactEmail && (
                                <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {row.contactEmail}
                                </span>
                              )}
                            </Typography>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: '#546e7a' }}>No Contact Info Passed</span>
                          )}
                        </TableCell>

                        {/* Filing cycles info */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                              GST: {row.gstType || 'None'}
                            </Typography>
                            <Chip 
                              label={row.filingFrequency || 'None'} 
                              size="small" 
                              sx={{ mt: 0.5, height: 16, fontSize: '9px', bgcolor: '#0f172a', color: '#fda4af', border: '1px solid #1e293b' }} 
                            />
                          </Box>
                        </TableCell>

                        {/* Errors report column */}
                        <TableCell align="center">
                          {row.isValid ? (
                            <Tooltip title="Row validated and conforming to Indian tax compliance schema rules.">
                              <Chip 
                                label="Clear" 
                                size="small" 
                                color="success" 
                                variant="outlined" 
                                icon={<CheckCircleIcon />}
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip 
                              placement="left"
                              title={
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#f87171' }}>
                                    Compliance Warnings:
                                  </Typography>
                                  {row.errors.map((err, i) => (
                                    <Typography key={i} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                      • {err}
                                    </Typography>
                                  ))}
                                </Box>
                              }
                            >
                              <Chip 
                                label={`${row.errors.length} Errors`} 
                                size="small" 
                                color="error" 
                                variant="outlined" 
                                icon={<ErrorIcon />}
                                sx={{ fontWeight: 'bold', cursor: 'help' }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* Dynamic Summary dialog populating import results */}
      <Dialog 
        open={openSummary} 
        onClose={handleCloseSummary}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#090d16',
            color: 'white',
            border: '1px solid #1e293b',
            borderRadius: 2
          }
        }}
        id="dialog-import-summary"
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'white', borderBottom: '1px solid #1e293b' }}>
          Portfolio Database Import Transaction Success
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {importSummary && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: '#cbd5e1' }}>
                Your spreadsheet records batch import transaction completed:
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #1e293b', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>TOTAL CLIENTS</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{importSummary.total}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid #10b981', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#10b981' }}>SUCCESSFULLY INTEGRATED</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981', mt: 0.5 }}>{importSummary.imported}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#ef4444' }}>SKIPPED / INVALID</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ef4444', mt: 0.5 }}>{importSummary.skipped}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {importSummary.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#fca5a5', fontWeight: 'bold', mb: 1.5 }}>
                    Skipped Rows Analysis ({importSummary.errors.length})
                  </Typography>
                  <Paper sx={{ p: 2.5, bgcolor: '#070a11', maxH: '200px', overflowY: 'auto', border: '1px solid #ef4444' }}>
                    {importSummary.errors.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5, borderBottom: '1px solid rgba(239, 68, 68, 0.1)', pb: 1 }}>
                        <Chip label={`Row ${item.row}`} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 'bold', fontSize: 10, height: 18 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', display: 'block' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {item.error}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #1e293b' }}>
          <Button onClick={handleCloseSummary} variant="contained" color="primary" sx={{ fontWeight: 'bold' }}>
            Acknowledge & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
