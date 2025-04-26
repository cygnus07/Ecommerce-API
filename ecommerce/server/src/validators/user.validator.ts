import { z } from 'zod';
import { UserRole, AccountStatus } from '../types/user.types.js';

// Common patterns
const emailSchema = z.string().trim().email('Invalid email address');
const phoneSchema = z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15);
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

// Address schema
const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  addressLine1: z.string().trim().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(5),
  country: z.string().trim().min(2),
  phone: phoneSchema,
  isDefault: z.boolean().optional()
});

// Base user schema
const baseUserSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  avatar: z.string().trim().url('Invalid avatar URL').optional(),
});

// Schemas
export const registerSchema = baseUserSchema.extend({
  password: passwordSchema,
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
  addresses: z.array(addressSchema).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Create updateProfileSchema as a separate object before partial()
const updateProfileBaseSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().trim().url('Invalid avatar URL').optional(),
});

export const updateProfileSchema = updateProfileBaseSchema.refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema.refine((val) => val.length >= 8, {
    message: 'New password must be at least 8 characters'
  })
});

export const adminUpdateUserSchema = updateProfileBaseSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  emailVerified: z.boolean().optional(),
  addresses: z.array(addressSchema).optional()
});

// Email verification schema 
export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers')
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
    email: z.string().email('Invalid email format'),
});


export const ForgotPasswordInput = z.object({
  email: z.string().email('Please provide a valid email address')
});

export const ResetPasswordInput = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});


// Type export
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// TypeScript types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
