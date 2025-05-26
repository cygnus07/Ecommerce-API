import { env } from './environment.js';

export const config = {
  // Server configuration
  server: {
    env: env.NODE_ENV,
    port: env.PORT,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },

  // Database configuration
  database: {
    uri: env.NODE_ENV === 'test' ? env.MONGODB_URI_TEST : env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: env.NODE_ENV !== 'production', // Auto-create indexes in dev/test
    },
  },

  // JWT configuration
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRATION,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRATION,
  },

  // AWS S3 configuration
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3BucketName: env.AWS_BUCKET_NAME,
  },

  // File upload configuration
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  },

  // Email configuration
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    user: env.EMAIL_USER,
    password: env.EMAIL_PASS,
    from: env.EMAIL_FROM,
  },

  // Stripe configuration
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // Paths
  paths: {
    rootDir: env.ROOT_DIR,
  },
};