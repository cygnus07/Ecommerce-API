import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { withRetry } from '../utils/helper.js';

import { 
  RegisterInput, 
  LoginInput, 
  RefreshTokenInput,
  UpdateProfileInput,
  ChangePasswordInput,
  AdminUpdateUserInput
} from '../validators/user.validator.js';


// Helper function to generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email
const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Keep this for simplicity
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true, // Keep debug logs for now
    });

    await transporter.sendMail({
      from: `"Shop AI" <${process.env.EMAIL_USER}>`, // Formalized format
      to,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`, // Keep HTML fallback
    });

    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error instanceof Error ? error.stack : error}`);
    throw error; // Re-throw for route handler
  }
};


export const userController = {
  // Register new user
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, password, role } = req.validatedData as RegisterInput;
      
      // 1. Check existing user (optimized query)
      if (await User.exists({ email })) {
        sendError(res, 'Email already in use', ErrorCodes.CONFLICT);
        return;
      }
      
      // 2. Create user with transaction for atomicity
      const session = await User.startSession();
      session.startTransaction();
      
      try {
        // 3. Generate and hash OTP
        const otp = generateOTP();
        const emailVerificationToken = crypto
          .createHash('sha256')
          .update(otp)
          .digest('hex');

        // 4. Create user
        const user = new User({
          firstName,
          lastName,
          email,
          password: await bcrypt.hash(password, 12), // Increased salt rounds
          emailVerified: false,
          emailVerificationToken,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
          role: role || 'customer'
        });

        await user.save({ session });

        // 5. Send email with retry logic
        const verificationText = `
          Hi ${firstName},
          
          Your verification code is: ${otp}
          Valid for 10 minutes.
          
          If you didn't request this, please ignore this email.
          
          Thanks,
          ShopAI
        `;

        await withRetry(
          () => sendEmail(email, 'Email Verification', verificationText),
          3, // 3 attempts
          1000 // 1 second delay between retries
        );

        // 6. Generate tokens
        const [token, refreshToken] = await Promise.all([
          jwt.sign(
            { userId: user._id.toString() },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
          ),
          jwt.sign(
            { userId: user._id.toString() },
            env.JWT_REFRESH_SECRET as string,
            { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions
          )
        ]);

        // 7. Commit transaction
        await session.commitTransaction();
        
        // 8. Secure response
        const userObject = user.toObject();
        delete userObject.password;
        delete userObject.emailVerificationToken;
        
        sendSuccess(res, { 
          user: userObject, 
          token, 
          refreshToken 
        }, 'Registration successful. Please verify your email.', 201);
        
      } catch (error) {
        // Rollback on any error
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
      
    } catch (error) {
      logger.error(`Registration error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Registration failed', 500);
    }
  },

  // Verify email
  verifyEmail: async (req: Request, res: Response): Promise<void> => {
    const session = await User.startSession();
    try {
      const { email, otp } = req.body;
      console.log('Email:', email, 'OTP:', otp);

      // 1. Input validation
      if (!email || !otp) {
        sendError(res, 'Email and OTP are required', ErrorCodes.BAD_REQUEST);
      }

      // 2. Hash the OTP (timing-safe comparison)
      const hashedOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      // 3. Start transaction
      session.startTransaction();

      // 4. Find and lock user document
      const user = await User.findOneAndUpdate(
        {
          email,
          emailVerificationToken: hashedOTP,
          passwordResetExpires: { $gt: new Date() }, // Check expiration
          emailVerified: false // Extra guard
        },
        { 
          $set: { 
            emailVerified: true,
            emailVerificationToken: null,
            passwordResetExpires: null 
          } 
        },
        { 
          new: true,
          session,
          useFindAndModify: false 
        }
      );

      if (!user) {
        await session.abortTransaction();
        sendError(
          res, 
          'Invalid, expired, or already verified code',
          ErrorCodes.BAD_REQUEST
        );
      }

      // 5. Commit transaction
      await session.commitTransaction();

      // 6. Generate new tokens if needed
      const [token, refreshToken] = await Promise.all([
        jwt.sign(
          { userId: user._id.toString() },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
        ),
        jwt.sign(
          { userId: user._id.toString() },
          env.JWT_REFRESH_SECRET,
          { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions
        )
      ]);

      // 7. Send response
      sendSuccess(res, { 
        message: 'Email verified successfully',
        token,
        refreshToken
      });

    } catch (error) {
      await session.abortTransaction();
      logger.error(`Email verification error: ${error instanceof Error ? error.stack : error} `);
      
      // Differentiate between validation and server errors
      const isValidationError = error instanceof Error && error.name === 'ValidationError';
      sendError(
        res,
        isValidationError ? 'Invalid verification data' : 'Email verification failed',
        isValidationError ? ErrorCodes.BAD_REQUEST  : ErrorCodes.INTERNAL_SERVER_ERROR,
        isValidationError ? 'VALIDATION_ERROR' : 'EMAIL_VERIFICATION_FAILED'
      );
      
      
    } finally {
      session.endSession();
    }
  },


  // Resend verification email (controller-only version)
  // Resend verification email
  resendVerificationEmail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email, emailVerified: false });
      if (!user) {
        return sendError(res, 'User not found or already verified', ErrorCodes.BAD_REQUEST);
      }

      // Generate new OTP
      const otp = generateOTP();
      
      // Hash the OTP before storing
      const emailVerificationToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      // Update user with new verification token
      user.emailVerificationToken = emailVerificationToken;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // Send verification email with OTP
      const verificationText = `Your new email verification code is: ${otp}. Valid for 10 minutes.`;
      await sendEmail(email, 'Email Verification', verificationText);

      sendSuccess(res, { message: 'Verification email sent successfully' });
    } catch (error) {
      logger.error(`Resend verification error: ${error} `);
      sendError(res, 'Failed to resend verification email', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },

  
  // Login user
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.validatedData as LoginInput;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        sendError(res, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
        return;
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        sendError(res, 'Invalid credentials', 401, ErrorCodes.UNAUTHORIZED);
        return;
      }
      
      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
      );
      
      const refreshToken = jwt.sign(
        { userId: user._id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions
      );
      
      // Remove password from response
      const userObject = user.toObject();
      delete userObject.password;
      
      sendSuccess(res, { user: userObject, token, refreshToken }, 'Login successful');
    } catch (error) {
      logger.error(`Login error: ${error}`);
      sendError(res, 'Login failed', 500);
    }
  },
  
  // Refresh token
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.validatedData as RefreshTokenInput;
      
      if (!refreshToken) {
        sendError(res, 'Refresh token is required', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
      
      // Generate new token
      const token = jwt.sign(
        { userId: decoded.userId },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
      );
      
      sendSuccess(res, { token }, 'Token refreshed successfully');
    } catch (error) {
      logger.error(`Token refresh error: ${error}`);
      sendError(res, 'Invalid refresh token', 401, ErrorCodes.UNAUTHORIZED);
    }
  },
  
  // Get current user profile
  getProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Remove password from response
      const userObject = user.toObject();
      delete userObject.password;
      
      sendSuccess(res, { user: userObject }, 'User profile retrieved successfully');
    } catch (error) {
      logger.error(`Get profile error: ${error}`);
      sendError(res, 'Failed to retrieve user profile', 500);
    }
  },
  
  // Update user profile
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, phone } = req.validatedData as UpdateProfileInput;
      const userId = req.user._id;
      
      // Check if email is being changed and already exists
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          sendError(res, 'Email already in use', 409, ErrorCodes.CONFLICT);
          return;
        }
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email, phone },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Remove password from response
      const userObject = updatedUser.toObject();
      delete userObject.password;
      
      sendSuccess(res, { user: userObject }, 'Profile updated successfully');
    } catch (error) {
      logger.error(`Update profile error: ${error}`);
      sendError(res, 'Failed to update profile', 500);
    }
  },
  
  // Change password
  changePassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.validatedData as ChangePasswordInput
      const userId = req.user._id;
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Check current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        sendError(res, 'Current password is incorrect', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Update password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error(`Change password error: ${error}`);
      sendError(res, 'Failed to change password', 500);
    }
  },
  
  // Admin: Get all users
  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      const users = await User.find()
        .select('-password')
        .skip(skip)
        .limit(limit);
        
      const total = await User.countDocuments();
      
      sendSuccess(res, { 
        users, 
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        } 
      }, 'Users retrieved successfully');
    } catch (error) {
      logger.error(`Get all users error: ${error}`);
      sendError(res, 'Failed to retrieve users', 500);
    }
  },
  
  // Admin: Get user by ID
  getUserById: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, { user }, 'User retrieved successfully');
    } catch (error) {
      logger.error(`Get user by ID error: ${error}`);
      sendError(res, 'Failed to retrieve user', 500);
    }
  },
  
  // Admin: Update user
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { firstName, lastName, email, role } = req.validatedData as AdminUpdateUserInput;
      
      // Check if email is already in use
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          sendError(res, 'Email already in use', 409, ErrorCodes.CONFLICT);
          return;
        }
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email, role },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, { user: updatedUser }, 'User updated successfully');
    } catch (error) {
      logger.error(`Update user error: ${error}`);
      sendError(res, 'Failed to update user', 500);
    }
  },
  
  // Admin: Delete user
  deleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      
      const user = await User.findByIdAndDelete(userId);
      
      if (!user) {
        sendError(res, 'User not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error(`Delete user error: ${error}`);
      sendError(res, 'Failed to delete user', 500);
    }
  }
};