import { apiClient } from './apiClient';

export const reportsApi = {
  clients: (params?: any) => apiClient.get('/reports/clients', { params }),
  fees: (type: 'government-pending' | 'professional-pending') => apiClient.get('/reports/fees', { params: { type } }),
  
  // Export endpoints
  exportClientsExcel: (params?: any) => 
    apiClient.get('/reports/export/clients/excel', { params, responseType: 'blob' }),
  
  exportClientsPDF: (params?: any) => 
    apiClient.get('/reports/export/clients/pdf', { params, responseType: 'blob' }),
  
  exportFeesExcel: (type: 'government-pending' | 'professional-pending') => 
    apiClient.get('/reports/export/fees/excel', { params: { type }, responseType: 'blob' }),
  
  exportFeesPDF: (type: 'government-pending' | 'professional-pending') => 
    apiClient.get('/reports/export/fees/pdf', { params: { type }, responseType: 'blob' }),
};
