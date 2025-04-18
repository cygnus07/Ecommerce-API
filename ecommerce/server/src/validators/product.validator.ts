import { z } from 'zod';

// Common validation patterns
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const skuPattern = /^[A-Z0-9-]+$/;

// Helper for error messages
const requiredError = (field: string) => `${field} is required`;
const lengthError = (field: string, length: number) => 
  `${field} must be ${length} characters long`;
const minError = (field: string, min: number) => 
  `${field} must be at least ${min}`;
const maxError = (field: string, max: number) => 
  `${field} cannot exceed ${max}`;

export const productIdParamsSchema = z.object({
  id: z.string().length(24, lengthError('Product ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Product ID must be a valid hexadecimal')
});

export const productCreateSchema = z.object({
  name: z.string()
    .min(2, minError('Product name', 2))
    .max(100, maxError('Product name', 100)),
  description: z.string()
    .min(10, minError('Description', 10))
    .max(2000, maxError('Description', 2000)),
  price: z.string()
    .regex(decimalPattern, 'Price must be a valid decimal number with up to 2 decimal places'),
  categoryId: z.string()
    .length(24, lengthError('Category ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Category ID must be a valid hexadecimal')
    .optional(),
  sku: z.string()
    .regex(skuPattern, 'SKU can only contain uppercase letters, numbers and hyphens'),
  stockQuantity: z.number()
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative')
    .default(0),
  isActive: z.boolean()
    .default(true),
  tags: z.string()
    .max(500, maxError('Tags', 500))
    .optional(),
  specifications: z.string()
    .optional()
    .transform(str => str ? JSON.parse(str) : {}),
  discount: z.number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100')
    .default(0),
  removeImages: z.string()
    .optional()
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update'
  })
  .extend({
    name: z.string()
      .min(2, minError('Product name', 2))
      .max(100, maxError('Product name', 100))
      .optional(),
    description: z.string()
      .min(10, minError('Description', 10))
      .max(2000, maxError('Description', 2000))
      .optional(),
    price: z.string()
      .regex(decimalPattern, 'Price must be a valid decimal number with up to 2 decimal places')
      .optional(),
    sku: z.string()
      .regex(skuPattern, 'SKU can only contain uppercase letters, numbers and hyphens')
      .optional()
  });

export const productQuerySchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sort: z.enum(['name', 'price', 'createdAt', 'updatedAt', 'stockQuantity'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc'])
    .default('desc'),
  category: z.string()
    .length(24, lengthError('Category ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Category ID must be a valid hexadecimal')
    .optional(),
  minPrice: z.number()
    .min(0, 'Minimum price cannot be negative')
    .optional(),
  maxPrice: z.number()
    .min(0, 'Maximum price cannot be negative')
    .optional(),
  search: z.string()
    .max(100, maxError('Search query', 100))
    .optional(),
  tags: z.string()
    .max(500, maxError('Tags filter', 500))
    .optional(),
  inStock: z.enum(['true', 'false'])
    .optional()
});

// Type exports for TypeScript usage
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;