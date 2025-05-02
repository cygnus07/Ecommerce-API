  import express, { Express, Request, Response, NextFunction } from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import morgan from 'morgan';
  import { rateLimit } from 'express-rate-limit';
  import { env } from './config/environment.js';
  import { APP_CONSTANTS } from './config/constants.js';
  import { logger } from './utils/logger.js';
  import { sendError, ErrorCodes } from './utils/apiResponse.js';
  import router from './routes/index.js'


  import passport from './config/passport.js';
  import session from 'express-session';

  /**
   * Express application setup
   */
  export const createApp = (): Express => {
    const app: Express = express();
    
    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Security middleware
    app.use(helmet());
    app.use(cors());


    app.use(session({
      secret: env.SESSION_SECRET || 'keyboard cat', // A random string
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.NODE_ENV === 'production', // use secure cookies in production
        httpOnly: true, // more security
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    
    // Apply rate limiting
    const limiter = rateLimit({
      windowMs: APP_CONSTANTS.RATE_LIMIT.WINDOW_MS,
      max: APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
    
    // Request logging
    if (env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    }
    
    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV
      });
    });
    
    // API routes will be added here
    // Example: app.use('/api/auth', authRoutes);
    app.use('/api/v1', router)
    
    // Base route
    app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'E-commerce API',
        version: '1.0.0'
      });
    });
    
    // 404 handler
    app.use((req: Request, res: Response) => {
      sendError(res, 'Resource not found', ErrorCodes.NOT_FOUND);
    });
    
    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Unhandled error: ${err.message}`);
      logger.error(err.stack || '');
      
      sendError(
        res,
        'Internal Server Error',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
      );
    });






  app.use(session({
    secret: env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: env.NODE_ENV === 'production' }
  }));


    
    return app;
  };