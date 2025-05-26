import mongoose, { Schema, model } from 'mongoose';
import { CouponDocument } from '../types/coupon.types.js';

// Coupon schema
const couponSchema = new Schema<CouponDocument>({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  value: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  minPurchase: { 
    type: Number, 
    min: 0 
  },
  maxDiscount: { 
    type: Number, 
    min: 0 
  },
  description: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    min: 0 
  },
  usageCount: { 
    type: Number, 
    default: 0 
  },
  applicableProducts: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Product'
  }],
  applicableCategories: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Category'
  }],
  excludedProducts: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Product'
  }],
  usedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Validate coupon value based on type
couponSchema.pre('save', function(next) {
  if (this.type === 'percentage' && (this.value < 0 || this.value > 100)) {
    return next(new Error('Percentage discount must be between 0 and 100'));
  }
  next();
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ 'applicableProducts': 1 });
couponSchema.index({ 'applicableCategories': 1 });

const Coupon = mongoose.models.Coupon || model<CouponDocument>('Coupon', couponSchema);

export default Coupon;