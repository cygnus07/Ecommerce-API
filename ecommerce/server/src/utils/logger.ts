import { env } from '../config/environment.js';

/**
 * Simple logger utility for consistent logging format
 */
export const logger = {
  info: (message: string): void => {
    if (env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
  },
  
  warn: (message: string): void => {
    if (env.NODE_ENV !== 'test') {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
  },
  
  error: (message: string): void => {
    if (env.NODE_ENV !== 'test') {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    }
  },
  
  debug: (message: string): void => {
    if (env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
};