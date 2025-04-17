// src/services/search.service.ts
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { logger } from '../utils/logger.js';

export const searchService = {
  /**
   * Search products
   */
  searchProducts: async (
    query: string,
    filters: any = {},
    sortBy: string = 'createdAt',
    sortOrder: number = -1,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const skip = (page - 1) * limit;
      
      // Build search criteria
      const searchCriteria: any = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
      
      // Add filters
      if (filters.category) {
        searchCriteria.category = filters.category;
      }
      
      if (filters.priceMin || filters.priceMax) {
        searchCriteria.price = {};
        if (filters.priceMin) searchCriteria.price.$gte = filters.priceMin;
        if (filters.priceMax) searchCriteria.price.$lte = filters.priceMax;
      }
      
      if (filters.inStock) {
        searchCriteria.stockQuantity = { $gt: 0 };
      }
      
      // Sort options
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder;
      
      // Execute search
      const products = await Product.find(searchCriteria)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await Product.countDocuments(searchCriteria);
      
      return {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      logger.error(`Error searching products: ${err.message}`);
      throw err;
    }
  },
  
  /**
   * Get product suggestions
   */
  getProductSuggestions: async (query: string, limit: number = 5) => {
    try {
      // Simple product name suggestions
      const productSuggestions = await Product.find({
        name: { $regex: query, $options: 'i' }
      })
        .select('name images price')
        .limit(limit);
      
      // Category suggestions
      const categorySuggestions = await Category.find({
        name: { $regex: query, $options: 'i' }
      })
        .select('name')
        .limit(limit);
      
      return {
        products: productSuggestions,
        categories: categorySuggestions
      };
    } catch (err) {
      logger.error(`Error getting product suggestions: ${err.message}`);
      throw err;
    }
  }
};