import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { sendError, ErrorCodes } from '../utils/apiResponse.js';

export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
       next();
    } catch (error: any) {
      const errorMessage = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
      sendError(res, errorMessage, ErrorCodes.BAD_REQUEST);
    }
  };

// Helper functions for specific parts of the request
export const validateBody = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      const errorMessage = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
      sendError(res, errorMessage, ErrorCodes.BAD_REQUEST);
    }
  };

export const validateParams = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error: any) {
      const errorMessage = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
      sendError(res, errorMessage, ErrorCodes.BAD_REQUEST);
    }
  };

export const validateQuery = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
       next();
    } catch (error: any) {
      const errorMessage = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
       sendError(res, errorMessage, ErrorCodes.BAD_REQUEST);
    }
  };