import { apiClient } from './apiClient';

export const calendarApi = {
  list: (params?: any) => apiClient.get('/calendar', { params }),
  create: (payload: any) => apiClient.post('/calendar', payload),
  update: (id: string, payload: any) => apiClient.patch(`/calendar/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/calendar/${id}`)
};
