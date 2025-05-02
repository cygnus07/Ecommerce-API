// import { Request, Response } from 'express';
// import Stripe from 'stripe';
// import { Types } from 'mongoose';
// import Order from '../models/Order.model.js';
// import Cart from '../models/Cart.model.js';
// import Product from '../models/Product.model.js';
// import InventoryActivity from '../models/InventoryActivity.model.js';
// import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
// import { env } from '../config/environment.js';
// import { logger } from '../utils/logger.js';
// import { 
//   OrderStatus, 
//   PaymentStatus, 
//   PaymentMethod, 
//   OrderDocument
// } from '../types/order.types.js';
// import { z } from 'zod';
// import { 
//   createOrderSchema, 
//   confirmOrderSchema, 
//   orderIdParamsSchema,
//   orderStatusSchema,
//   ordersQuerySchema
// } from '../validators/order.validator.js';
// import { AuthenticatedRequest } from '../types/user.types.js';

// // Define request types based on zod schemas
// type CreateOrderRequest = z.infer<typeof createOrderSchema>;
// type ConfirmOrderRequest = z.infer<typeof confirmOrderSchema>;
// type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
// type OrderStatusRequest = z.infer<typeof orderStatusSchema>;
// type OrdersQueryParams = z.infer<typeof ordersQuerySchema>;

// // Initialize Stripe
// const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16'
// });

// // Map payment methods from API to internal enum
// const mapPaymentMethod = (method: string): PaymentMethod => {
//   switch (method) {
//     case 'card':
//       return PaymentMethod.CREDIT_CARD;
//     case 'bank':
//       return PaymentMethod.BANK_TRANSFER;
//     case 'cash':
//       return PaymentMethod.CASH_ON_DELIVERY;
//     default:
//       return PaymentMethod.CREDIT_CARD;
//   }
// };

// export const orderController = {
//   // Create new order
//   createOrder: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//       const userId = req.user._id;
//       const { 
//         shippingAddress, 
//         paymentMethod = 'card',
//         couponCode = null
//       } = req.body as CreateOrderRequest;
      
//       // Find user's cart
//       const cart = await Cart.findOne({ user: userId })
//         .populate({
//           path: 'items.product',
//           select: 'name slug images variants category status'
//         });
      
//       if (!cart || cart.items.length === 0) {
//         sendError(res, 'Cart is empty', ErrorCodes.BAD_REQUEST);
//         return;
//       }
      
//       // Verify all products are in stock
//       const orderItems = [];
      
//       for (const cartItem of cart.items) {
//         const product = await Product.findById(cartItem.product._id);
        
//         if (!product) {
//           sendError(res, `Product not found: ${cartItem.product.name}`, ErrorCodes.NOT_FOUND);
//           return;
//         }
        
//         // if (product.status !== 'active') {
//         //   sendError(res, `Product is no longer available: ${product.name}`, ErrorCodes.BAD_REQUEST);
//         //   return;
//         // }
        
//         // Find the variant if applicable
//         let variant = null;
//         if (cartItem.variant) {
//           variant = product.variants.find((v: any) => v._id.toString() === cartItem.variant.toString());
          
//           if (!variant) {
//             sendError(res, `Variant not found for product: ${product.name}`, ErrorCodes.NOT_FOUND);
//             return;
//           }
          
//           if (variant.inventory < cartItem.quantity) {
//             sendError(res, `Not enough stock for ${product.name} (${variant.options.map((o: any) => o.value).join(', ')})`, ErrorCodes.BAD_REQUEST);
//             return;
//           }
//         } else {
//           // Use the default variant if no variant specified
//           variant = product.variants.find((v: any) => v.isDefault);
          
//           if (!variant) {
//             sendError(res, `No default variant found for product: ${product.name}`, ErrorCodes.NOT_FOUND);
//             return;
//           }
          
//           if (variant.inventory < cartItem.quantity) {
//             sendError(res, `Not enough stock for ${product.name}`, ErrorCodes.BAD_REQUEST);
//             return;
//           }
//         }
        
//         // Calculate the actual price from the variant
//         const price = variant.price;
//         const compareAtPrice = variant.compareAtPrice || price;
//         const discountedPrice = price;  // The variant price already includes any discounts
        
//         // Create order item
//         orderItems.push({
//           product: product._id,
//           variant: variant._id,
//           name: product.name,
//           sku: variant.sku,
//           price: compareAtPrice,  // Original price
//           quantity: cartItem.quantity,
//           totalPrice: discountedPrice * cartItem.quantity,
//           image: cartItem.image || (variant.images && variant.images.length > 0 ? variant.images[0] : (product.featuredImage || '')),
//           options: cartItem.options || variant.options
//         });
//       }
      
//       // Calculate order totals
//       const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
//       // Apply coupon if provided
//       let discount = 0;
//       let discountDetails = undefined;
      
//       if (couponCode) {
//         // TODO: Implement coupon validation and discount calculation
//         // For now, we'll just set it as applied but with zero discount
//         discountDetails = {
//           code: couponCode,
//           amount: 0,
//           type: 'percentage' as const
//         };
//       }
      
//       // Calculate shipping and tax
//       const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
//       const taxRate = 0.08; // 8% tax
//       const taxAmount = subtotal * taxRate;
      
//       const total = subtotal + shippingCost + taxAmount - discount;
      
//       // Generate order number using the model's static method
//       const orderNumber = await Order.generateOrderNumber();
      
//       // Create address info object from shipping address
//       const addressInfo = {
//         fullName: `${req.user.firstName} ${req.user.lastName}`,
//         addressLine1: shippingAddress.street,
//         addressLine2: shippingAddress.street2 || '',
//         city: shippingAddress.city,
//         state: shippingAddress.state,
//         postalCode: shippingAddress.postalCode,
//         country: shippingAddress.country,
//         phone: req.user.phone || shippingAddress.phone || ''
//       };
      
//       // Create new order
//       const order = new Order({
//         orderNumber,
//         user: userId,
//         items: orderItems,
//         billing: {
//           address: addressInfo,
//           email: req.user.email
//         },
//         shipping: {
//           address: addressInfo,
//           method: 'standard',
//           cost: shippingCost
//         },
//         payment: {
//           method: mapPaymentMethod(paymentMethod),
//           status: PaymentStatus.PENDING,
//           amount: total,
//           currency: 'usd'
//         },
//         summary: {
//           subtotal,
//           tax: taxAmount,
//           discount,
//           shipping: shippingCost,
//           total
//         },
//         status: OrderStatus.PENDING,
//         couponCode,
//         discount: discountDetails
//       });
      
//       await order.save();
      
//       // Handle payment
//       let paymentIntent;
      
//       if (paymentMethod === 'card') {
//         paymentIntent = await stripe.paymentIntents.create({
//           amount: Math.round(total * 100), // Convert to cents
//           currency: 'usd',
//           metadata: {
//             orderId: order._id.toString(),
//             orderNumber,
//             userId: userId.toString()
//           }
//         });
        
//         // Update order with payment info
//         order.payment.transactionId = paymentIntent.id;
//         await order.save();
//       }
      
//       sendSuccess(
//         res, 
//         { 
//           order: order.toObject(),
//           payment: paymentMethod === 'card' ? {
//             clientSecret: paymentIntent!.client_secret
//           } : null
//         }, 
//         'Order created successfully', 
//         201
//       );
//     } catch (error) {
//       logger.error(`Create order error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to create order', 500);
//     }
//   },
  
//   // Process order after payment confirmation
//   confirmOrder: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//       const { orderId, paymentIntentId } = req.body as ConfirmOrderRequest;
      
//       // Find order
//       const order = await Order.findById(orderId);
      
//       if (!order) {
//         sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
//         return;
//       }
      
//       // Verify user owns this order
//       if (order.user.toString() !== req.user._id.toString()) {
//         sendError(res, 'Not authorized to confirm this order', 403, ErrorCodes.FORBIDDEN);
//         return;
//       }
      
//       // Verify payment if method is credit card
//       if (order.payment.method === PaymentMethod.CREDIT_CARD) {
//         if (!paymentIntentId) {
//           sendError(res, 'Payment intent ID is required for card payments', 400, ErrorCodes.BAD_REQUEST);
//           return;
//         }
        
//         const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
//         if (paymentIntent.status !== 'succeeded') {
//           sendError(res, `Payment not completed. Status: ${paymentIntent.status}`, 400, ErrorCodes.BAD_REQUEST);
//           return;
//         }
        
//         if (paymentIntent.metadata.orderId !== orderId) {
//           sendError(res, 'Payment verification failed - order ID mismatch', 400, ErrorCodes.BAD_REQUEST);
//           return;
//         }
        
//         // Update payment info
//         order.payment.status = PaymentStatus.COMPLETED;
//         order.payment.transactionId = paymentIntent.id;
//       } else if (order.payment.method === PaymentMethod.CASH_ON_DELIVERY) {
//         // Cash on delivery stays as pending until delivery
//         order.payment.status = PaymentStatus.PENDING;
//       } else {
//         // Other payment methods (like bank transfer) can be set to completed here,
//         // or might require additional verification depending on business logic
//         order.payment.status = PaymentStatus.COMPLETED;
//       }
      
//       // Update order status
//       order.status = OrderStatus.PROCESSING;
      
//       await order.save();
      
//       // Update inventory for each product
//       for (const item of order.items) {
//         const productId = typeof item.product === 'string' ? item.product : item.product.toString();
//         const variantId = item.variant ? (typeof item.variant === 'string' ? item.variant : item.variant.toString()) : null;
        
//         const product = await Product.findById(productId);
        
//         if (product) {
//           if (variantId) {
//             // Update variant inventory
//             const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
            
//             if (variantIndex !== -1) {
//               product.variants[variantIndex].inventory -= item.quantity;
//               await product.save();
//             }
//           } else {
//             // Update default variant inventory
//             const defaultVariant = product.variants.find(v => v.isDefault);
//             if (defaultVariant) {
//               const variantIndex = product.variants.findIndex(v => v.isDefault);
//               product.variants[variantIndex].inventory -= item.quantity;
//               await product.save();
//             }
//           }
          
//           // Record inventory activity
//           const activity = new InventoryActivity({
//             product: product._id,
//             variant: variantId,
//             type: 'out',
//             quantity: item.quantity,
//             reason: 'order',
//             reference: order._id,
//             performedBy: req.user._id
//           });
          
//           await activity.save();
//         }
//       }
      
//       // Clear cart
//       await Cart.findOneAndUpdate(
//         { user: req.user._id },
//         { $set: { items: [], summary: { subtotal: 0, tax: 0, discount: 0, shipping: 0, total: 0 } } }
//       );
      
//       sendSuccess(res, { order: order.toObject() }, 'Order confirmed successfully');
//     } catch (error) {
//       logger.error(`Confirm order error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to confirm order', 500);
//     }
//   },
  
//   // Get user's orders
//   getUserOrders: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//       const userId = req.user._id;
//       const { page = 1, limit = 10, status } = req.query as unknown as OrdersQueryParams;
//       const skip = (Number(page) - 1) * Number(limit);
      
//       // Build query
//       const query: Record<string, any> = { user: userId };
//       if (status) {
//         query.status = status;
//       }
      
//       const orders = await Order.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit))
//         .populate({
//           path: 'items.product',
//           select: 'name slug featuredImage'
//         });
      
//       const total = await Order.countDocuments(query);
      
//       sendSuccess(res, {
//         orders: orders.map(order => order.toObject()),
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           pages: Math.ceil(total / Number(limit))
//         }
//       }, 'Orders retrieved successfully');
//     } catch (error) {
//       logger.error(`Get user orders error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to retrieve orders', 500);
//     }
//   },
  
//   // Get order by ID
//   getOrderById: async (req: AuthenticatedRequest<OrderIdParams>, res: Response): Promise<void> => {
//     try {
//       const { id: orderId } = req.params;
      
//       const order = await Order.findById(orderId)
//         .populate({
//           path: 'items.product',
//           select: 'name slug featuredImage category'
//         })
//         .populate('user', 'email firstName lastName');
      
//       if (!order) {
//         sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
//         return;
//       }
      
//       // Verify user has access to this order
//       if (
//         order.user._id.toString() !== req.user._id.toString() && 
//         req.user.role !== 'admin'
//       ) {
//         sendError(res, 'Not authorized to access this order', 403, ErrorCodes.FORBIDDEN);
//         return;
//       }
      
//       sendSuccess(res, { order: order.toObject() }, 'Order retrieved successfully');
//     } catch (error) {
//       logger.error(`Get order by ID error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to retrieve order', 500);
//     }
//   },
  
//   // Admin: Get all orders
//   getAllOrders: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//       const { page = 1, limit = 10, status } = req.query as unknown as OrdersQueryParams;
//       const skip = (Number(page) - 1) * Number(limit);
      
//       // Build query
//       const query: Record<string, any> = {};
//       if (status) {
//         query.status = status;
//       }
      
//       const orders = await Order.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit))
//         .populate('user', 'email firstName lastName')
//         .populate({
//           path: 'items.product',
//           select: 'name slug featuredImage category'
//         });
      
//       const total = await Order.countDocuments(query);
      
//       sendSuccess(res, {
//         orders: orders.map(order => order.toObject()),
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           pages: Math.ceil(total / Number(limit))
//         }
//       }, 'Orders retrieved successfully');
//     } catch (error) {
//       logger.error(`Get all orders error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to retrieve orders', 500);
//     }
//   },
  
//   // Admin: Update order status
//   updateOrderStatus: async (req: AuthenticatedRequest<OrderIdParams, {}, OrderStatusRequest>, res: Response): Promise<void> => {
//     try {
//       const { id: orderId } = req.params;
//       const { status, trackingNumber, trackingUrl, estimatedDelivery } = req.body;
      
//       const order = await Order.findById(orderId);
      
//       if (!order) {
//         sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
//         return;
//       }
      
//       const currentStatus = order.status;
      
//       // Validate status transition
//       if (!isValidStatusTransition(currentStatus, status as OrderStatus)) {
//         sendError(res, `Invalid status transition from ${currentStatus} to ${status}`, 400, ErrorCodes.BAD_REQUEST);
//         return;
//       }
      
//       // Prepare update object
//       const updateData: Partial<OrderDocument> = {
//         status: status as OrderStatus
//       };
      
//       // Handle specific status changes
//       switch (status) {
//         case OrderStatus.SHIPPED:
//           updateData['shipping.trackingNumber'] = trackingNumber;
//           updateData['shipping.trackingUrl'] = trackingUrl;
//           updateData['shipping.estimatedDelivery'] = estimatedDelivery;
//           break;
        
//         case OrderStatus.CANCELLED:
//           // Return items to inventory if cancelled
//           for (const item of order.items) {
//             const productId = typeof item.product === 'string' ? item.product : item.product.toString();
//             const variantId = item.variant ? (typeof item.variant === 'string' ? item.variant : item.variant.toString()) : null;
            
//             const product = await Product.findById(productId);
            
//             if (product) {
//               if (variantId) {
//                 // Update variant inventory
//                 const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
                
//                 if (variantIndex !== -1) {
//                   product.variants[variantIndex].inventory += item.quantity;
//                   await product.save();
//                 }
//               } else {
//                 // Update default variant inventory
//                 const defaultVariant = product.variants.find(v => v.isDefault);
//                 if (defaultVariant) {
//                   const variantIndex = product.variants.findIndex(v => v.isDefault);
//                   product.variants[variantIndex].inventory += item.quantity;
//                   await product.save();
//                 }
//               }
              
//               // Record inventory activity
//               const activity = new InventoryActivity({
//                 product: product._id,
//                 variant: variantId,
//                 type: 'in',
//                 quantity: item.quantity,
//                 reason: 'order_cancelled',
//                 reference: order._id,
//                 performedBy: req.user._id
//               });
              
//               await activity.save();
//             }
//           }
          
//           // If payment was completed, mark for refund
//           if (order.payment.status === PaymentStatus.COMPLETED) {
//             updateData['payment.status'] = PaymentStatus.REFUNDED;
//           }
//           break;
          
//         case OrderStatus.DELIVERED:
//           // If COD, mark payment as completed
//           if (order.payment.method === PaymentMethod.CASH_ON_DELIVERY) {
//             updateData['payment.status'] = PaymentStatus.COMPLETED;
//           }
//           break;
//       }
      
//       // Update order
//       const updatedOrder = await Order.findByIdAndUpdate(
//         orderId,
//         { $set: updateData },
//         { new: true }
//       ).populate('user', 'email firstName lastName');
      
//       sendSuccess(res, { order: updatedOrder?.toObject() }, 'Order status updated successfully');
//     } catch (error) {
//       logger.error(`Update order status error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to update order status', 500);
//     }
//   },
  
//   // Admin: Generate invoice for an order
//   generateInvoice: async (req: AuthenticatedRequest<OrderIdParams>, res: Response): Promise<void> => {
//     try {
//       const { id: orderId } = req.params;
      
//       const order = await Order.findById(orderId)
//         .populate({
//           path: 'items.product',
//           select: 'name slug category'
//         })
//         .populate('user', 'email firstName lastName');
      
//       if (!order) {
//         sendError(res, 'Order not found', 404, ErrorCodes.NOT_FOUND);
//         return;
//       }
      
//       // Generate invoice URL using order number
//       const invoiceUrl = `/invoices/${order.orderNumber}.pdf`;
      
//       // Update order with invoice URL
//       const updatedOrder = await Order.findByIdAndUpdate(
//         orderId,
//         { $set: { invoiceUrl } },
//         { new: true }
//       );
      
//       sendSuccess(res, { 
//         order: updatedOrder?.toObject(),
//         invoiceUrl
//       }, 'Invoice generated successfully');
//     } catch (error) {
//       logger.error(`Generate invoice error: ${error instanceof Error ? error.message : String(error)}`);
//       sendError(res, 'Failed to generate invoice', 500);
//     }
//   }
// };

// // Helper function to validate order status transitions
// function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
//   // Define valid transitions
//   const validTransitions: Record<OrderStatus, OrderStatus[]> = {
//     [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
//     [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
//     [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
//     [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
//     [OrderStatus.CANCELLED]: [],
//     [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
//     [OrderStatus.REFUNDED]: []
//   };
  
//   return validTransitions[currentStatus]?.includes(newStatus) || false;
// }