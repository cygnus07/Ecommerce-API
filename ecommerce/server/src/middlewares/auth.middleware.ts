import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { ErrorCodes } from '../utils/apiResponse.js';
import User from '../models/User.model.js';
import { logger } from '../utils/logger.js';
import BlacklistedToken from '../models/BlacklistedToken.model.js';
import { AuthenticatedRequest, AuthUser } from '../types/user.types.js';


// Add a proper type declaration to extend Express.Request
declare global {
  namespace Express {
    interface User extends AuthUser {} // Make Express.User compatible with AuthUser
    
    interface Request {
      token?: string;
    }
  }
}


export const withAuth = <T extends Request>(
  handler: (req: T & AuthenticatedRequest, res: Response, next?: NextFunction) => Promise<void> | void
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as T & AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Main authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      (error as any).statusCode = 401;
      (error as any).code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    const user = await User.findById(decoded.userId);

    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      throw new Error('Token revoked');
    }
    
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 401;
      (error as any).code = ErrorCodes.UNAUTHORIZED;
      throw error;
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    next(error);
  }
};

// Authorization middleware
const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = new Error('Authentication required');
      (error as any).statusCode = 401;
      (error as any).code = ErrorCodes.UNAUTHORIZED;
      return next(error);
    }
    
    if (!roles.includes(req.user.role)) {
      const error = new Error('Not authorized to access this resource');
      (error as any).statusCode = 403;
      (error as any).code = ErrorCodes.FORBIDDEN;
      return next(error);
    }
    
    next();
  };
};

// Combined auth object
export const auth = {
  authenticate,
  authorize,
  // Common role-based middleware combinations
  admin: [authenticate, authorize('admin')],
  user: [authenticate, authorize('user')],
};

// Also export individual functions if needed elsewhere
export { authenticate, authorize };