import { z } from 'zod';

// Common validation patterns
const namePattern = /^[a-zA-Z0-9\s\-&]+$/;

// Helper functions for error messages
const requiredError = (field: string) => `${field} is required`;
const lengthError = (field: string, length: number) => 
  `${field} must be ${length} characters long`;
const minError = (field: string, min: number) => 
  `${field} must be at least ${min} characters`;
const maxError = (field: string, max: number) => 
  `${field} cannot exceed ${max} characters`;

export const createCategorySchema = z.object({
  name: z.string()
    .min(2, minError('Name', 2))
    .max(50, maxError('Name', 50))
    .regex(namePattern, 'Name can only contain letters, numbers, spaces, hyphens, and ampersands'),
  description: z.string()
    .max(500, maxError('Description', 500))
    .optional(),
  parentId: z.string()
    .length(24, lengthError('Parent ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Parent ID must be a valid hexadecimal')
    .optional()
    .nullable()
});

export const updateCategorySchema = z.object({
  name: z.string()
    .min(2, minError('Name', 2))
    .max(50, maxError('Name', 50))
    .regex(namePattern, 'Name can only contain letters, numbers, spaces, hyphens, and ampersands')
    .optional(),
  description: z.string()
    .max(500, maxError('Description', 500))
    .optional(),
  parentId: z.string()
    .length(24, lengthError('Parent ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Parent ID must be a valid hexadecimal')
    .optional()
    .nullable()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided to update'
});

export const categoryIdParamsSchema = z.object({
  id: z.string()
    .length(24, lengthError('Category ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Category ID must be a valid hexadecimal')
});

export const categoryProductsQuerySchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  tree: z.enum(['true', 'false'])
    .default('false')
});

// Type exports for TypeScript usage
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type CategoryProductsQuery = z.infer<typeof categoryProductsQuerySchema>;