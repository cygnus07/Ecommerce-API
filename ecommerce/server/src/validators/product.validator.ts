import { z } from 'zod';

// Common validation patterns
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const skuPattern = /^[A-Z0-9-]+$/;
const slugPattern = /^[a-z0-9-]+$/;

// Helper for error messages
const requiredError = (field: string) => `${field} is required`;
const lengthError = (field: string, length: number) => 
  `${field} must be ${length} characters long`;
const minError = (field: string, min: number) => 
  `${field} must be at least ${min}`;
const maxError = (field: string, max: number) => 
  `${field} cannot exceed ${max}`;

// Variant Option Schema
const variantOptionSchema = z.object({
  name: z.string().min(1, requiredError('Option name')),
  value: z.string().min(1, requiredError('Option value'))
});

// Variant Schema
const variantSchema = z.object({
  sku: z.string()
    .min(1, requiredError('SKU'))
    .regex(skuPattern, 'SKU can only contain uppercase letters, numbers and hyphens'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .or(z.string().regex(decimalPattern).transform(Number)),
  compareAtPrice: z.number()
    .min(0, 'Compare price cannot be negative')
    .optional(),
  inventory: z.number()
    .int('Inventory must be an integer')
    .min(0, 'Inventory cannot be negative')
    .default(0),
  options: z.array(variantOptionSchema).optional(),
  images: z.array(z.string()).optional(),
  weight: z.number().optional(),
  barcode: z.string().optional()
});

// Product Schemas
export const productIdParamsSchema = z.object({
  id: z.string()
    .length(24, lengthError('Product ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Product ID must be a valid hexadecimal')
});

export const productCreateSchema = z.object({
  name: z.string()
    .min(2, minError('Product name', 2))
    .max(100, maxError('Product name', 100)),
  slug: z.string()
    .min(2, minError('Slug', 2))
    .max(100, maxError('Slug', 100))
    .regex(slugPattern, 'Slug can only contain lowercase letters, numbers and hyphens'),
  description: z.string()
    .min(10, minError('Description', 10))
    .max(2000, maxError('Description', 2000)),
  categoryId: z.string()
    .length(24, lengthError('Category ID', 24))
    .regex(/^[0-9a-fA-F]+$/, 'Category ID must be a valid hexadecimal'),
  variants: z.array(variantSchema)
    .min(1, 'At least one variant is required'),
  tags: z.array(z.string()) // Accept array
    .or(z.string().transform(str => 
      str.split(',').map(tag => tag.trim()) // Convert string to array
    )) 
    .optional()
    .default([]), // Default to empty array
  specifications: z.record(z.unknown()) // Allows any key-value object
    .or(z.string().transform(str => JSON.parse(str)))
    .optional(),
  discount: z.number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100')
    .default(0),
  status: z.enum(['draft', 'active', 'out_of_stock', 'archived', 'discontinued'])
    .default('draft')
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .extend({
    variants: z.array(variantSchema.partial()).optional()
  });

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'active', 'out_of_stock', 'archived', 'discontinued']).optional(),
  inStock: z.coerce.boolean().optional()
});

// Type exports
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;