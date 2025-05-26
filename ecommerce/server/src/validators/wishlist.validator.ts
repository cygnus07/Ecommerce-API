// src/validators/wishlist.validator.ts
import { z } from 'zod';

export const wishlistValidators = {
  addToWishlist: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required')
  }),
  
  removeFromWishlist: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required')
  })
};

// For use with express, you might want to export the schemas as:
export const addToWishlistSchema = wishlistValidators.addToWishlist;
export const removeFromWishlistSchema = wishlistValidators.removeFromWishlist;