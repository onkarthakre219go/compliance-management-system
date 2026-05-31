import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create a configured Axios instance
export const apiClient = axios.create({
  baseURL: '/api', // Relative path pointing to our Express dev proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request Interceptor: Inject JWT token from localStorage or cookie
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('cms_session_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Route-level error handling & token renewal
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Check for 401 Unauthorized & verify we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('cms_session_refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt silent JWT token rotation
          const refreshResponse = await axios.post('/api/auth/refresh-token', { refreshToken });
          
          if (refreshResponse.data?.status === 'success') {
            const newToken = refreshResponse.data.token;
            localStorage.setItem('cms_session_token', newToken);
            localStorage.setItem('cms_session_refresh_token', refreshResponse.data.refreshToken);
            
            // Overwrite original request headers and dispatch retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('cms_session_token');
          localStorage.removeItem('cms_session_refresh_token');
          localStorage.removeItem('cms_session_user');
          window.location.reload();
        }
      } else {
        localStorage.removeItem('cms_session_token');
        localStorage.removeItem('cms_session_refresh_token');
        localStorage.removeItem('cms_session_user');
      }
    }
    
    // Abstract central error formatting
    const errorMessage = (error.response?.data as any)?.message || error.message || 'An unexpected request error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Example standard API wrappers
export const authApi = {
  getProfile: () => apiClient.get('/auth/profile'),
  getTeammates: () => apiClient.get('/auth/teammates'),
  logout: () => apiClient.post('/auth/logout'),
};

export const healthApi = {
  checkStatus: () => apiClient.get('/health'),
};

// Expenses API wrapper
export const expensesApi = {
  list: (params?: any) => apiClient.get('/expenses', { params }),
  create: (data: any) => apiClient.post('/expenses', data),
  update: (id: string, data: any) => apiClient.put(`/expenses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/expenses/${id}`),
  summary: (params: any) => apiClient.get('/expenses/summary', { params }),
};
