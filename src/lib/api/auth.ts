import { 
    AuthTokens, 
    LoginCredentials, 
    RegisterData, 
    User, 
    VerifyEmailData,
    ForgotPasswordData,
    ResetPasswordData
  } from '@/types/user';
  import apiClient, { handleApiError } from './client'
  
  interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
  }
  
  interface RegisterResponse {
    user: User;
    message: string;
  }
  
  export const authApi = {
    // Register a new user
    register: async (data: RegisterData): Promise<RegisterResponse> => {
        try {
          console.log('Sending registration data:', data);
          const response = await apiClient.post<RegisterResponse>('/api/v1/users/register', data);
          console.log('Registration response:', response);
          return response.data;
        } catch (error) {
          console.error('Registration error details:', error);
          throw new Error(handleApiError(error));
        }
      },
  
    // Verify email with OTP
    verifyEmail: async (data: VerifyEmailData): Promise<AuthResponse> => {
      try {
        const response = await apiClient.post<AuthResponse>('api/v1/users/verify-email', data);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  
    // Resend verification email
    resendVerification: async (email: string): Promise<{ message: string }> => {
      try {
        const response = await apiClient.post<{ message: string }>('/users/resend-verification', { email });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  
    // Login user
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      try {
        const response = await apiClient.post<AuthResponse>('/users/login', credentials);
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  
    // Logout user
    logout: async (): Promise<void> => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await apiClient.post('/users/logout', { refreshToken });
        }
        
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear tokens on error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
  
    // Get current user profile
    getProfile: async (): Promise<User> => {
      try {
        const response = await apiClient.get<User>('/users/profile');
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  
    // Request password reset
    forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
      try {
        const response = await apiClient.post<{ message: string }>('/users/forgot-password', data);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  
    // Reset password
    resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
      try {
        const response = await apiClient.post<{ message: string }>('/users/reset-password', data);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    }
  };