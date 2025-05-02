// import { Request, Response } from 'express';
// import  Coupon  from '../models/Coupon.model.js';
// import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
// import { logger } from '../utils/logger.js';

// export const couponController = {
//   /**
//    * Create a new coupon
//    */
//   createCoupon: async (req: Request, res: Response) => {
//     try {
//       const {
//         code,
//         discountType,
//         discountValue,
//         minPurchaseAmount,
//         maxDiscountAmount,
//         startDate,
//         endDate,
//         usageLimit,
//         products,
//         categories,
//         isActive
//       } = req.body;

//       // Check if coupon code already exists
//       const existingCoupon = await Coupon.findOne({ code });
//       if (existingCoupon) {
//         return sendError(
//           res, 
//           'Coupon code already exists', 
//           ErrorCodes.CONFLICT
//         );
//       }

//       const newCoupon = await Coupon.create({
//         code: code.toUpperCase(),
//         discountType,
//         discountValue,
//         minPurchaseAmount,
//         maxDiscountAmount,
//         startDate,
//         endDate,
//         usageLimit,
//         products,
//         categories,
//         isActive: isActive !== undefined ? isActive : true,
//         createdBy: req.user.id
//       });

//       return sendSuccess(res, newCoupon, 'Coupon created successfully', 201);
//     } catch (err) {
//       logger.error(`Error creating coupon: ${err.message}`);
//       return sendError(res, 'Failed to create coupon');
//     }
//   },

//   /**
//    * Get all coupons (admin)
//    */
//   getAllCoupons: async (req: Request, res: Response) => {
//     try {
//       const coupons = await Coupon.find()
//         .populate('createdBy', 'name email')
//         .populate('products', 'name price')
//         .populate('categories', 'name')
//         .sort({ createdAt: -1 });

//       return sendSuccess(res, coupons, 'Coupons retrieved successfully');
//     } catch (err) {
//       logger.error(`Error getting all coupons: ${err.message}`);
//       return sendError(res, 'Failed to get coupons');
//     }
//   },

//   /**
//    * Get active coupons (public)
//    */
//   getActiveCoupons: async (req: Request, res: Response) => {
//     try {
//       const now = new Date();
//       const coupons = await Coupon.find({
//         isActive: true,
//         startDate: { $lte: now },
//         endDate: { $gte: now }
//       })
//         .select('-usedBy -createdBy')
//         .populate('products', 'name price')
//         .populate('categories', 'name')
//         .sort({ createdAt: -1 });

//       return sendSuccess(res, coupons, 'Active coupons retrieved successfully');
//     } catch (err) {
//       logger.error(`Error getting active coupons: ${err.message}`);
//       return sendError(res, 'Failed to get active coupons');
//     }
//   },

//   /**
//    * Get coupon by ID
//    */
//   getCouponById: async (req: Request, res: Response) => {
//     try {
//       const { couponId } = req.params;
      
//       const coupon = await Coupon.findById(couponId)
//         .populate('createdBy', 'name email')
//         .populate('products', 'name price')
//         .populate('categories', 'name')
//         .populate('usedBy', 'name email');

//       if (!coupon) {
//         return sendError(res, 'Coupon not found', 404, ErrorCodes.NOT_FOUND);
//       }

//       return sendSuccess(res, coupon, 'Coupon retrieved successfully');
//     } catch (err) {
//       logger.error(`Error getting coupon: ${err.message}`);
//       return sendError(res, 'Failed to get coupon');
//     }
//   },

//   /**
//    * Validate coupon code
//    */
//   validateCoupon: async (req: Request, res: Response) => {
//     try {
//       const { code, cartTotal } = req.body;
//       const userId = req.user.id;
      
//       if (!code) {
//         return sendError(res, 'Coupon code is required', 400, ErrorCodes.BAD_REQUEST);
//       }

//       const now = new Date();
//       const coupon = await Coupon.findOne({
//         code: code.toUpperCase(),
//         isActive: true,
//         startDate: { $lte: now },
//         endDate: { $gte: now }
//       });

//       if (!coupon) {
//         return sendError(res, 'Invalid or expired coupon', 400, ErrorCodes.BAD_REQUEST);
//       }

//       // Check if user has already used this coupon
//       if (coupon.usedBy && coupon.usedBy.includes(userId)) {
//         return sendError(res, 'You have already used this coupon', 400, ErrorCodes.BAD_REQUEST);
//       }

//       // Check usage limit
//       if (coupon.usageLimit && coupon.usedBy && coupon.usedBy.length >= coupon.usageLimit) {
//         return sendError(res, 'Coupon usage limit reached', 400, ErrorCodes.BAD_REQUEST);
//       }

//       // Check minimum purchase amount
//       if (coupon.minPurchaseAmount > 0 && cartTotal < coupon.minPurchaseAmount) {
//         return sendError(
//           res, 
//           `Minimum purchase amount for this coupon is ${coupon.minPurchaseAmount}`, 
//           400, 
//           ErrorCodes.BAD_REQUEST
//         );
//       }

//       // Calculate discount
//       let discountAmount = 0;
//       if (coupon.discountType === 'percentage') {
//         discountAmount = (cartTotal * coupon.discountValue) / 100;
//         if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
//           discountAmount = coupon.maxDiscountAmount;
//         }
//       } else {
//         discountAmount = coupon.discountValue;
//       }

//       return sendSuccess(res, {
//         valid: true,
//         coupon: {
//           id: coupon._id,
//           code: coupon.code,
//           discountType: coupon.discountType,
//           discountValue: coupon.discountValue,
//           discountAmount
//         }
//       }, 'Coupon is valid');
//     } catch (err) {
//       logger.error(`Error validating coupon: ${err.message}`);
//       return sendError(res, 'Failed to validate coupon');
//     }
//   },

//   /**
//    * Update a coupon
//    */
//   updateCoupon: async (req: Request, res: Response) => {
//     try {
//       const { couponId } = req.params;
//       const updateData = req.body;

//       // If code is being updated, make sure it's uppercase
//       if (updateData.code) {
//         updateData.code = updateData.code.toUpperCase();
        
//         // Check if the new code already exists
//         const existingCoupon = await Coupon.findOne({ 
//           code: updateData.code,
//           _id: { $ne: couponId }
//         });
        
//         if (existingCoupon) {
//           return sendError(
//             res, 
//             'Coupon code already exists', 
//             409, 
//             ErrorCodes.CONFLICT
//           );
//         }
//       }

//       const coupon = await Coupon.findByIdAndUpdate(
//         couponId,
//         updateData,
//         { new: true }
//       )
//         .populate('createdBy', 'name email')
//         .populate('products', 'name price')
//         .populate('categories', 'name');

//       if (!coupon) {
//         return sendError(res, 'Coupon not found', 404, ErrorCodes.NOT_FOUND);
//       }

//       return sendSuccess(res, coupon, 'Coupon updated successfully');
//     } catch (err) {
//       logger.error(`Error updating coupon: ${err.message}`);
//       return sendError(res, 'Failed to update coupon');
//     }
//   },

//   /**
//    * Delete a coupon
//    */
//   deleteCoupon: async (req: Request, res: Response) => {
//     try {
//       const { couponId } = req.params;
      
//       const coupon = await Coupon.findByIdAndDelete(couponId);
      
//       if (!coupon) {
//         return sendError(res, 'Coupon not found', 404, ErrorCodes.NOT_FOUND);
//       }

//       return sendSuccess(res, null, 'Coupon deleted successfully');
//     } catch (err) {
//       logger.error(`Error deleting coupon: ${err.message}`);
//       return sendError(res, 'Failed to delete coupon');
//     }
//   }
// };