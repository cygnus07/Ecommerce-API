import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to standardize pagination parameters
 */
export const paginate = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Add pagination parameters to the request
  req.pagination = {
    page: page < 1 ? 1 : page,
    limit: limit > 100 ? 100 : (limit < 1 ? 10 : limit), // Limit between 1-100, default 10
    skip: (page - 1) * limit
  };
  
  next();
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}