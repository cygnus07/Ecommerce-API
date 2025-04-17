import { Request, Response } from 'express';
import { Wishlist } from '../models/wishlist.model.js';
import { Product } from '../models/product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const wishlistController = {
  /**
   * Get user's wishlist
   */
  getWishlist: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      let wishlist = await Wishlist.findOne({ user: userId })
        .populate({
          path: 'products',
          select: 'name price images description avgRating reviewCount'
        });
      
      if (!wishlist) {
        // Create a new wishlist if none exists
        wishlist = await Wishlist.create({
          user: userId,
          products: []
        });
      }
      
      return sendSuccess(res, wishlist, 'Wishlist retrieved successfully');
    } catch (err) {
      logger.error(`Error getting wishlist: ${err.message}`);
      return sendError(res, 'Failed to get wishlist');
    }
  },
  
  /**
   * Add product to wishlist
   */
  addToWishlist: async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;
      const userId = req.user.id;
      
      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      // Find existing wishlist or create new one
      let wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        wishlist = await Wishlist.create({
          user: userId,
          products: [productId]
        });
      } else {
        // Check if product already in wishlist
        if (wishlist.products.includes(productId)) {
          return sendSuccess(res, wishlist, 'Product already in wishlist');
        }
        
        // Add product to wishlist
        wishlist.products.push(productId);
        await wishlist.save();
      }
      
      // Return populated wishlist
      const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
          path: 'products',
          select: 'name price images description avgRating reviewCount'
        });
      
      return sendSuccess(res, populatedWishlist, 'Product added to wishlist');
    } catch (err) {
      logger.error(`Error adding to wishlist: ${err.message}`);
      return sendError(res, 'Failed to add product to wishlist');
    }
  },
  
  /**
   * Remove product from wishlist
   */
  removeFromWishlist: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const userId = req.user.id;
      
      const wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        return sendError(res, 'Wishlist not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      // Filter out the product
      wishlist.products = wishlist.products.filter(
        product => product.toString() !== productId
      );
      
      await wishlist.save();
      
      // Return populated wishlist
      const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
          path: 'products',
          select: 'name price images description avgRating reviewCount'
        });
      
      return sendSuccess(res, populatedWishlist, 'Product removed from wishlist');
    } catch (err) {
      logger.error(`Error removing from wishlist: ${err.message}`);
      return sendError(res, 'Failed to remove product from wishlist');
    }
  },
  
  /**
   * Clear wishlist
   */
  clearWishlist: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      const wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        return sendError(res, 'Wishlist not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      wishlist.products = [];
      await wishlist.save();
      
      return sendSuccess(res, wishlist, 'Wishlist cleared successfully');
    } catch (err) {
      logger.error(`Error clearing wishlist: ${err.message}`);
      return sendError(res, 'Failed to clear wishlist');
    }
  }
};