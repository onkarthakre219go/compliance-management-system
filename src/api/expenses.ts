import { apiClient } from './apiClient';

export const expensesApi = {
  list: (params?: any) => apiClient.get('/expenses', { params }),
  create: (payload: any) => apiClient.post('/expenses', payload),
  update: (id: string, payload: any) => apiClient.patch(`/expenses/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/expenses/${id}`),
  summary: (params?: any) => apiClient.get('/expenses/summary', { params })
};
