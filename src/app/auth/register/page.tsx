'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AuthContainer from '@/components/auth/AuthContainer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormError from '@/components/auth/FormError';
import { registerSchema } from '@/lib/utils/validation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

// Removing confirmPassword from the data sent to API
type RegisterFormData = z.infer<typeof registerSchema>;
type RegisterApiData = Omit<RegisterFormData, 'confirmPassword'>;

export default function RegisterPage() {
  const { register: registerUser, loginWithGoogle, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Handle Google OAuth callback
  useEffect(() => {
    // Check if we have tokens in the URL (from Google OAuth callback)
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    
    if (token && refreshToken) {
      // Process the tokens and authenticate the user
      loginWithGoogle({ token, refreshToken });
    }
  }, [searchParams, loginWithGoogle]);

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      console.log('Form submitted with data:', data);
      const { confirmPassword, ...apiData } = data;
      console.log('Attempting to register with:', apiData);
      await registerUser(apiData);
    } catch (error) {
      console.error('Registration failed:', {
        error,
        fullError: JSON.stringify(error, null, 2),
        axiosIsError: axios.isAxiosError(error),
        responseData: axios.isAxiosError(error) ? error.response?.data : null
      });
    }
  };

  const handleGoogleSignIn = () => {
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/auth/google`;
    console.log('Redirecting to Google OAuth:', googleAuthUrl);
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthContainer 
      title="Create your account" 
      subtitle="Let's get started with your journey"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormError error={error} />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label="First name"
            error={errors.firstName?.message}
            {...register('firstName')}
            autoComplete="given-name"
          />
          
          <Input
            id="lastName"
            label="Last name"
            error={errors.lastName?.message}
            {...register('lastName')}
            autoComplete="family-name"
          />
        </div>
        
        <Input
          id="email"
          type="email"
          label="Email address"
          error={errors.email?.message}
          {...register('email')}
          autoComplete="email"
        />
        
        <Input
          id="password"
          type="password"
          label="Password"
          error={errors.password?.message}
          {...register('password')}
          autoComplete="new-password"
        />
        
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          autoComplete="new-password"
        />

        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting || isLoading}
          >
            Create account
          </Button>
        </div>

        <div className="text-center">
          <Link 
            href="/auth/login" 
            className="text-sm text-emerald-600 hover:text-emerald-500"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleGoogleSignIn}
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              Sign up with Google
            </div>
          </Button>
        </div>
      </div>
    </AuthContainer>
  );
}