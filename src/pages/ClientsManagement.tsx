import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';

import { apiClient } from '../api/apiClient';
import { Client, Teammate } from '../types';

import ClientList from '../components/clients/ClientList';
import ClientForm from '../components/clients/ClientForm';
import ClientDetails from '../components/clients/ClientDetails';
import ClientBulkImport from '../components/clients/ClientBulkImport';

type ViewMode = 'list' | 'add' | 'edit' | 'view' | 'import';

export default function ClientsManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  
  // Feedback Notifications State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load common parameters like teammates
  useEffect(() => {
    const fetchTeammates = async () => {
      try {
        const response = await apiClient.get('/auth/teammates');
        if (response.data?.status === 'success') {
          setTeammates(response.data.data?.teammates ?? []);
        }
      } catch (err) {
        console.error('Quietly failed to load teammate options:', err);
      }
    };
    fetchTeammates();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const handleNavigateToList = () => {
    setSelectedClient(null);
    setViewMode('list');
  };

  const handleNavigateToAdd = () => {
    setSelectedClient(null);
    setViewMode('add');
  };

  const handleNavigateToEdit = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const handleNavigateToView = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
  };

  const handleSaveSuccess = () => {
    handleNavigateToList();
  };

  return (
    <Box sx={{ py: 1 }}>
      {/* Dynamic Screen router */}
      {viewMode === 'list' && (
        <ClientList
          onAdd={handleNavigateToAdd}
          onEdit={handleNavigateToEdit}
          onView={handleNavigateToView}
          onBulkImport={() => setViewMode('import')}
          teammates={teammates}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'add' && (
        <ClientForm
          client={null}
          teammates={teammates}
          onCancel={handleNavigateToList}
          onSaveSuccess={handleSaveSuccess}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'edit' && selectedClient && (
        <ClientForm
          client={selectedClient}
          teammates={teammates}
          onCancel={handleNavigateToList}
          onSaveSuccess={handleSaveSuccess}
          showFeedback={showFeedback}
        />
      )}

      {viewMode === 'view' && selectedClient && (
        <ClientDetails
          client={selectedClient}
          teammates={teammates}
          onBack={handleNavigateToList}
          onEdit={() => handleNavigateToEdit(selectedClient)}
        />
      )}

      {viewMode === 'import' && (
        <ClientBulkImport
          onBack={handleNavigateToList}
          onImportSuccess={() => {
            showFeedback('success', 'Excel records successfully imported with MongoDB synchronization.');
            handleNavigateToList();
          }}
          showFeedback={showFeedback}
        />
      )}

      {/* Global Toast feedback notifications system */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setFeedback(null)} 
          severity={feedback?.type || 'success'} 
          sx={{ 
            width: '100%', 
            bgcolor: feedback?.type === 'success' ? '#064e3b' : '#7f1d1d', 
            color: 'white', 
            border: feedback?.type === 'success' ? '1px solid #059669' : '1px solid #dc2626' 
          }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
