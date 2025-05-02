import { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { SearchProductsQuery, SearchSuggestionsQuery } from '../types/search.types.js'
import { AuthenticatedRequest } from '../types/user.types.js';


interface RequestWithPagination extends AuthenticatedRequest {
  pagination: {
    page: number;
    limit: number;
    skip: number;
  };
}

export const searchController = {
  /**
   * Search for products with filtering, sorting and pagination
   */
  searchProducts: async (req: RequestWithPagination, res: Response): Promise<void> => {
    try {
      const { q, category, priceMin, priceMax, inStock, sortBy, sortOrder } = req.query as unknown as SearchProductsQuery;
      const { page, limit } = req.pagination;
      
      // Parse filters
      const filters = {
        category,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        inStock: inStock === 'true'
      };
      
      // Parse sort options
      const sort = sortBy || 'createdAt';
      const order = sortOrder === 'asc' ? 1 : -1;
      
      const results = await searchService.searchProducts(
        q,
        filters,
        sort,
        order,
        page,
        limit
      );
      
      sendSuccess(res, results, 'Search results retrieved successfully');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in search products controller: ${errorMessage}`);
      sendError(res, 'Failed to search products');
    }
  },

  /**
   * Get search suggestions based on partial query
   */
  getSearchSuggestions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit = 5 } = req.query as unknown as SearchSuggestionsQuery;
      
      const suggestions = await searchService.getProductSuggestions(
        q,
        Number(limit)
      );
      
      sendSuccess(res, suggestions, 'Search suggestions retrieved successfully');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in search suggestions controller: ${errorMessage}`);
      sendError(res, 'Failed to get search suggestions');
    }
  }
};