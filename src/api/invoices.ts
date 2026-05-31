import { apiClient } from './apiClient';

export const invoicesApi = {
  list: (params?: { status?: string; clientId?: string }) =>
    apiClient.get('/invoices', { params }),
};
