import { z } from 'zod';

// Validation for adding item to cart
export const addToCartSchema = z.object({
  productId: z.string()
    .length(24, { message: 'Product ID must be 24 characters long' })
    .regex(/^[0-9a-fA-F]+$/, { message: 'Product ID must be a valid hexadecimal' })
    .nonempty({ message: 'Product ID is required' }),
  quantity: z.number()
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' })
    .default(1)
});

// Validation for updating cart item quantity
export const updateCartItemSchema = z.object({
  productId: z.string()
    .length(24, { message: 'Product ID must be 24 characters long' })
    .regex(/^[0-9a-fA-F]+$/, { message: 'Product ID must be a valid hexadecimal' })
    .nonempty({ message: 'Product ID is required' }),
  quantity: z.number()
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' })
    .nonnegative({ message: 'Quantity must be a positive number' })
});

// Optional: Schema for cart item ID param validation
export const cartItemParamsSchema = z.object({
  productId: z.string()
    .length(24, { message: 'Product ID must be 24 characters long' })
    .regex(/^[0-9a-fA-F]+$/, { message: 'Product ID must be a valid hexadecimal' })
    .nonempty({ message: 'Product ID is required' })
});

// If you need to infer TypeScript types from the schemas:
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;