// src/routes/search.routes.ts
import express from 'express';
import { searchService } from '../services/search.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { paginate } from '../middleware/pagination.middleware.js';

const router = express.Router();

router.get('/products', paginate, async (req, res) => {
  try {
    const { q, category, priceMin, priceMax, inStock, sortBy, sortOrder } = req.query;
    const { page, limit } = req.pagination;
    
    // Validate required search query
    if (!q) {
      return sendError(res, 'Search query is required', 400);
    }
    
    // Parse filters
    const filters = {
      category: category as string,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      inStock: inStock === 'true'
    };
    
    // Parse sort options
    const sort = sortBy as string || 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    
    const results = await searchService.searchProducts(
      q as string,
      filters,
      sort,
      order,
      page,
      limit
    );
    
    return sendSuccess(res, results, 'Search results retrieved successfully');
  } catch (err) {
    logger.error(`Error in search products route: ${err.message}`);
    return sendError(res, 'Failed to search products');
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return sendError(res, 'Search query is required', 400);
    }
    
    const suggestions = await searchService.getProductSuggestions(
      q as string,
      Number(limit)
    );
    
    return sendSuccess(res, suggestions, 'Search suggestions retrieved successfully');
  } catch (err) {
    logger.error(`Error in search suggestions route: ${err.message}`);
    return sendError(res, 'Failed to get search suggestions');
  }
});

export default router;