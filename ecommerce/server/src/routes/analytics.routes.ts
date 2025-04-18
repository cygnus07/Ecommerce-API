// src/routes/analytics.routes.ts
import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { analyticsService } from '../services/analytics.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/sales', async (req, res) => {
  try {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string) 
      : new Date(new Date().setDate(new Date().getDate() - 30));
      
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string) 
      : new Date();
    
    const salesData = await analyticsService.getSalesAnalytics(startDate, endDate);
    return sendSuccess(res, salesData, 'Sales analytics retrieved successfully');
  } catch (err) {
    logger.error(`Error in sales analytics route: ${err.message}`);
    return sendError(res, 'Failed to get sales analytics');
  }
});

router.get('/products', async (req, res) => {
  try {
    const productData = await analyticsService.getProductAnalytics();
    return sendSuccess(res, productData, 'Product analytics retrieved successfully');
  } catch (err) {
    logger.error(`Error in product analytics route: ${err.message}`);
    return sendError(res, 'Failed to get product analytics');
  }
});

router.get('/users', async (req, res) => {
  try {
    const userData = await analyticsService.getUserAnalytics();
    return sendSuccess(res, userData, 'User analytics retrieved successfully');
  } catch (err) {
    logger.error(`Error in user analytics route: ${err.message}`);
    return sendError(res, 'Failed to get user analytics');
  }
});

export default router;