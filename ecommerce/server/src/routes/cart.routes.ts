import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { 
    addToCartSchema, 
    updateCartItemSchema,
    cartItemParamsSchema 
  } from '../validators/cart.validator.js';
const router = Router();

// Apply authentication middleware to all cart routes
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', cartController.getCart);

// POST /api/cart - Add product to cart
router.post('/', validate(addToCartSchema), cartController.addToCart);

// PUT /api/cart - Update cart item quantity
router.put('/', validate(updateCartItemSchema), cartController.updateCartItem);

// DELETE /api/cart/:productId - Remove item from cart
router.delete('/:productId', validate(cartItemParamsSchema, 'params'), cartController.removeFromCart);

// DELETE /api/cart - Clear cart
router.delete('/', cartController.clearCart);

export default router;