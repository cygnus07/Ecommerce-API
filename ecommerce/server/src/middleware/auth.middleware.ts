import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import { sendError, ErrorCodes } from '../utils/apiResponse.js';
import  User  from '../models/User.model.js';
import { logger } from '../utils/logger.js';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required', 401, ErrorCodes.UNAUTHORIZED);
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      sendError(res, 'Authentication required', 401, ErrorCodes.UNAUTHORIZED);
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      sendError(res, 'User not found', 401, ErrorCodes.UNAUTHORIZED);
      return;
    }
    
    // Add user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    sendError(res, 'Authentication failed', 401, ErrorCodes.UNAUTHORIZED);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }
    
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Not authorized to access this resource', 403, ErrorCodes.FORBIDDEN);
    }
    
    next();
  };
};