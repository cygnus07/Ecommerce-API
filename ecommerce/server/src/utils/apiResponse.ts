import { Response } from 'express';

/**
 * Standard API Response Format
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response, 
  data?: T, 
  message = 'Success', 
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message
  };
  
  if (data !== undefined) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  errorCode = 'INTERNAL_SERVER_ERROR',
  details?: any
): Response => {
  const response: ApiResponse<undefined> = {
    success: false,
    message,
    error: {
      code: errorCode
    }
  };
  
  if (details) {
    response.error!.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Common API Error codes
 */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY'
};