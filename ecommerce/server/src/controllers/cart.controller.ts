import {  Response } from 'express';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { Types } from 'mongoose';
import {  PopulatedCartDocument, PopulatedCartItem, CartItem } from '../types/cart.types.js';
import { AuthenticatedRequest } from '../types/user.types.js';

export const cartController = {
  // Get user's cart
  getCart: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      
      // Find cart or create if doesn't exist
      let cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.product',
          select: 'name price images stockQuantity discount'
        }) as unknown as PopulatedCartDocument;
      
      if (!cart) {
        cart = new Cart({ user: userId, items: [] }) as unknown as PopulatedCartDocument;
        await cart.save();
      }
      
      // Calculate cart totals
      const subtotal = cart.items.reduce((sum: number, item) => {
        const price = item.product.price;
        const discountPrice = price - (price * (item.product.discount / 100));
        return sum + (discountPrice * item.quantity);
      }, 0);
      
      sendSuccess(res, { 
        cart,
        summary: {
          subtotal,
          itemCount: cart.items.length,
          totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }, 'Cart retrieved successfully');
    } catch (error) {
      logger.error(`Get cart error: ${error}`);
      sendError(res, 'Failed to retrieve cart', 500);
    }
  },
  
  // Add product to cart
  addToCart: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const { productId, quantity = 1 } = req.body;
      
      // Validate product
      const product = await Product.findById(productId);
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Check stock
      if (product.stockQuantity < quantity) {
        sendError(res, 'Not enough stock available', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Find or create cart
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      }
      
      // Check if product already in cart
      const itemIndex = cart.items.findIndex((item: PopulatedCartItem) => 
        item.product.toString() === productId.toString()
      );
      
      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        const newQuantity = cart.items[itemIndex].quantity + quantity;
        
        if (newQuantity > product.stockQuantity) {
          sendError(res, 'Requested quantity exceeds available stock', ErrorCodes.BAD_REQUEST);
          return;
        }
        
        cart.items[itemIndex].quantity = newQuantity;
      } else {
        // Product is not in cart, add new item
        cart.items.push({
          product: new Types.ObjectId(productId),
          quantity,
          price: product.price,
          name: product.name,
          image: product.images?.[0],
          addedAt: new Date()
        });
      }
      
      // Save cart
      await cart.save();
      
      // Populate product details for response
      const populatedCart = await Cart.populate(cart, {
        path: 'items.product',
        select: 'name price images stockQuantity discount'
      }) as unknown as PopulatedCartDocument;
      
      // Calculate cart totals
      const subtotal = populatedCart.items.reduce((sum, item) => {
        const price = item.product.price;
        const discountPrice = price - (price * (item.product.discount / 100));
        return sum + (discountPrice * item.quantity);
      }, 0);
      
      sendSuccess(res, { 
        cart: populatedCart,
        summary: {
          subtotal,
          itemCount: populatedCart.items.length,
          totalItems: populatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }, 'Product added to cart successfully');
    } catch (error) {
      logger.error(`Add to cart error: ${error}`);
      sendError(res, 'Failed to add product to cart', 500);
    }
  },
  
  // Update cart item quantity
  updateCartItem: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const { productId, quantity } = req.body;
      
      if (quantity < 1) {
        sendError(res, 'Quantity must be at least 1', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Find cart
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        sendError(res, 'Cart not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Find item in cart
      const itemIndex = cart.items.findIndex((item: PopulatedCartItem) => 
        item.product.toString() === productId.toString()
      );
      
      if (itemIndex === -1) {
        sendError(res, 'Product not found in cart', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Check stock
      const product = await Product.findById(productId);
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      if (quantity > product.stockQuantity) {
        sendError(res, 'Requested quantity exceeds available stock', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      
      // Save cart
      await cart.save();
      
      // Populate product details for response
      const populatedCart = await Cart.populate(cart, {
        path: 'items.product',
        select: 'name price images stockQuantity discount'
      }) as unknown as PopulatedCartDocument;
      
      // Calculate cart totals
      const subtotal = populatedCart.items.reduce((sum, item) => {
        const price = item.product.price;
        const discountPrice = price - (price * (item.product.discount / 100));
        return sum + (discountPrice * item.quantity);
      }, 0);
      
      sendSuccess(res, { 
        cart: populatedCart,
        summary: {
          subtotal,
          itemCount: populatedCart.items.length,
          totalItems: populatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }, 'Cart updated successfully');
    } catch (error) {
      logger.error(`Update cart item error: ${error}`);
      sendError(res, 'Failed to update cart', 500);
    }
  },
  
  // Remove item from cart
  removeFromCart: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      
      // Find cart
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        sendError(res, 'Cart not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Remove item
      cart.items = cart.items.filter((item: PopulatedCartItem) => 
        item.product.toString() !== productId
      );
      
      // Save cart
      await cart.save();
      
      // Populate product details for response
      const populatedCart = await Cart.populate(cart, {
        path: 'items.product',
        select: 'name price images stockQuantity discount'
      }) as unknown as PopulatedCartDocument;
      
      // Calculate cart totals
      const subtotal = populatedCart.items.reduce((sum, item) => {
        const price = item.product.price;
        const discountPrice = price - (price * (item.product.discount / 100));
        return sum + (discountPrice * item.quantity);
      }, 0);
      
      sendSuccess(res, { 
        cart: populatedCart,
        summary: {
          subtotal,
          itemCount: populatedCart.items.length,
          totalItems: populatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }, 'Item removed from cart successfully');
    } catch (error) {
      logger.error(`Remove from cart error: ${error}`);
      sendError(res, 'Failed to remove item from cart', 500);
    }
  },

  // Reduce cart item quantity
  reduceCartItem: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      
      // Find cart
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        sendError(res, 'Cart not found',  ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Find item index
      const itemIndex = cart.items.findIndex((item: PopulatedCartItem) => 
        item.product.toString() === productId
      );
      
      if (itemIndex === -1) {
        sendError(res, 'Item not found in cart', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Reduce quantity
      cart.items[itemIndex].quantity -= 1;
      
      // Remove if quantity reaches 0
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
      
      // Save cart
      await cart.save();
      
      // Populate and calculate totals
      const populatedCart = await Cart.populate(cart, {
        path: 'items.product',
        select: 'name price images stockQuantity discount'
      }) as unknown as PopulatedCartDocument;
      
      const subtotal = populatedCart.items.reduce((sum, item) => {
        const price = item.product.price;
        const discountPrice = price - (price * (item.product.discount / 100));
        return sum + (discountPrice * item.quantity);
      }, 0);
      
      sendSuccess(res, { 
        cart: populatedCart,
        summary: {
          subtotal,
          itemCount: populatedCart.items.length,
          totalItems: populatedCart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }, 'Item quantity reduced successfully');
    } catch (error) {
      logger.error(`Reduce cart item error: ${error}`);
      sendError(res, 'Failed to reduce item quantity', 500);
    }
  },
  
  // Clear cart
  clearCart: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      
      // Find cart
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        sendError(res, 'Cart not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Clear items
      cart.items = [];
      
      // Save cart
      await cart.save();
      
      sendSuccess(res, { cart }, 'Cart cleared successfully');
    } catch (error) {
      logger.error(`Clear cart error: ${error}`);
      sendError(res, 'Failed to clear cart', 500);
    }
  }
};