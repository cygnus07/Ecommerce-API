import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist.model.js';
import Product from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { AddToWishlistRequest, WishlistItem } from '../types/wishlist.types.js';
import mongoose from 'mongoose';

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export const wishlistController = {
  /**
   * Get user's wishlist
   */
  getWishlist: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      let wishlist = await Wishlist.findOne({ user: userId })
        .populate({
          path: 'items.product',
          select: 'name price images description avgRating reviewCount'
        })
        .populate('items.variant');
      
      if (!wishlist) {
        // Create a new wishlist if none exists
        wishlist = await Wishlist.create({
          user: userId,
          items: []
        });
      }
      
      sendSuccess(res, wishlist, 'Wishlist retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error getting wishlist: ${errorMessage}`);
      sendError(res, 'Failed to get wishlist');
    }
  },
  
  /**
   * Add product to wishlist
   */
  addToWishlist: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, variant } = req.body as AddToWishlistRequest;
      const userId = (req as AuthenticatedRequest).user.id;
      
      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Validate variant if provided
      if (variant && !mongoose.Types.ObjectId.isValid(variant)) {
        sendError(res, 'Invalid variant ID', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Find existing wishlist or create new one
      let wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        wishlist = await Wishlist.create({
          user: userId,
          items: [{
            product: productId,
            variant: variant ? variant : undefined,
            addedAt: new Date()
          }]
        });
      } else {
        // Check if product already in wishlist
        const existingItemIndex = wishlist.items.findIndex(
          (item: WishlistItem) => {
            const productMatch = item.product.toString() === productId;
            if (!variant) return productMatch && !item.variant;
            return productMatch && item.variant?.toString() === variant;
          }
        );
        
        if (existingItemIndex !== -1) {
          sendSuccess(res, wishlist, 'Product already in wishlist');
          return;
        }
        
        // Add product to wishlist
        wishlist.items.push({
          product: productId,
          variant: variant ? variant : undefined,
          addedAt: new Date()
        });
        
        await wishlist.save();
      }
      
      // Return populated wishlist
      const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
          path: 'items.product',
          select: 'name price images description avgRating reviewCount'
        })
        .populate('items.variant');
      
      sendSuccess(res, populatedWishlist, 'Product added to wishlist');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error adding to wishlist: ${errorMessage}`);
      sendError(res, 'Failed to add product to wishlist');
    }
  },
  
  /**
   * Remove product from wishlist
   */
  removeFromWishlist: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const variant = req.query.variant as string | undefined;
      const userId = (req as AuthenticatedRequest).user.id;
      
      const wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        sendError(res, 'Wishlist not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Filter out the product
      if (variant) {
        // Filter out specific product variant
        wishlist.items = wishlist.items.filter(
          (item: WishlistItem) => !(item.product.toString() === productId && 
                                  item.variant?.toString() === variant)
        );
      } else {
        // Filter out all instances of the product regardless of variant
        wishlist.items = wishlist.items.filter(
          (item: WishlistItem) => item.product.toString() !== productId
        );
      }
      
      await wishlist.save();
      
      // Return populated wishlist
      const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate({
          path: 'items.product',
          select: 'name price images description avgRating reviewCount'
        })
        .populate('items.variant');
      
      sendSuccess(res, populatedWishlist, 'Product removed from wishlist');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error removing from wishlist: ${errorMessage}`);
      sendError(res, 'Failed to remove product from wishlist');
    }
  },
  
  /**
   * Clear wishlist
   */
  clearWishlist: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      
      const wishlist = await Wishlist.findOne({ user: userId });
      
      if (!wishlist) {
        sendError(res, 'Wishlist not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      wishlist.items = [];
      await wishlist.save();
      
      sendSuccess(res, wishlist, 'Wishlist cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error clearing wishlist: ${errorMessage}`);
      sendError(res, 'Failed to clear wishlist');
    }
  }
};