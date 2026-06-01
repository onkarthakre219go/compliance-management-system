import { apiClient } from './apiClient';

export const invoicesApi = {
  list: (params?: { status?: string; clientId?: string }) =>
    apiClient.get('/invoices', { params }),
  create: (payload: any) => apiClient.post('/invoices', payload),
  send: (invoiceId: string, payload: any) =>
    apiClient.post(`/invoices/${invoiceId}/send`, payload),
};
