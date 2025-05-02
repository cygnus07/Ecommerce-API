import { Request, Response, NextFunction } from 'express';
import { sendError, ErrorCodes } from '../utils/apiResponse.js';

/**
 * Role-based authorization middleware
 * @param allowedRoles Array of roles allowed to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assuming req.user is set by the auth middleware
    if (!req.user) {
      return sendError(
        res, 
        'Authentication required', 
        ErrorCodes.UNAUTHORIZED
      );
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res, 
        'You do not have permission to perform this action', 
        ErrorCodes.FORBIDDEN
      );
    }

    next();
  };
};