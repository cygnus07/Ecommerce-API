import { z } from 'zod';

// Common patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

// Schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters')
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: emailSchema.optional()
}).partial().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

export const adminUpdateUserSchema = updateProfileSchema.extend({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional()
});

// Infer TypeScript types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
// ... other types as needed