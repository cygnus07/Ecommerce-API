// import Order from '../models/Order.model.js'
// import { customAlphabet } from 'nanoid';

// // Create a custom nanoid generator with only uppercase letters and numbers
// // Avoiding similar-looking characters like 0/O and 1/I
// const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

// /**
//  * Generates a unique order number
//  * Format: ORD-{YEAR}-{RANDOM_STRING}
//  * Example: ORD-2025-X7YH2P9KL4
//  */
// export const generateOrderNumber = async (): Promise<string> => {
//   const year = new Date().getFullYear();
//   let isUnique = false;
//   let orderNumber = '';
  
//   // Keep generating until we find a unique one
//   while (!isUnique) {
//     orderNumber = `ORD-${year}-${nanoid()}`;
    
//     // Check if this order number already exists
//     const existingOrder = await Order.findOne({ orderNumber });
    
//     if (!existingOrder) {
//       isUnique = true;
//     }
//   }
  
//   return orderNumber;
// };

// /**
//  * Calculates applicable discount for an order
//  * @param subtotal The order subtotal before discounts
//  * @param couponCode Optional coupon code
//  * @returns Discount amount and details
//  */
// export const calculateDiscount = async (
//   subtotal: number, 
//   couponCode?: string | null
// ): Promise<{
//   amount: number;
//   details?: {
//     code: string;
//     amount: number;
//     type: 'percentage' | 'fixed';
//   };
// }> => {
//   if (!couponCode) {
//     return { amount: 0 };
//   }
  
//   // TODO: Implement coupon validation and discount calculation
//   // This would require fetching the coupon from database and applying rules
  
//   return {
//     amount: 0,
//     details: {
//       code: couponCode,
//       amount: 0,
//       type: 'percentage'
//     }
//   };
// };