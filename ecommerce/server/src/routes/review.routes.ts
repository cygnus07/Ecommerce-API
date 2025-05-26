import express, { RequestHandler } from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams } from '../validators/review.validator.js';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reviewIdParamSchema,
  productIdParamSchema,
  userIdParamSchema,
  replySchema,
  moderateReviewSchema
} from '../types/review.types.js';

const router = express.Router();

// Type assertion helper for authenticated routes
const asHandler = (fn: any): RequestHandler => fn as RequestHandler;

// Public routes
router.get(
  '/product/:productId', 
  validateParams(productIdParamSchema), 
  reviewController.getProductReviews
);

// Protected routes
router.use(authenticate);

// Create review
router.post(
  '/',
  validateBody(createReviewSchema),
  asHandler(reviewController.createReview)
);

// Get user's reviews
router.get(
  '/user',
  asHandler(reviewController.getUserReviews)
);

// Get specific user's reviews (for admins)
router.get(
  '/user/:userId',
  validateParams(userIdParamSchema),
  asHandler(reviewController.getUserReviews)
);

// Update review
router.put(
  '/:reviewId',
  validateParams(reviewIdParamSchema),
  validateBody(updateReviewSchema),
  asHandler(reviewController.updateReview)
);

// Delete review
router.delete(
  '/:reviewId',
  validateParams(reviewIdParamSchema),
  asHandler(reviewController.deleteReview)
);

// Mark review as helpful
router.post(
  '/:reviewId/helpful',
  validateParams(reviewIdParamSchema),
  asHandler(reviewController.markReviewHelpful)
);

// Report a review
router.post(
  '/:reviewId/report',
  validateParams(reviewIdParamSchema),
  asHandler(reviewController.reportReview)
);

// Add reply to a review
router.post(
  '/:reviewId/reply',
  validateParams(reviewIdParamSchema),
  validateBody(replySchema),
  asHandler(reviewController.addReviewReply)
);

// Moderate a review (admin only)
router.patch(
  '/:reviewId/moderate',
  validateParams(reviewIdParamSchema),
  validateBody(moderateReviewSchema),
  asHandler(reviewController.moderateReview)
);

export default router;