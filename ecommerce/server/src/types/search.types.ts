/**
 * Type definitions for search-related objects
 */

// Request query parameters for product search
export interface SearchProductsQuery {
    q: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  // Request query parameters for search suggestions
  export interface SearchSuggestionsQuery {
    q: string;
    limit?: number;
  }
  
  // // Extend Express Request to include pagination
  // declare global {
  //   namespace Express {
  //     interface Request {
  //       pagination: {
  //         page: number;
  //         limit: number;
  //       };
  //     }
  //   }
  // }

  // Export the pagination type so it can be used elsewhere
export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}