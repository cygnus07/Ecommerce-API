'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, RegisterData, AuthState, VerifyEmailData } from '@/types/user';
import { authApi } from '@/lib/api/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        
        const user = await authApi.getProfile();
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Clear auth state on error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication failed',
        });
      }
    };
    
    checkAuth();
  }, []);

  // Login handler
  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user } = await authApi.login(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      router.push('/'); // Redirect to home page
    } catch (error) {
      if (error instanceof Error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    }
  };

  // Register handler
  const register = async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authApi.register(data);
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Redirect to verify email page
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      if (error instanceof Error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    }
  };

  // Email verification handler
  const verifyEmail = async (data: VerifyEmailData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user } = await authApi.verifyEmail(data);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      router.push('/'); // Redirect to home page
    } catch (error) {
      if (error instanceof Error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    }
  };

  // Resend verification email
  const resendVerification = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authApi.resendVerification(email);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      if (error instanceof Error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    }
  };

  // Logout handler
  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      router.push('/auth/login');
    }
  };

  const value = {
    ...state,
    login,
    register,
    verifyEmail,
    logout,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};