import { Request } from 'express';
import { Types } from 'mongoose';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor'
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export interface Address {
  _id?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface UserDocument {
  _id: Types.ObjectId; // Changed from string to Types.ObjectId
  googleId?: string;
  facebookId?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  phone?: string;
  addresses: Address[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// For when you just need the basic user identification
export interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  role: string;
  [key: string]: any; // For additional properties
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}

// Keep your existing IUser if needed for other purposes
export interface IUser {
  _id: string | Types.ObjectId | { toString(): string };
}

