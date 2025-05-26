import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

/**
 * Validate search products request query parameters
 */
export const validateSearchQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { q } = req.query;
  
  if (!q) {
     sendError(res, 'Search query is required', 400);
     return
  }
  
  // Validate price ranges if provided
  const { priceMin, priceMax } = req.query;
  
  if (priceMin && isNaN(Number(priceMin))) {
     sendError(res, 'Minimum price must be a number', 400);
     return
  }
  
  if (priceMax && isNaN(Number(priceMax))) {
     sendError(res, 'Maximum price must be a number', 400);
     return
  }
  
  if (priceMin && priceMax && Number(priceMin) > Number(priceMax)) {
     sendError(res, 'Minimum price cannot be greater than maximum price', 400);
     return
  }
  
  next();
};

/**
 * Validate search suggestions request query parameters
 */
export const validateSuggestionsQuery = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
  const { q, limit } = req.query;
  
  if (!q) {
    sendError(res, 'Search query is required', 400);
    return
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1)) {
    sendError(res, 'Limit must be a positive number', 400);
    return
  }
  
  next();
};