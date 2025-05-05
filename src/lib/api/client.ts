import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthTokens } from '@/types/user';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://shopai-rmia.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
//   withCredentials: true, // Important for cookies
});
// console.log(apiClient)

// Add this before your interceptors
apiClient.interceptors.request.use(request => {
    console.log('Starting Request', request);
    return request;
  });
  
  apiClient.interceptors.response.use(response => {
    console.log('Response:', response);
    return response;
  }, error => {
    console.log('Error:', error);
    return Promise.reject(error);
  });

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage in client-side only
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 and not already retrying
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }
        
        // Try to refresh the token
        const response = await apiClient.post<{ accessToken: string }>('/users/refresh-token', {
          refreshToken,
        });
        
        // Update the token in localStorage
        localStorage.setItem('accessToken', response.data.accessToken);
        
        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data?.message;
    return serverError || error.message || 'An unexpected error occurred';
  }

  return 'An unexpected error occurred';
};

export default apiClient;