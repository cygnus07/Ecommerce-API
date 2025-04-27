import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Review from '../models/Review.model.js';
import Product from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { 
  ReviewDocument,
  CreateReviewInput,
  UpdateReviewInput,
  ReplyInput,
  ModerateReviewInput
} from '../types/review.types.js';

// Define request types to enhance type safety
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    _id: string;
    role?: string;
  }
}

export const reviewController = {
  /**
   * Create a new review
   */
  createReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { productId, rating, comment, title, images } = req.body as CreateReviewInput;
      const userId = req.user.id;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({ 
        user: userId, 
        product: productId,
        deleted: { $ne: true }
      });
      
      if (existingReview) {
        sendError(
          res, 
          'You have already reviewed this product', 
          ErrorCodes.CONFLICT
        );
      }

      const newReview = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment,
        title,
        images,
        status: 'pending',
        isVerifiedPurchase: false // This could be updated based on order history
      });

      // Update product average rating
      await updateProductRating(productId);

       sendSuccess(res, newReview, 'Review created successfully', 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error creating review: ${errorMessage}`);
      sendError(res, 'Failed to create review');
    }
  },
  
  /**
   * Get all reviews for a product
   */
  getProductReviews: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      // console.log(productId);
      const reviews = await Review.find({ 
        product: productId,
        status: 'approved' // Only return approved reviews
      })
      
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

        // console.log(reviews)

      sendSuccess(res, reviews, 'Reviews retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error getting product reviews: ${errorMessage}`);
      sendError(res, 'Failed to get product reviews');
    }
  },

  /**
   * Get all reviews by a user
   */
  getUserReviews: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId || req.user._id;
      
      const reviews = await Review.find({ user: userId })
        .populate('product', 'name price images')
        .sort({ createdAt: -1 });

      sendSuccess(res, reviews, 'User reviews retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error getting user reviews: ${errorMessage}`);
      sendError(res, 'Failed to get user reviews');
    }
  },

  /**
   * Update a review
   */
  updateReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const { rating, comment, title, images } = req.body as UpdateReviewInput;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      // Check if user is the owner of the review
      if (review.user.toString() !== userId) {
        return sendError(res, 'Unauthorized', ErrorCodes.FORBIDDEN);
      }

      // Update fields if provided
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      if (title !== undefined) review.title = title;
      if (images !== undefined) review.images = images;

      // Reset status to pending after update for re-moderation
      review.status = 'pending';
      
      await review.save();

      // Update product average rating
      await updateProductRating(review.product);

      return sendSuccess(res, review, 'Review updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error updating review: ${errorMessage}`);
      sendError(res, 'Failed to update review');
    }
  },

  /**
   * Delete a review (soft delete)
   */
  deleteReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      // Check if user is the owner of the review or an admin
      if (review.user.toString() !== userId && req.user.role !== 'admin') {
        sendError(res, 'Unauthorized', ErrorCodes.FORBIDDEN);
      }

      const productId = review.product;
      
      // Use soft delete instead of permanently removing
      review.deleted = true;
      review.deletedAt = new Date();
      await review.save();

      // Update product average rating
      await updateProductRating(productId);

      sendSuccess(res, null, 'Review deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error deleting review: ${errorMessage}`);
      sendError(res, 'Failed to delete review');
    }
  },

  /**
   * Mark a review as helpful
   */
  markReviewHelpful: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      // Check if user has already marked this review as helpful
      const alreadyMarked = review.helpful.users.some(id => id.toString() === userId);
      
      if (alreadyMarked) {
        // Remove user from helpful.users array
        review.helpful.users = review.helpful.users.filter(id => id.toString() !== userId);
        review.helpful.count = Math.max(0, review.helpful.count - 1);
      } else {
        // Add user to helpful.users array
        review.helpful.users.push(new Types.ObjectId(userId));
        review.helpful.count += 1;
      }
      
      await review.save();

      sendSuccess(
        res, 
        { helpful: review.helpful.count, marked: !alreadyMarked }, 
        alreadyMarked ? 'Review unmarked as helpful' : 'Review marked as helpful'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error marking review as helpful: ${errorMessage}`);
      sendError(res, 'Failed to mark review as helpful');
    }
  },

  /**
   * Report a review
   */
  reportReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findById(reviewId)
        .select('+reportThreshold');
      
      if (!review) {
        sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      // Increment report count
      review.reportCount = (review.reportCount || 0) + 1;
      
      // Automatically change status to 'pending' if report threshold is reached
      if (review.reportCount >= review.reportThreshold) {
        review.status = 'pending';
      }
      
      await review.save();

       sendSuccess(res, null, 'Review reported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error reporting review: ${errorMessage}`);
      sendError(res, 'Failed to report review');
    }
  },

  /**
   * Add a reply to a review (for shop owners or admins)
   */
  addReviewReply: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const { text } = req.body as ReplyInput;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
         sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      // Only allow shop owners or admins to reply
      // TODO: Add proper authorization check here
      
      review.reply = {
        text,
        user: new Types.ObjectId(userId),
        createdAt: new Date()
      };
      
      await review.save();

       sendSuccess(res, review, 'Reply added successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error adding review reply: ${errorMessage}`);
       sendError(res, 'Failed to add reply');
    }
  },

  /**
   * Moderate a review (admin only)
   */
  moderateReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const { status } = req.body as ModerateReviewInput;
      const userId = req.user.id;

      // Check if user is admin
      if (req.user.role !== 'admin') {
         sendError(res, 'Unauthorized. Admin access required', ErrorCodes.FORBIDDEN);
      }

      const review = await Review.findById(reviewId)
        .select('+moderatedAt +moderator');
      
      if (!review) {
         sendError(res, 'Review not found', ErrorCodes.NOT_FOUND);
      }

      review.status = status;
      review.moderatedAt = new Date();
      review.moderator = new Types.ObjectId(userId);
      review.reportCount = 0; // Reset report count after moderation
      
      await review.save();

      // Update product average rating if review status changed
      await updateProductRating(review.product);

       sendSuccess(res, review, 'Review moderated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error(`Error moderating review: ${errorMessage}`);
       sendError(res, 'Failed to moderate review');
    }
  }
};

/**
 * Helper function to update product average rating
 * Only counts approved reviews
 */
async function updateProductRating(productId: Types.ObjectId | string): Promise<void> {
  try {
    const reviews = await Review.find({ 
      product: productId,
      status: 'approved',
      deleted: { $ne: true }
    });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { 
        avgRating: 0,
        reviewCount: 0 
      });
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;
    
    await Product.findByIdAndUpdate(productId, { 
      avgRating: Number(avgRating.toFixed(1)),
      reviewCount: reviews.length 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error(`Error updating product rating: ${errorMessage}`);
    throw err;
  }
}