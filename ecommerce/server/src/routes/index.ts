// src/routes/index.ts
import express from 'express';
import userRoutes from './user.routes.js';
// import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import cartRoutes from './cart.routes.js';
import reviewRoutes from './review.routes.js';
import couponRoutes from './coupon.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import inventoryActivityRoutes from './inventoryActivity.routes.js';
import searchRoutes from './search.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = express.Router();

// API routes
// router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
// router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/reviews', reviewRoutes);
// router.use('/coupons', couponRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/inventory', inventoryActivityRoutes);
router.use('/search', searchRoutes);
// router.use('/analytics', analyticsRoutes);

export default router;