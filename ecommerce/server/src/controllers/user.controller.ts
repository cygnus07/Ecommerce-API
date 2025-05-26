import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../services/email.service.js';
import User from '../models/User.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { withRetry } from '../utils/helper.js';
import BlacklistedToken from '../models/BlacklistedToken.model.js';
import passport from 'passport';
import { AuthenticatedRequest, AuthUser } from '../types/user.types.js';
// import nodemailer from 'nodemailer'

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

// const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
//    try {
//       const transporter = nodemailer.createTransport({
//         service: 'gmail', 
//         auth: {
//           user: env.EMAIL_USER,
//           pass: env.EMAIL_PASS,
//         },
//         logger: true, // Keep debug logs for now
//       });

//      await transporter.sendMail({
//        from: `"Shop AI" <${process.env.EMAIL_USER}>`, // Formalized format
//        to,
//        subject,
//        text,
//        html: `<p>${text.replace(/\n/g, '<br>')}</p>`, // Keep HTML fallback
//      });
 
//      logger.info(`Email sent to ${to}`);
//    } catch (error) {
//      logger.error(`Email failed to ${to}: ${error instanceof Error ? error.stack : error}`);
//      throw error; // Re-throw for route handler
//    }
//  };


export const userController = {
  // Register new user
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, password, role } = req.validatedData as RegisterInput;
      
      // 1. Check existing user (optimized query)
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (existingUser.emailVerified) {
          sendError(res, 'Email already in use', ErrorCodes.CONFLICT);
        } else {
          sendError(
            res, 
            'Email already registered but not verified. Check your email for verification code.',
            ErrorCodes.CONFLICT,
            'EMAIL_EXISTS_NOT_VERIFIED'
          );
        }
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
          password: await bcrypt.hash(password, 12), 
          emailVerified: false,
          emailVerificationToken,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          role: role || 'customer'
        });

        await user.save({ session });

        // 5. Send verification email with HTML template
        const verificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Hi ${firstName},</p>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br>${env.APP_NAME}</p>
          </div>
        `;

        await withRetry(
          () => emailService.sendEmail(
            email, 
            `Verify Your ${env.APP_NAME} Account`, 
            verificationHtml
          ),
          3, // 3 attempts
          1000 // 1 second delay between retries
        );

        // 6. Commit transaction
        await session.commitTransaction();
        
        // 7. Secure response (don't include tokens since email isn't verified)
        const userObject = user.toObject();
        delete userObject.password;
        delete userObject.emailVerificationToken;
        
        sendSuccess(res, { 
          user: userObject,
          message: 'Registration successful. Please check your email for verification instructions.'
        }, 'Registration Successfull', 201);
        
      } catch (error) {
        // Rollback on any error
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
      
    } catch (error) {
      logger.error(`Registration error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Registration failed', ErrorCodes.INTERNAL_SERVER_ERROR);
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
        return
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
        return
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
      console.log(user.firstName, 'User name');
      // console.log(user)
      emailService.sendWelcomeEmail(user.email, user.firstName || 'there')
        .catch(e => logger.error(`Welcome email failed silently: ${e}`));

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
        isValidationError ?  'VALIDATION_ERROR' : 'EMAIL_VERIFICATION_FAILED'
      );
      
      
    } finally {
      session.endSession();
    }
  },


  
  // Resend verification email
  resendVerificationEmail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email, emailVerified: false });
      if (!user) {
        sendError(res, 'User not found or already verified', ErrorCodes.BAD_REQUEST);
        return
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
      await emailService.sendEmail(email, 'Email Verification', verificationText);

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
      
      // Find user with email verification status
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        sendError(res, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
        return;
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        sendError(res, 'Invalid credentials', ErrorCodes.UNAUTHORIZED);
        return;
      }
      
      // Check if email is verified
      if (!user.emailVerified) {
        sendError(
          res, 
          'Email not verified. Please check your email for verification instructions.',
          ErrorCodes.FORBIDDEN,
          'EMAIL_NOT_VERIFIED'
        );
        return;
      }
      
      // Generate tokens
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
      
      // Remove sensitive data from response
      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.emailVerificationToken;
      
      sendSuccess(res, { 
        user: userObject, 
        token, 
        refreshToken 
      }, 'Login successful');
    } catch (error) {
      logger.error(`Login error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Login failed', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },
  
  // Refresh token
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.validatedData as RefreshTokenInput;
      
      if (!refreshToken) {
        sendError(res, 'Refresh token is required', ErrorCodes.BAD_REQUEST);
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
      sendError(res, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
    }
  },

  // Forgot password - request password reset
  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        sendError(res, 'Email is required', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Find user
      const user = await User.findOne({ email });
      
      // Don't reveal if user exists for security
      if (!user) {
        sendSuccess(res, null, 'If a user with that email exists, a password reset link has been sent');
        return;
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash token before saving to database
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Save to user record
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
      
      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(
          user.email,
          user.firstName || 'User',
          resetToken
        );
        
        sendSuccess(
          res, 
          null, 
          'Password reset link sent to your email. The link is valid for 1 hour.'
        );
      } catch (emailError) {
        // If email fails, clean up the reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
        logger.error(`Error sending reset email: ${emailError}`);
        throw new Error('Failed to send password reset email');
      }
      
    } catch (error) {
      logger.error(`Forgot password error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Failed to process password reset request', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },

  // Reset password with token
  resetPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password, confirmPassword } = req.body;
      
      // Validate required fields
      if (!token || !password || !confirmPassword) {
        sendError(res, 'Token, password and confirm password are required', ErrorCodes.BAD_REQUEST);
        return;
      }

      // Validate password match
      if (password !== confirmPassword) {
        sendError(res, 'Passwords do not match', ErrorCodes.BAD_REQUEST);
        return;
      }

      // Hash token for comparison with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }
      });
      
      if (!user) {
        sendError(
          res, 
          'Password reset token is invalid or has expired', 
          ErrorCodes.BAD_REQUEST
        );
        return;
      }
      
      // Update password and clear reset fields
      user.password = await bcrypt.hash(password, 12);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = new Date();
      await user.save();
      
      // Send confirmation email
      emailService.sendPasswordChangeNotification(user.email, user.firstName || 'User')
        .catch(e => logger.error(`Password change notification failed: ${e}`));
      
      sendSuccess(
        res, 
        null, 
        'Your password has been reset successfully. You can now log in with your new password.'
      );
      
    } catch (error) {
      logger.error(`Reset password error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Failed to reset password', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },

  
  // Get current user profile
  getProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
        return;
      }

      const safeUser = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        // include other fields you want to expose
      };
      
      sendSuccess(res, { user: safeUser }, 'User profile retrieved successfully');
    } catch (error) {
      logger.error(`Get profile error: ${error}`);
      sendError(res, 'Failed to retrieve user profile', 500);
    }
  },
  
  // Update user profile
  updateProfile: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, phone } = req.validatedData as UpdateProfileInput;
      const userId = req.user._id;
      
      // Check if email is being changed and already exists
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          sendError(res, 'Email already in use', ErrorCodes.CONFLICT);
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
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
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
  changePassword: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.validatedData as ChangePasswordInput;
      const userId = req.user._id;
      
      // 1. Validate new password strength (add this to your ChangePasswordInput validation)
      if (currentPassword === newPassword) {
        sendError(res, 'New password must be different from current password', ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // 2. Find user with password selected
      const user = await User.findById(userId).select('+password +emailVerified');
      if (!user) {
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      // 3. Additional check for email verification
      if (!user.emailVerified) {
        sendError(
          res, 
          'Please verify your email before changing password',
          ErrorCodes.FORBIDDEN,
          'EMAIL_NOT_VERIFIED'
        );
        return;
      }
      
      // 4. Check current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        sendError(res, 'Current password is incorrect', ErrorCodes.UNAUTHORIZED);
        return;
      }
      
      // 5. Update password and invalidate existing tokens (optional)
      user.password = await bcrypt.hash(newPassword, 12); // Increased salt rounds
      user.passwordChangedAt = new Date(); // Track password change time
      await user.save();
      
      // 6. Optional: Invalidate existing JWT tokens by incrementing tokenVersion
      // user.tokenVersion = (user.tokenVersion || 0) + 1;
      // await user.save();
      
      // 7. Send password change notification email
      emailService.sendPasswordChangeNotification(user.email, user.firstName || 'User')
        .catch(e => logger.error(`Password change notification failed: ${e}`));
      
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error(`Change password error: ${error instanceof Error ? error.stack : error}`);
      sendError(res, 'Failed to change password', ErrorCodes.INTERNAL_SERVER_ERROR);
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
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
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
          sendError(res, 'Email already in use', ErrorCodes.CONFLICT);
          return;
        }
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email, role },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
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
        sendError(res, 'User not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      logger.error(`Delete user error: ${error}`);
      sendError(res, 'Failed to delete user', 500);
    }
  },

  // Logout user
  logout: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
  
      if (!refreshToken) {
        sendError(res, 'Refresh token is required', ErrorCodes.BAD_REQUEST);
        return;
      }
  
      // Verify token first to get expiration
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { exp: number };
      
      // Store in blacklist
      await BlacklistedToken.create({
        token: refreshToken,
        expiresAt: new Date(decoded.exp * 1000) // Convert JWT exp to Date
      });
  
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        sendError(res, 'Invalid refresh token', ErrorCodes.UNAUTHORIZED);
      } else {
        logger.error(`Logout error: ${error instanceof Error ? error.stack : error}`);
        sendError(res, 'Failed to logout', ErrorCodes.INTERNAL_SERVER_ERROR);
      }
    }
  },


// Social Authentication - Google
googleAuth: (req: Request, res: Response, next: any) => {
  console.log('Google auth called');
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
},

googleCallback: (req: Request, res: Response, next: any) => {
  passport.authenticate('google', { session: false }, async (err: Error, user: any, info: any) => {
    if (err) {
      logger.error(`Google auth callback error: ${err}`);
      return res.redirect(`${env.CLIENT_URL}/login?error=Google authentication failed`);
    }

    if (!user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=Could not authenticate with Google`);
    }

    try {
      // Generate JWT tokens
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

      // Redirect to frontend with tokens
      return res.redirect(
        `${env.CLIENT_URL}/social-auth-success?token=${token}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      // console.log('Google callback received with code:', req.query.code);
      logger.error(`Failed to generate tokens: ${error}`);
      return res.redirect(`${env.CLIENT_URL}/login?error=Authentication successful but token generation failed`);
    }
  })(req, res, next);
},

// Social Authentication - Facebook
// facebookAuth: (req: Request, res: Response, next: any) => {
//   passport.authenticate('facebook', {
//     scope: ['email']
//   })(req, res, next);
// },

// facebookCallback: (req: Request, res: Response, next: any) => {
//   passport.authenticate('facebook', async (err: Error, user: any, info: any) => {
//     if (err) {
//       logger.error(`Facebook auth callback error: ${err}`);
//       return res.redirect(`${env.FRONTEND_URL}/login?error=Facebook authentication failed`);
//     }

//     if (!user) {
//       return res.redirect(`${env.FRONTEND_URL}/login?error=Could not authenticate with Facebook`);
//     }

//     try {
//       // Generate JWT tokens
//       const token = jwt.sign(
//         { userId: user._id },
//         env.JWT_SECRET,
//         { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
//       );
      
//       const refreshToken = jwt.sign(
//         { userId: user._id },
//         env.JWT_REFRESH_SECRET,
//         { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions
//       );

//       // Redirect to frontend with tokens
//       return res.redirect(
//         `${env.FRONTEND_URL}/social-auth-success?token=${token}&refreshToken=${refreshToken}`
//       );
//     } catch (error) {
//       logger.error(`Failed to generate tokens: ${error}`);
//       return res.redirect(`${env.FRONTEND_URL}/login?error=Authentication successful but token generation failed`);
//     }
//   })(req, res, next);
// },
};



