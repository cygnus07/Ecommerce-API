// src/routes/wishlist.routes.ts
import express from 'express';
import { wishlistController } from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { wishlistValidators } from '../validators/wishlist.validator.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/', validate(wishlistValidators.addToWishlist), wishlistController.addToWishlist);
router.delete('/:productId', validate(wishlistValidators.removeFromWishlist), wishlistController.removeFromWishlist);
router.delete('/', wishlistController.clearWishlist);

export default router;