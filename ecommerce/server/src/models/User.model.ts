import mongoose, { Schema, model } from 'mongoose';
import { UserDocument, UserRole, AccountStatus, Address } from '../types/user.types.js';

// Address schema
const addressSchema = new Schema<Address>({
  fullName: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: false });

// User schema
const userSchema = new Schema<UserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER 
  },
  status: { 
    type: String, 
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE 
  },
  avatar: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  addresses: [addressSchema],
  passwordResetToken: { 
    type: String 
  },
  passwordResetExpires: { 
    type: Date 
  },
  passwordChangedAt: Date
,
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: { 
    type: String 
  },
  lastLogin: { 
    type: Date 
  },
  refreshToken: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Indexes
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ status: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Don't return password and other sensitive fields
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.emailVerificationToken;
    return ret;
  },
  virtuals: true
});

const User = mongoose.models.User || model<UserDocument>('User', userSchema);

export default User;
