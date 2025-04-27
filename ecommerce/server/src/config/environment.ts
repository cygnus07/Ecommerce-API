import dotenv from 'dotenv';
import { get } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

export const env = {
  // Server
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVariable('PORT', '5000'), 10),
  
  // MongoDB
  MONGODB_URI: getEnvVariable('MONGODB_URI', 'mongodb://localhost:27017/ecommerce'),
  MONGODB_URI_TEST: getEnvVariable('MONGODB_URI_TEST', 'mongodb://localhost:27017/ecommerce_test'),
  
  // JWT
  JWT_SECRET: getEnvVariable('JWT_SECRET'),
  JWT_REFRESH_SECRET: getEnvVariable('JWT_REFRESH_SECRET'),
  JWT_EXPIRATION: getEnvVariable('JWT_EXPIRATION', '6d'),
  JWT_REFRESH_EXPIRATION: getEnvVariable('JWT_REFRESH_EXPIRATION', '7d'),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: getEnvVariable('AWS_ACCESS_KEY_ID', ''),
  AWS_SECRET_ACCESS_KEY: getEnvVariable('AWS_SECRET_ACCESS_KEY', ''),
  AWS_BUCKET_NAME: getEnvVariable('AWS_BUCKET_NAME', ''),
  AWS_REGION: getEnvVariable('AWS_REGION', ''),
  
  // Stripe
  STRIPE_SECRET_KEY: getEnvVariable('STRIPE_SECRET_KEY', ''),
  STRIPE_WEBHOOK_SECRET: getEnvVariable('STRIPE_WEBHOOK_SECRET', ''),
  
  // Email
  EMAIL_HOST: getEnvVariable('EMAIL_HOST', ''),
  EMAIL_PORT: parseInt(getEnvVariable('EMAIL_PORT', '587'), 10),
  EMAIL_USER: getEnvVariable('EMAIL_USER', ''),
  EMAIL_PASS: getEnvVariable('EMAIL_PASS', ''),
  EMAIL_FROM: getEnvVariable('EMAIL_FROM', ''),
  EMAIL_SECURE: getEnvVariable('EMAIL_SECURE', 'false') === 'true',

  FRONTEND_URL: getEnvVariable('FRONTEND_URL', 'http://www.greykiwi.com'),
  APP_NAME: getEnvVariable('APP_NAME', 'Shop AI'),


  

GOOGLE_CLIENT_ID: getEnvVariable('GOOGLE_CLIENT_ID', ''),
GOOGLE_CLIENT_SECRET: getEnvVariable('GOOGLE_CLIENT_SECRET', ''),
FACEBOOK_APP_ID: getEnvVariable('FACEBOOK_APP_ID', ''),
FACEBOOK_APP_SECRET: getEnvVariable('FACEBOOK_APP_SECRET', ''),
API_BASE_URL: getEnvVariable('API_BASE_URL', 'http://localhost:5000'),
  SESSION_SECRET: getEnvVariable('SESSION_SECRET', ''),
  CLIENT_URL: getEnvVariable('CLIENT_URL', 'http://localhost:5000'),
  
  // Paths
  ROOT_DIR: rootDir,
};