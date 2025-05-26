import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '../utils/apiResponse.js';

export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists on request (from auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      // Check if user has the required permission
      if (req.user.role !== requiredPermission) {
        return res.status(403).json({
          success: false,
          code: ErrorCodes.FORBIDDEN,
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};