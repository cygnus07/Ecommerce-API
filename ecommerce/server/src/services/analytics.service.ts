// // src/services/analytics.service.ts
// import { Product } from '../models/product.model.js';
// import { Order } from '../models/order.model.js';
// import { User } from '../models/user.model.js';
// import { Category } from '../models/category.model.js';
// import { logger } from '../utils/logger.js';

// export const analyticsService = {
//   /**
//    * Get sales analytics
//    */
//   getSalesAnalytics: async (startDate: Date, endDate: Date) => {
//     try {
//       // Get all orders within the date range
//       const orders = await Order.find({
//         createdAt: { $gte: startDate, $lte: endDate },
//         status: { $in: ['completed', 'delivered'] }
//       });
      
//       // Calculate total sales
//       const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
//       // Calculate daily sales
//       const dailySales = {};
//       orders.forEach(order => {
//         const dateStr = order.createdAt.toISOString().split('T')[0];
//         dailySales[dateStr] = (dailySales[dateStr] || 0) + order.totalAmount;
//       });
      
//       // Get top selling products
//       const productSales = {};
//       orders.forEach(order => {
//         order.items.forEach(item => {
//           const productId = item.product.toString();
//           productSales[productId] = (productSales[productId] || 0) + item.quantity;
//         });
//       });
      
//       const topSellingProducts = await Promise.all(
//         Object.entries(productSales)
//           .sort((a, b) => b[1] - a[1])
//           .slice(0, 5)
//           .map(async ([productId, quantity]) => {
//             const product = await Product.findById(productId).select('name price images');
//             return {
//               product,
//               quantitySold: quantity
//             };
//           })
//       );
      
//       return {
//         totalSales,
//         orderCount: orders.length,
//         averageOrderValue: orders.length ? totalSales / orders.length : 0,
//         dailySales: Object.entries(dailySales).map(([date, amount]) => ({ date, amount })),
//         topSellingProducts
//       };
//     } catch (err) {
//       logger.error(`Error getting sales analytics: ${err.message}`);
//       throw err;
//     }
//   },
  
//   /**
//    * Get product analytics
//    */
//   getProductAnalytics: async () => {
//     try {
//       // Get total product count
//       const totalProducts = await Product.countDocuments();
      
//       // Get products by category
//       const productsByCategory = await Category.aggregate([
//         {
//           $lookup: {
//             from: 'products',
//             localField: '_id',
//             foreignField: 'category',
//             as: 'products'
//           }
//         },
//         {
//           $project: {
//             _id: 1,
//             name: 1,
//             productCount: { $size: '$products' }
//           }
//         },
//         {
//           $sort: { productCount: -1 }
//         }
//       ]);
      
//       // Get low stock products
//       const lowStockProducts = await Product.find({
//         stockQuantity: { $lt: 10 },
//         stockQuantity: { $gt: 0 }
//       }).select('name stockQuantity price');
      
//       // Get out of stock products
//       const outOfStockProducts = await Product.find({
//         stockQuantity: 0
//       }).select('name price');
      
//       return {
//         totalProducts,
//         productsByCategory,
//         lowStockProducts,
//         outOfStockProducts,
//         outOfStockCount: outOfStockProducts.length,
//         lowStockCount: lowStockProducts.length
//       };
//     } catch (err) {
//       logger.error(`Error getting product analytics: ${err.message}`);
//       throw err;
//     }
//   },
  
//   /**
//    * Get user analytics
//    */
//   getUserAnalytics: async () => {
//     try {
//       // Get total user count
//       const totalUsers = await User.countDocuments();
      
//       // Get new users in last 30 days
//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
//       const newUsers = await User.countDocuments({
//         createdAt: { $gte: thirtyDaysAgo }
//       });
      
//       // Get users with orders
//       const usersWithOrders = await Order.distinct('user');
      
//       // Get top customers
//       const topCustomers = await Order.aggregate([
//         {
//           $group: {
//             _id: '$user',
//             totalSpent: { $sum: '$totalAmount' },
//             orderCount: { $sum: 1 }
//           }
//         },
//         {
//           $sort: { totalSpent: -1 }
//         },
//         {
//           $limit: 5
//         },
//         {
//           $lookup: {
//             from: 'users',
//             localField: '_id',
//             foreignField: '_id',
//             as: 'userDetails'
//           }
//         },
//         {
//           $unwind: '$userDetails'
//         },
//         {
//           $project: {
//             _id: 1,
//             name: '$userDetails.name',
//             email: '$userDetails.email',
//             totalSpent: 1,
//             orderCount: 1
//           }
//         }
//       ]);
      
//       return {
//         totalUsers,
//         newUsers,
//         usersWithOrdersCount: usersWithOrders.length,
//         conversionRate: totalUsers > 0 ? (usersWithOrders.length / totalUsers) * 100 : 0,
//         topCustomers
//       };
//     } catch (err) {
//       logger.error(`Error getting user analytics: ${err.message}`);
//       throw err;
//     }
//   }
// };