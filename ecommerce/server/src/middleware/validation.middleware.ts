import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError, ErrorCodes } from '../utils/apiResponse.js';

/**
 * Middleware to validate request data using express-validator
 * @param validations Array of validation chains from express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        'Validation error',
        400,
        ErrorCodes.VALIDATION_ERROR,
        errors.array()
      );
    }
    
    next();
  };
};