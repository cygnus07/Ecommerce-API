'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import AuthContainer from '@/components/auth/AuthContainer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormError from '@/components/auth/FormError';
import { verifyEmailSchema } from '@/lib/utils/validation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification, isLoading, error } = useAuth();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email,
    },
  });

  // Set email from URL parameter
  useEffect(() => {
    if (email) {
      setValue('email', email);
    }
  }, [email, setValue]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    await verifyEmail(data);
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    
    try {
      await resendVerification(email);
      setResendSuccess(true);
      setResendCountdown(60);
      
      // Countdown timer
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return a-1;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to resend verification code:', error);
    }
  };

  return (
    <AuthContainer 
      title="Verify your email" 
      subtitle="Please enter the verification code sent to your email"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormError error={error} />
        
        {resendSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">
              Verification code has been resent to your email.
            </span>
          </div>
        )}
        
        <Input
          id="email"
          type="email"
          label="Email address"
          error={errors.email?.message}
          {...register('email')}
          disabled
        />
        
        <Input
          id="otp"
          label="Verification code"
          error={errors.otp?.message}
          {...register('otp')}
          placeholder="Enter the 6-digit code"
        />

        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting || isLoading}
          >
            Verify Email
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCountdown > 0}
            className="text-sm text-emerald-600 hover:text-emerald-500"
          >
            {resendCountdown > 0 
              ? `Resend code in ${resendCountdown}s` 
              : "Didn't receive a code? Resend"}
          </button>
        </div>
      </form>
    </AuthContainer>
  );
}