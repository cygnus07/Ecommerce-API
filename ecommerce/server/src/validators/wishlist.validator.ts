// src/validators/wishlist.validator.ts
import { body, param } from 'express-validator';

export const wishlistValidators = {
  addToWishlist: [
    body('productId').isMongoId().withMessage('Valid product ID is required')
  ],
  
  removeFromWishlist: [
    param('productId').isMongoId().withMessage('Valid product ID is required')
  ]
};