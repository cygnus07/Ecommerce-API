import mongoose, { Schema, model } from 'mongoose';

export interface PaymentMethodDocument {
  _id: string;
  name: string;
  code: string;
  description?: string;
  instructions?: string;
  isActive: boolean;
  processingFee?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  image?: string;
  isDefault: boolean;
  availableCountries: string[];
  minOrderValue?: number;
  maxOrderValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment method schema
const paymentMethodSchema = new Schema<PaymentMethodDocument>({
  name: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String 
  },
  instructions: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  processingFee: {
    type: { 
      type: String, 
      enum: ['percentage', 'fixed'] 
    },
    value: { 
      type: Number, 
      min: 0 
    }
  },
  image: { 
    type: String 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  availableCountries: [{ 
    type: String 
  }],
  minOrderValue: { 
    type: Number, 
    min: 0 
  },
  maxOrderValue: { 
    type: Number 
  }
}, { 
  timestamps: true 
});

// Ensure only one default payment method
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.models.PaymentMethod.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Indexes
paymentMethodSchema.index({ code: 1 }, { unique: true });
paymentMethodSchema.index({ isActive: 1 });
paymentMethodSchema.index({ isDefault: 1 });
paymentMethodSchema.index({ 'availableCountries': 1 });

const PaymentMethod = mongoose.models.PaymentMethod || 
  model<PaymentMethodDocument>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;