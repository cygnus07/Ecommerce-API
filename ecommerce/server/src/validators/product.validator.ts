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
  .merge(z.object({
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
  }))




  export const productQuerySchema = z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    search: z.string().optional(),
    tags: z.string().optional(),
    inStock: z.enum(['true', 'false']).optional(),
  });
  

// Type exports for TypeScript usage
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;