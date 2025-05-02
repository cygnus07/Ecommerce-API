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
    _id: string;
    googleId?: string; // ← ADD THIS LINE
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
    emailVerified: boolean;
    emailVerificationToken?: string;
    lastLogin?: Date;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface IUser {
    _id: string | { toString(): string };
  }
  