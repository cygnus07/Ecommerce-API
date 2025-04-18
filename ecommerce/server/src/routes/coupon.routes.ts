// src/routes/coupon.routes.ts
import express from 'express';
import { couponController } from '../controllers/coupon.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { couponValidators } from '../validators/coupon.validator.js';

const router = express.Router();

// Public routes
router.get('/active', couponController.getActiveCoupons);

// Protected routes
router.use(authenticate);

// User routes
router.post('/validate', validate(couponValidators.validateCoupon), couponController.validateCoupon);

// Admin routes
router.use(authorize(['admin']));
router.post('/', validate(couponValidators.createCoupon), couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.get('/:couponId', couponController.getCouponById);
router.put('/:couponId', couponController.updateCoupon);
router.delete('/:couponId', couponController.deleteCoupon);

export default router;