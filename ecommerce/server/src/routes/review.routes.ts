// src/routes/review.routes.ts
import express from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { reviewValidators } from '../validators/review.validator.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
router.use(authenticate);
router.post('/', validate(reviewValidators.createReview), reviewController.createReview);
router.get('/user', reviewController.getUserReviews);
router.get('/user/:userId', reviewController.getUserReviews);
router.put('/:reviewId', validate(reviewValidators.updateReview), reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);

export default router;