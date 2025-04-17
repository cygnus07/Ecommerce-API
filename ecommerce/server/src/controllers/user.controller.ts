import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export const userController = {
  // Register new user
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        sendError(res, 'Email already in use', 409, ErrorCodes.CONFLICT);
        return;
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'customer' // Default role
      });
      
      await user.save();
      
      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRATION }
      );
      
      const refreshToken = jwt.sign(
        { userId: user._id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRATION }
      );
      
      // Remove password from response
      const userObject = user.toObject();
      delete userObject.password;
      
      sendSuccess(res, { user: userObject, token, refreshToken }, 'User registered successfully', 201);
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      sendError(res, 'Registration failed', 500);
    }
  },
  
  // Login user
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        sendError(res, 'Invalid credentials', 401, ErrorCodes.UNAUTHORIZED);
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
        { expiresIn: env.JWT_EXPIRATION }
      );
      
      const refreshToken = jwt.sign(
        { userId: user._id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRATION }
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
      const { refreshToken } = req.body;
      
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
        { expiresIn: env.JWT_EXPIRATION }
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
      const { name, email, phone, address } = req.body;
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
        { name, email, phone, address },
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
      const { currentPassword, newPassword } = req.body;
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
      const { name, email, role, isActive } = req.body;
      
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
        { name, email, role, isActive },
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