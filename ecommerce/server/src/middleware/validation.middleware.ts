import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { ErrorCodes } from '../utils/apiResponse.js';

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}

export const validate = <T extends z.ZodTypeAny>(schema: T): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate just the request body directly
      req.validatedData = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};