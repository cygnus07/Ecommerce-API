import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import aws from 'aws-sdk';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { env } from '../config/environment.js';
import { sendError, ErrorCodes } from '../utils/apiResponse.js';

// Configure AWS
aws.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION
});

const s3 = new aws.S3();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Create S3 upload middleware
export const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `products/${uuidv4()}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Handle multer errors
export const handleUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File size too large. Max 5MB allowed.', 400, ErrorCodes.BAD_REQUEST);
    }
    return sendError(res, err.message, 400, ErrorCodes.BAD_REQUEST);
  } else if (err) {
    // An unknown error occurred
    return sendError(res, err.message, 400, ErrorCodes.BAD_REQUEST);
  }
  next();
};