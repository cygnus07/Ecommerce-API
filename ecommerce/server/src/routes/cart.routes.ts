import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { authenticate, withAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { 
    addToCartSchema, 
    updateCartItemSchema,
    cartItemParamsSchema 
  } from '../validators/cart.validator.js';
const router = Router();

// Apply authentication middleware to all cart routes
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', withAuth(cartController.getCart));

// POST /api/cart - Add product to cart
router.post('/', validate(addToCartSchema, 'body'), withAuth(cartController.addToCart));

// PUT /api/cart - Update cart item quantity
router.put('/', validate(updateCartItemSchema), withAuth(cartController.updateCartItem));

// DELETE /api/cart/:productId - Remove item from cart
router.delete('/:productId', validate(cartItemParamsSchema, 'params'), withAuth(cartController.removeFromCart));

// delete /api/cart/:productId - reduce item quantity in cart by 1
router.delete('/:productId/reduce', validate(cartItemParamsSchema, 'params'), withAuth(cartController.reduceCartItem));


// DELETE /api/cart - Clear cart
router.delete('/', withAuth(cartController.clearCart));

export default router;