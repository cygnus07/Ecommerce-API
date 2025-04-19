import { Request, Response } from 'express';
import  InventoryActivity  from '../models/InventoryActivity.model.js';
import  Product  from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const inventoryActivityController = {
  /**
   * Log inventory activity
   */
  logActivity: async (req: Request, res: Response) => {
    try {
      const { productId, activityType, quantity, note } = req.body;
      const userId = req.user.id;
      
      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      // Create activity record
      const activity = await InventoryActivity.create({
        product: productId,
        performedBy: userId,
        activityType,
        quantity,
        note,
        previousStock: product.stockQuantity
      });
      
      // Update product stock
      let newStock = product.stockQuantity;
      
      switch (activityType) {
        case 'add':
          newStock += quantity;
          break;
        case 'remove':
          newStock -= quantity;
          if (newStock < 0) {
            newStock = 0;
          }
          break;
        case 'adjust':
          newStock = quantity;
          break;
      }
      
      // Update product stock
      await Product.findByIdAndUpdate(productId, { stockQuantity: newStock });
      
      // Update activity with new stock
      activity.newStock = newStock;
      await activity.save();
      
      return sendSuccess(res, activity, 'Inventory activity logged successfully', 201);
    } catch (err) {
      logger.error(`Error logging inventory activity: ${err.message}`);
      return sendError(res, 'Failed to log inventory activity');
    }
  },
  
  /**
   * Get inventory activities for a product
   */
  getProductActivities: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { limit = 20, page = 1 } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const activities = await InventoryActivity.find({ product: productId })
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      const total = await InventoryActivity.countDocuments({ product: productId });
      
      return sendSuccess(res, {
        activities,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }, 'Inventory activities retrieved successfully');
    } catch (err) {
      logger.error(`Error getting inventory activities: ${err.message}`);
      return sendError(res, 'Failed to get inventory activities');
    }
  },
  
  /**
   * Get all inventory activities (admin)
   */
  getAllActivities: async (req: Request, res: Response) => {
    try {
      const { 
        limit = 20, 
        page = 1, 
        productId, 
        activityType,
        startDate,
        endDate,
        userId
      } = req.query;
      
      const filter: any = {};
      
      if (productId) filter.product = productId;
      if (activityType) filter.activityType = activityType;
      if (userId) filter.performedBy = userId;
      
      // Date filtering
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(String(startDate));
        if (endDate) filter.createdAt.$lte = new Date(String(endDate));
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const activities = await InventoryActivity.find(filter)
        .populate('performedBy', 'name email')
        .populate('product', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      const total = await InventoryActivity.countDocuments(filter);
      
      return sendSuccess(res, {
        activities,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }, 'Inventory activities retrieved successfully');
    } catch (err) {
      logger.error(`Error getting all inventory activities: ${err.message}`);
      return sendError(res, 'Failed to get inventory activities');
    }
  },
  
  /**
   * Get inventory activity summary
   */
  getActivitySummary: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(String(startDate));
      if (endDate) dateFilter.$lte = new Date(String(endDate));
      
      const aggregation = [
        {
          $match: dateFilter.length > 0 ? { createdAt: dateFilter } : {}
        },
        {
          $group: {
            _id: {
              productId: '$product',
              activityType: '$activityType'
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
        {
          $unwind: '$productDetails'
        },
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
      
      return sendSuccess(res, summary, 'Inventory activity summary retrieved successfully');
    } catch (err) {
      logger.error(`Error getting inventory activity summary: ${err.message}`);
      return sendError(res, 'Failed to get inventory activity summary');
    }
  }
};