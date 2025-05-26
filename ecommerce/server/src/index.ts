import { startServer } from './server.js';
import { logger } from './utils/logger.js';

// Start the server
startServer().catch((error) => {
  logger.error(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});