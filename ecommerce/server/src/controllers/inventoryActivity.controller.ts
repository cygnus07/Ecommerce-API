import { Request, Response } from 'express';
import InventoryActivity from '../models/InventoryActivity.model.js';
import Product from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { InventoryActivityType } from '../models/InventoryActivity.model.js';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/user.types.js';
import { error } from 'console';

export const inventoryActivityController = {
  /**
   * Log inventory activity
   */
  logActivity: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { product, type, quantity, variant, reference, note } = req.body;
      const userId = req.user._id;
      
      // Validate product exists
      const productDoc = await Product.findById(product);
      if (!productDoc) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }

      // Validate variant exists if provided
      if (variant && !productDoc.variants.some((v: any) => v._id.equals(variant))) {
        sendError(res, 'Variant not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Get current stock (variant or product level)
      const currentStock = variant 
        ? productDoc.variants.id(variant).inventory
        : productDoc.stockQuantity;

      // Create activity record
      const activity = await InventoryActivity.create({
        product,
        type,
        quantity,
        variant,
        reference,
        note,
        performedBy: userId,
        previousQuantity: currentStock,
        newQuantity: type === 'adjustment' ? quantity : currentStock + quantity
      });
      
      // Update stock based on activity type
      let updatedStock;
      switch (type) {
        case 'stock_addition':
        case 'purchase':
        case 'return':
          updatedStock = currentStock + quantity;
          break;
          
        case 'stock_removal':
        case 'sale':
        case 'damaged':
        case 'transfer':
          updatedStock = Math.max(0, currentStock - quantity);
          break;
          
        case 'adjustment':
          updatedStock = quantity;
          break;
          
        default:
          throw new Error('Invalid activity type');
      }

      // Update inventory
      const update = variant
        ? { $set: { 'variants.$[elem].inventory': updatedStock } }
        : { $set: { stockQuantity: updatedStock } };
      
      await Product.updateOne(
        { _id: product, ...(variant && { 'variants._id': variant }) },
        update,
        { arrayFilters: variant ? [{ 'elem._id': variant }] : undefined }
      );
      
      sendSuccess(res, activity, 'Inventory activity logged successfully', 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error logging inventory activity: ${errorMessage}`);
      sendError(res, 'Failed to log inventory activity');
    }
},

  /**
   * Get inventory activities for a product
   */
  getProductActivities: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const { limit = 20, page = 1 } = req.query as { limit?: number; page?: number };
      
      const skip = (page - 1) * limit;
      
      const activities = await InventoryActivity.find({ product: productId })
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await InventoryActivity.countDocuments({ product: productId });
      
      sendSuccess(res, {
        activities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Inventory activities retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error getting inventory activities: ${errorMessage}`);
      sendError(res, 'Failed to get inventory activities');
    }
  },
  

  /**
   * Get all inventory activities (admin)
   */
  getAllActivities: async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        limit = 20, 
        page = 1, 
        productId, 
        type,
        startDate,
        endDate,
        userId,
        referenceType,
        referenceId
      } = req.query;
      
      const filter: any = {};
      
      if (productId) filter.product = productId;
      if (type) filter.type = type;
      if (userId) filter.performedBy = userId;
      
      // Reference filtering
      if (referenceType && referenceId) {
        filter.reference = {
          type: referenceType,
          id: referenceId
        };
      }
      
      // Date filtering
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const activities = await InventoryActivity.find(filter)
        .populate('performedBy', 'name email')
        .populate('product', 'name price images')
        .populate('variant', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      const total = await InventoryActivity.countDocuments(filter);
      
      sendSuccess(res, {
        activities,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }, 'Inventory activities retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error getting all inventory activities: ${errorMessage}`);
      sendError(res, 'Failed to get inventory activities');
    }
  },

  /**
   * Get inventory activity summary
   */
  getActivitySummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, productId, type } = req.query;
      
      const match: any = {};
      
      // Date filtering
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate as string);
        if (endDate) match.createdAt.$lte = new Date(endDate as string);
      }
      
      // Product filter
      if (productId) match.product = new mongoose.Types.ObjectId(productId as string);
      
      // Activity type filter
      if (type) match.type = type;
      
      const aggregation = [
        { $match: match },
        {
          $group: {
            _id: {
              productId: '$product',
              activityType: '$type'
            },
            totalQuantity: { $sum: '$quantity' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.productId',
            activities: {
              $push: {
                type: '$_id.activityType',
                totalQuantity: '$totalQuantity',
                count: '$count'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            _id: 1,
            productName: '$productDetails.name',
            currentStock: '$productDetails.stockQuantity',
            activities: 1
          }
        }
      ];
      
      const summary = await InventoryActivity.aggregate(aggregation);
      sendSuccess(res, summary, 'Inventory activity summary retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error getting inventory activity summary: ${errorMessage}`);
      sendError(res, 'Failed to get inventory activity summary');
    }
  }
};