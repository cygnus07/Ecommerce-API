import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { InventoryActivity } from '../models/inventoryActivity.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const orderController = {
  // Create new order
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const { 
        shippingAddress, 
        paymentMethod = 'card',
        couponCode = null
      } = req.body;
      
      // Find user's cart
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.product',
          select: 'name price images stockQuantity discount'
        });
      
      if (!cart || cart.items.length === 0) {
        sendError(res, 'Cart is empty', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Verify all products are in stock
      for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        
        if (!product) {
          sendError(res, `Product not found: ${item.product.name}`, 404, ErrorCodes.NOT_FOUND);
          return;
        }
        
        if (!product.isActive) {
          sendError(res, `Product is no longer available: ${product.name}`, 400, ErrorCodes.BAD_REQUEST);
          return;
        }
        
        if (product.stockQuantity < item.quantity) {
          sendError(res, `Not enough stock for ${product.name}`, 400, ErrorCodes.BAD_REQUEST);
          return;
        }
      }
      
      // Calculate order totals
      const items = cart.items.map(item => {
        const price = item.product.price;
        const discountPercent = item.product.discount;
        const discountedPrice = price - (price * (discountPercent / 100));
        
        return {
          product: item.product._id,
          quantity: item.quantity,
          price: price,
          discountedPrice: discountedPrice,
          totalPrice: discountedPrice * item.quantity
        };
      });
      
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // TODO: Apply coupon if provided
      let discount = 0;
      if (couponCode) {
        // Implement coupon validation and discount calculation
      }
      
      // Calculate shipping and tax
      const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const taxRate = 0.08; // 8% tax
      const taxAmount = subtotal * taxRate;
      
      const total = subtotal + shippingCost + taxAmount - discount;
      
      // Create new order
      const order = new Order({
        user: userId,
        items: items,
        shippingAddress,
        paymentMethod,
        status: 'pending',
        subtotal,
        discount,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        coupon: couponCode
      });
      
      await order.save();
      
      // Handle payment
      let paymentIntent;
      
      if (paymentMethod === 'card') {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            orderId: order._id.toString(),
            userId: userId.toString()
          }
        });
        
        order.paymentInfo = {
          id: paymentIntent.id,
          status: paymentIntent.status
        };
        
        await order.save();
      }
      
      sendSuccess(
        res, 
        { 
          order,
          payment: paymentMethod === 'card' ? {
            clientSecret: paymentIntent.client_secret
          } : null
        }, 
        'Order created successfully', 
        201
      );
    } catch (error) {
      logger.error(`Create order error: ${error}`);
      sendError(res, 'Failed to create order', 500);
    }
  },
  
  // Process order after payment confirmation
  confirmOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, paymentIntentId } = req.body;
      
      // Find order
      const order = await Order.findById(orderId);
      
      if (!order) {
        sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Verify user owns this order
      if (order.user.toString() !== req.user._id.toString()) {
        sendError(res, 'Not authorized', 403, ErrorCodes.FORBIDDEN);
        return;
      }
      
      // Verify payment if method is card
      if (order.paymentMethod === 'card') {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          sendError(res, 'Payment not completed', 400, ErrorCodes.BAD_REQUEST);
          return;
        }
        
        if (paymentIntent.metadata.orderId !== orderId) {
          sendError(res, 'Payment verification failed', 400, ErrorCodes.BAD_REQUEST);
          return;
        }
        
        // Update payment info
        order.paymentInfo = {
          id: paymentIntent.id,
          status: paymentIntent.status
        };
      }
      
      // Update order status
      order.status = 'confirmed';
      order.confirmedAt = new Date();
      
      await order.save();
      
      // Update inventory
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        
        if (product) {
          // Reduce stock
          product.stockQuantity -= item.quantity;
          await product.save();
          
          // Record inventory activity
          const activity = new InventoryActivity({
            product: product._id,
            type: 'out',
            quantity: item.quantity,
            reason: 'order',
            reference: order._id,
            performedBy: req.user._id
          });
          
          await activity.save();
        }
      }
      
      // Clear cart
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $set: { items: [] } }
      );
      
      sendSuccess(res, { order }, 'Order confirmed successfully');
    } catch (error) {
      logger.error(`Confirm order error: ${error}`);
      sendError(res, 'Failed to confirm order', 500);
    }
  },
  
  // Get user's orders
  getUserOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'items.product',
          select: 'name images'
        });
      
      const total = await Order.countDocuments({ user: userId });
      
      sendSuccess(res, {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, 'Orders retrieved successfully');
    } catch (error) {
      logger.error(`Get user orders error: ${error}`);
      sendError(res, 'Failed to retrieve orders', 500);
    }
  },
  
  // Get order by ID
  getOrderById: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = req.params.id;
      
      const order = await Order.findById(orderId)
        .populate({
          path: 'items.product',
          select: 'name price images'
        })
        .populate('user', 'name email');
      
      if (!order) {
        sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Verify user has access to this order
      if (
        order.user._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin'
      ) {
        sendError(res, 'Not authorized to access this order', 403, ErrorCodes.FORBIDDEN);
        return;
      }
      
      sendSuccess(res, { order }, 'Order retrieved successfully');
    } catch (error) {
      logger.error(`Get order by ID error: ${error}`);
      sendError(res, 'Failed to retrieve order', 500);
    }
  },
  
  // Admin: Get all orders
  getAllOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      
      // Build query
      const query: any = {};
      if (status) {
        query.status = status;
      }
      
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate({
          path: 'items.product',
          select: 'name images'
        });
      
      const total = await Order.countDocuments(query);
      
      sendSuccess(res, {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, 'Orders retrieved successfully');
    } catch (error) {
      logger.error(`Get all orders error: ${error}`);
      sendError(res, 'Failed to retrieve orders', 500);
    }
  },
  
  // Admin: Update order status
  updateOrderStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        sendError(res, 'Invalid status', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Handle cancelled status
      if (status === 'cancelled' && ['shipped', 'delivered'].includes(order.status)) {
        sendError(res, 'Cannot cancel an order that has been shipped or delivered', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Update timestamp based on status
      let statusUpdate: any = { status };
      
      switch (status) {
        case 'confirmed':
          statusUpdate.confirmedAt = new Date();
          break;
        case 'shipped':
          statusUpdate.shippedAt = new Date();
          break;
        case 'delivered':
          statusUpdate.deliveredAt = new Date();
          break;
        case 'cancelled':
          statusUpdate.cancelledAt = new Date();
          
          // Return items to inventory if cancelled
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            
            if (product) {
              // Add stock back
              product.stockQuantity += item.quantity;
              await product.save();
              
              // Record inventory activity
              const activity = new InventoryActivity({
                product: product._id,
                type: 'in',
                quantity: item.quantity,
                reason: 'order_cancelled',
                reference: order._id,
                performedBy: req.user._id
              });
              
              await activity.save();
            }
          }
          break;
      }
      
      // Update order
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: statusUpdate },
        { new: true }
      ).populate('user', 'name email');
      
      sendSuccess(res, { order: updatedOrder }, 'Order status updated successfully');
    } catch (error) {
      logger.error(`Update order status error: ${error}`);
      sendError(res, 'Failed to update order status', 500);
    }
  }
};