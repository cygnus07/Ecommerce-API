// src/validators/coupon.validator.ts
import { body, param } from 'express-validator';

export const couponValidators = {
  createCoupon: [
    body('code').isString().isLength({ min: 3, max: 15 })
      .withMessage('Coupon code must be 3-15 characters'),
    body('discountType').isIn(['percentage', 'fixed'])
      .withMessage('Discount type must be either percentage or fixed'),
    body('discountValue').isNumeric().withMessage('Discount value must be a number'),
    body('minPurchaseAmount').optional().isNumeric()
      .withMessage('Minimum purchase amount must be a number'),
    body('maxDiscountAmount').optional().isNumeric()
      .withMessage('Maximum discount amount must be a number'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    body('usageLimit').optional().isInt({ min: 1 })
      .withMessage('Usage limit must be a positive integer'),
    body('products').optional().isArray()
      .withMessage('Products must be an array'),
    body('products.*').optional().isMongoId()
      .withMessage('Invalid product ID'),
    body('categories').optional().isArray()
      .withMessage('Categories must be an array'),
    body('categories.*').optional().isMongoId()
      .withMessage('Invalid category ID')
  ],
  
  validateCoupon: [
    body('code').isString().notEmpty().withMessage('Coupon code is required'),
    body('cartTotal').isNumeric().withMessage('Cart total is required and must be a number')
  ]
};