import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/review.model.js';
import { Product } from '../models/product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const reviewController = {
  /**
   * Create a new review
   */
  createReview: async (req: Request, res: Response) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user.id;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({ user: userId, product: productId });
      if (existingReview) {
        return sendError(
          res, 
          'You have already reviewed this product', 
          409, 
          ErrorCodes.CONFLICT
        );
      }

      const newReview = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment
      });

      // Update product average rating
      await updateProductRating(productId);

      return sendSuccess(res, newReview, 'Review created successfully', 201);
    } catch (err) {
      logger.error(`Error creating review: ${err.message}`);
      return sendError(res, 'Failed to create review');
    }
  },

  /**
   * Get all reviews for a product
   */
  getProductReviews: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const reviews = await Review.find({ product: productId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      return sendSuccess(res, reviews, 'Reviews retrieved successfully');
    } catch (err) {
      logger.error(`Error getting product reviews: ${err.message}`);
      return sendError(res, 'Failed to get product reviews');
    }
  },

  /**
   * Get all reviews by a user
   */
  getUserReviews: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId || req.user.id;
      
      const reviews = await Review.find({ user: userId })
        .populate('product', 'name price images')
        .sort({ createdAt: -1 });

      return sendSuccess(res, reviews, 'User reviews retrieved successfully');
    } catch (err) {
      logger.error(`Error getting user reviews: ${err.message}`);
      return sendError(res, 'Failed to get user reviews');
    }
  },

  /**
   * Update a review
   */
  updateReview: async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        return sendError(res, 'Review not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user is the owner of the review
      if (review.user.toString() !== userId) {
        return sendError(res, 'Unauthorized', 403, ErrorCodes.FORBIDDEN);
      }

      review.rating = rating || review.rating;
      review.comment = comment || review.comment;
      await review.save();

      // Update product average rating
      await updateProductRating(review.product);

      return sendSuccess(res, review, 'Review updated successfully');
    } catch (err) {
      logger.error(`Error updating review: ${err.message}`);
      return sendError(res, 'Failed to update review');
    }
  },

  /**
   * Delete a review
   */
  deleteReview: async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        return sendError(res, 'Review not found', 404, ErrorCodes.NOT_FOUND);
      }

      // Check if user is the owner of the review or an admin
      if (review.user.toString() !== userId && req.user.role !== 'admin') {
        return sendError(res, 'Unauthorized', 403, ErrorCodes.FORBIDDEN);
      }

      const productId = review.product;
      await Review.deleteOne({ _id: reviewId });

      // Update product average rating
      await updateProductRating(productId);

      return sendSuccess(res, null, 'Review deleted successfully');
    } catch (err) {
      logger.error(`Error deleting review: ${err.message}`);
      return sendError(res, 'Failed to delete review');
    }
  }
};

/**
 * Helper function to update product average rating
 */
async function updateProductRating(productId: Types.ObjectId | string) {
  const reviews = await Review.find({ product: productId });
  
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
}