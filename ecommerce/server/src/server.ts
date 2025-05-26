// In your src/server.ts file, update the port configuration:

import { createApp } from './app.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';

/**
 * Server startup function 
 */
export const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Create Express app
    const app = createApp();
    
    // Get port from environment - IMPORTANT for Render
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Make sure to listen on 0.0.0.0 for Render
    const server = app.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on port ${port} (NODE_ENV: ${env.NODE_ENV})`);
      logger.info(`API available at http://localhost:${port}`);
    });
    
    // Handle unhandled rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      logger.error(err.stack || '');
      server.close(() => process.exit(1));
    });
    
    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
  } catch (error) {
    logger.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};