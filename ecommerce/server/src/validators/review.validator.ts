// src/validators/review.validator.ts
import { body, param } from 'express-validator';

export const reviewValidators = {
  createReview: [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').isString().notEmpty().withMessage('Review comment is required')
  ],
  
  updateReview: [
    param('reviewId').isMongoId().withMessage('Valid review ID is required'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().notEmpty().withMessage('Review comment cannot be empty')
  ]
};