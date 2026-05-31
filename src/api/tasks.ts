import { apiClient } from './apiClient';

export const tasksApi = {
  list: (params?: any) => apiClient.get('/tasks', { params }),
  get: (id: string) => apiClient.get(`/tasks/${id}`),
  create: (payload: any) => apiClient.post('/tasks', payload),
  update: (id: string, payload: any) => apiClient.patch(`/tasks/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/tasks/${id}`),
  addComment: (id: string, payload: { authorId: string; text: string }) => apiClient.post(`/tasks/${id}/comments`, payload),
  deleteComment: (id: string, commentId: string) => apiClient.delete(`/tasks/${id}/comments/${commentId}`),
  addAttachment: (id: string, payload: { filename: string; url?: string; mimeType?: string; uploadedBy?: string }) => apiClient.post(`/tasks/${id}/attachments`, payload),
  deleteAttachment: (id: string, attachmentId: string) => apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`)
};
