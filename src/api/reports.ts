import { apiClient } from './apiClient';

export const reportsApi = {
  clients: (params?: any) => apiClient.get('/reports/clients', { params }),
  fees: (type: 'government-pending' | 'professional-pending') => apiClient.get('/reports/fees', { params: { type } }),
};
