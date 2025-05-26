import express from 'express';
import { searchController } from '../controllers/search.controller.js';
import { paginate } from '../middlewares/pagination.middleware.js';
import { validateSearchQuery, validateSuggestionsQuery } from '../validators/search.validator.js'
import { withAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /search/products
 * @desc Search for products with filters, sorting and pagination
 */
router.get(
  '/products', 
  paginate, 
  validateSearchQuery, 
  withAuth(searchController.searchProducts)
);

/**
 * @route GET /search/suggestions
 * @desc Get autocomplete suggestions for product search
 */
router.get(
  '/suggestions', 
  validateSuggestionsQuery,
  searchController.getSearchSuggestions
);

export default router;