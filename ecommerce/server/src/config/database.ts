import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './environment.js';

/**
 * MongoDB Connection
 * Establishes connection to MongoDB database
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    
    logger.info(`MongoDB Connected: ${connection.connection.host}`);
    
    // Handle MongoDB connection events
    mongoose.connection.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`MongoDB Connection Error: ${errorMessage}`);
      // logger.error(`MongoDB Connection Error: ${error}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Disconnected');
    });
    
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1); // Exit with failure
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};