import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  TablePagination,
  Tooltip
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import PublishIcon from '@mui/icons-material/Publish';

import { apiClient } from '../../api/apiClient';
import { Client, Teammate } from '../../types';

interface ClientListProps {
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  teammates: Teammate[];
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onBulkImport?: () => void;
}

export default function ClientList({ onAdd, onEdit, onView, teammates, showFeedback, onBulkImport }: ClientListProps) {
  // Client results and state
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0); // Material UI is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterConstitution, setFilterConstitution] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterType, setFilterType] = useState('');

  // Fetch clients from backend with full server pagination, searching, and filtering
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      // API page query parameter is 1-indexed (page + 1)
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterStatus) params.status = filterStatus;
      if (filterConstitution) params.constitution = filterConstitution;
      if (filterGrade) params.grade = filterGrade;
      if (filterType) params.clientType = filterType;

      const response = await apiClient.get('/clients', { params });
      if (response.data?.status === 'success') {
        setClients(response.data.data.clients || []);
        
        // Handle paginated responses
        if (response.data.pagination) {
          setTotalRecords(response.data.pagination.total);
        } else {
          setTotalRecords(response.data.results || response.data.data.clients?.length || 0);
        }
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to list clients.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, filterStatus, filterConstitution, filterGrade, filterType, showFeedback]);

  // Trigger reloading on query dependencies
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Simple debounce helper for searches
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset page on fresh search
  };

  // Reset pagination on filter mutations
  const handleFilterChange = (filterSetter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    filterSetter(e.target.value);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterConstitution('');
    setFilterGrade('');
    setFilterType('');
    setPage(0);
  };

  // Status toggle handler directly from the table row
  const handleToggleStatus = async (client: Client) => {
    const targetStatus = client.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await apiClient.patch(`/clients/${client._id}`, { status: targetStatus });
      if (res.data?.status === 'success') {
        showFeedback('success', `Status of client "${client.name}" successfully updated to ${targetStatus}.`);
        loadClients();
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to change client status.');
    }
  };

  // Cascade client deletion
  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete client "${name}" and all associated contact records?`)) {
      try {
        const res = await apiClient.delete(`/clients/${id}`);
        if (res.status === 200) {
          showFeedback('success', `Client "${name}" has been permanently deleted.`);
          // If deleted last element on the page, roll back one page
          if (clients.length === 1 && page > 0) {
            setPage(prev => prev - 1);
          } else {
            loadClients();
          }
        }
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || err.message || 'Failed to delete client directory record.');
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculations for stats block
  const totalActive = clients.filter(c => c.status === 'active').length;
  const gradeACount = clients.filter(c => c.grade === 'A').length;

  return (
    <Box>
      {/* Title Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', mb: 3.5, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, letterSpacing: '-0.035em' }}>
            Clients Ledger
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Interactive Directory matching business compliance records, client hierarchies, tax information, and designated partner allocations.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {onBulkImport && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={onBulkImport}
              id="btn-bulk-import-nav"
              startIcon={<PublishIcon />}
              sx={{ py: 1.2, px: 2.5, fontWeight: 700, textTransform: 'none', borderRadius: 2, border: '1px solid #1e293b' }}
            >
              Bulk Import
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={onAdd}
            id="btn-add-client-nav"
            startIcon={<AddIcon />}
            sx={{ py: 1.2, px: 2.5, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
          >
            Add New Client
          </Button>
        </Box>
      </Box>

      {/* KPI Stats Panel Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)', border: '1px solid #1e293b' }} id="card-active-kpi">
            <CardContent sx={{ py: 3 }}>
              <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                ACTIVE PORTFOLIOS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                {totalActive === 0 && !loading ? clients.length : Math.max(totalActive, clients.length)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }} id="card-total-kpi">
            <CardContent sx={{ py: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                TOTAL DIRECTORIES
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                {totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }} id="card-premium-kpi">
            <CardContent sx={{ py: 3 }}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                PREMIUM PARTNERS (A)
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981' }}>
                {gradeACount || (clients.length > 0 ? clients.filter(c => c.grade === 'A').length : 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }} id="card-corporate-kpi">
            <CardContent sx={{ py: 3 }}>
              <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                CORPORATE SUBTYPES
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                {clients.filter(c => c.clientType === 'Corporate' || c.clientType === 'SME').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Filtering Toolbar Paper */}
      <Paper sx={{ p: 2.5, mb: 4, border: '1px solid #1e293b', bgcolor: '#090d16' }} id="table-filter-toolbar">
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 3.5 }}>
            <TextField
              fullWidth
              size="small"
              id="input-client-search"
              placeholder="Search by client, trade name, PAN, tags..."
              value={searchQuery}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 1.7 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              id="select-filter-status"
              value={filterStatus}
              onChange={handleFilterChange(setFilterStatus)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.3 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Legal Constitution"
              id="select-filter-constitution"
              value={filterConstitution}
              onChange={handleFilterChange(setFilterConstitution)}
            >
              <MenuItem value="">All Constitutions</MenuItem>
              <MenuItem value="Individual">Individual</MenuItem>
              <MenuItem value="Proprietorship">Proprietorship</MenuItem>
              <MenuItem value="Partnership">Partnership</MenuItem>
              <MenuItem value="LLP">LLP</MenuItem>
              <MenuItem value="Private Limited">Private Limited</MenuItem>
              <MenuItem value="Public Limited">Public Limited</MenuItem>
              <MenuItem value="Trust">Trust</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Grade"
              id="select-filter-grade"
              value={filterGrade}
              onChange={handleFilterChange(setFilterGrade)}
            >
              <MenuItem value="">All Grades</MenuItem>
              <MenuItem value="A">Grade A</MenuItem>
              <MenuItem value="B">Grade B</MenuItem>
              <MenuItem value="C">Grade C</MenuItem>
              <MenuItem value="D">Grade D</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 1.7 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Client Type"
              id="select-filter-type"
              value={filterType}
              onChange={handleFilterChange(setFilterType)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Corporate">Corporate</MenuItem>
              <MenuItem value="Retail">Retail</MenuItem>
              <MenuItem value="HNW">HNW</MenuItem>
              <MenuItem value="SME">SME</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 1.3 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              id="btn-clear-filters"
              onClick={handleResetFilters}
              startIcon={<RotateLeftIcon fontSize="small" />}
              sx={{ textTransform: 'none', height: 40, fontWeight: 600 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main clients records listing panel */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }} id="clients-table-loading">
          <CircularProgress color="primary" />
        </Box>
      ) : clients.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', border: '1px solid #1e293b', bgcolor: '#090d16' }} id="clients-empty-display">
          <PeopleIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
            No registered clients match selections
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Alter the filtering parameters above or register a new standard business corporate sheet.
          </Typography>
          <Button variant="contained" color="primary" onClick={onAdd} id="btn-empty-register">
            Register Initial Client
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ border: '1px solid #1e293b', bgcolor: '#090d16', overflow: 'hidden' }} id="clients-records-container">
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#0f172a' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Client Name & Details</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tax PAN Identifier</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Legal Structure</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rating Tier</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Team Owner</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Compliance Cycle</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Active Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => {
                  const assigned = teammates.find(t => t.id === client.assignedTo) || client.assignedToUser;
                  
                  return (
                    <TableRow key={client._id} hover sx={{ '&:hover': { bgcolor: '#141c2f' } }} id={`row-client-${client._id}`}>
                      {/* Name Details */}
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#f8fafc' }}>
                              {client.name}
                            </Typography>
                            {client.grade === 'A' && (
                              <Tooltip title="Premium tier Key Client">
                                <StarIcon sx={{ color: '#eab308', fontSize: 16 }} />
                              </Tooltip>
                            )}
                          </Box>
                          {client.tradeName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Commercial Name: {client.tradeName}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.8, flexWrap: 'wrap' }}>
                            {client.tags && client.tags.map(t => (
                              <Chip key={t} label={t} size="small" variant="outlined" sx={{ py: 0.1, px: 0, textTransform: 'capitalize', fontSize: 10, borderColor: '#1e293b', color: '#94a3b8' }} />
                            ))}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {/* PAN */}
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', color: '#fda4af' }}>
                          {client.pan}
                        </span>
                      </TableCell>
                      
                      {/* Constitution */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#cfd8dc' }}>
                          {client.constitution}
                        </Typography>
                      </TableCell>

                      {/* Grade & Type */}
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={`Grade ${client.grade || 'B'}`} 
                            size="small" 
                            sx={{ 
                              bgcolor: client.grade === 'A' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              color: client.grade === 'A' ? '#10b981' : '#f87171',
                              borderColor: client.grade === 'A' ? '#10b981' : '#f87171',
                              fontWeight: 700 
                            }} 
                            variant="outlined" 
                          />
                          <Chip 
                            label={client.clientType || 'SME'} 
                            size="small"
                            sx={{ bgcolor: '#1e1b4b', color: '#a5b4fc', borderColor: '#312e81', fontWeight: 600 }}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>

                      {/* Assigned associate */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {assigned ? (typeof assigned === 'string' ? assigned : (assigned as any).fullName) : 'Unassigned'}
                        </Typography>
                      </TableCell>

                      {/* GST cycles info */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                            {client.gstType === 'None' ? 'Unregistered' : client.gstType}
                          </Typography>
                          <Chip 
                            label={client.filingFrequency || 'None'} 
                            size="small" 
                            sx={{ mt: 0.5, height: 18, fontSize: '9px', bgcolor: '#0f172a', color: '#fda4af', border: '1px solid #e11d48' }} 
                          />
                        </Box>
                      </TableCell>

                      {/* Active check toggle */}
                      <TableCell align="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={client.status === 'active'}
                              onChange={() => handleToggleStatus(client)}
                              color="primary"
                              size="small"
                              id={`switch-status-${client._id}`}
                            />
                          }
                          label={
                            <Chip 
                              label={client.status === 'active' ? 'Active' : 'Inactive'} 
                              size="small" 
                              color={client.status === 'active' ? 'primary' : 'default'} 
                              variant="outlined"
                              sx={{ border: 'none', height: 20, fontSize: '11px', fontWeight: 700 }}
                            />
                          }
                          sx={{ m: 0 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton 
                            color="success" 
                            size="small" 
                            onClick={() => onView(client)}
                            id={`btn-view-${client._id}`}
                            title="View Extended Profile"
                          >
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton 
                            color="primary" 
                            size="small" 
                            onClick={() => onEdit(client)}
                            id={`btn-edit-${client._id}`}
                            title="Edit Client Sheet"
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => handleDeleteClient(client._id, client.name)}
                            id={`btn-delete-${client._id}`}
                            title="Delete Client Record"
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalRecords}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #1e293b', color: '#94a3b8' }}
            id="table-pagination-records"
          />
        </Paper>
      )}
    </Box>
  );
}
