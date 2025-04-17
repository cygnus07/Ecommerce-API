// src/validators/inventoryActivity.validator.ts
import { body, param, query } from 'express-validator';

export const inventoryActivityValidators = {
  logActivity: [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('activityType').isIn(['add', 'remove', 'adjust'])
      .withMessage('Activity type must be add, remove, or adjust'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('note').optional().isString().withMessage('Note must be a string')
  ],
  
  getProductActivities: [
    param('productId').isMongoId().withMessage('Valid product ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  
  getActivitySummary: [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) <= new Date(req.query.startDate as string)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ]
};