// import { z } from 'zod';

// // Common validation patterns
// const addressPattern = /^[a-zA-Z0-9\s\.,'-]{5,100}$/;
// const couponPattern = /^[A-Z0-9]{5,15}$/;

// export const createOrderSchema = z.object({
//   shippingAddress: z.object({
//     street: z.string().regex(addressPattern, {
//       message: 'Street must be 5-100 alphanumeric characters'
//     }).nonempty('Street is required'),
//     city: z.string().regex(/^[a-zA-Z\s-]{2,50}$/, {
//       message: 'City must be 2-50 letters and hyphens'
//     }).nonempty('City is required'),
//     state: z.string().regex(/^[a-zA-Z\s-]{2,50}$/, {
//       message: 'State must be 2-50 letters and hyphens'
//     }).nonempty('State is required'),
//     postalCode: z.string().regex(/^[0-9]{5,10}$/, {
//       message: 'Postal code must be 5-10 digits'
//     }).nonempty('Postal code is required'),
//     country: z.string().regex(/^[a-zA-Z\s-]{2,50}$/, {
//       message: 'Country must be 2-50 letters and hyphens'
//     }).nonempty('Country is required')
//   }).required({
//     message: 'Shipping address is required'
//   }),
//   paymentMethod: z.enum(['card', 'cash', 'bank']).default('card'),
//   couponCode: z.string().regex(couponPattern, {
//     message: 'Coupon code must be 5-15 uppercase alphanumeric characters'
//   }).optional().nullable()
// });

// export const confirmOrderSchema = z.object({
//   orderId: z.string().length(24).regex(/^[0-9a-fA-F]+$/, {
//     message: 'Order ID must be a valid hexadecimal'
//   }).nonempty('Order ID is required'),
//   paymentIntentId: z.string().optional().superRefine((val, ctx) => {
//     const paymentMethod = ctx.parent.paymentMethod;
//     if (paymentMethod === 'card' && !val) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: 'Payment intent ID is required for card payments'
//       });
//     }
//   })
// }).refine(data => data.paymentMethod !== 'card' || data.paymentIntentId, {
//   message: 'Payment intent ID is required for card payments',
//   path: ['paymentIntentId']
// });

// export const orderIdParamsSchema = z.object({
//   id: z.string().length(24).regex(/^[0-9a-fA-F]+$/, {
//     message: 'Order ID must be a valid hexadecimal'
//   }).nonempty('Order ID is required')
// });

// export const orderStatusSchema = z.object({
//   status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
//     required_error: "Status is required",
//     invalid_type_error: "Status must be one of: pending, confirmed, shipped, delivered, cancelled"
//   })
// });

// export const ordersQuerySchema = z.object({
//   page: z.number().int().min(1).default(1),
//   limit: z.number().int().min(1).max(100).default(10),
//   status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional()
// });