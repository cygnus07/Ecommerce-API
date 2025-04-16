import mongoose, { Schema, model } from 'mongoose';

export interface ShippingRuleDocument {
  _id: string;
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  countries: string[];
  regions?: string[];
  cost: number;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
}

export interface ShippingMethodDocument {
  _id: string;
  name: string;
  code: string;
  description?: string;
  provider?: string;
  isActive: boolean;
  rules: ShippingRuleDocument[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Shipping rule schema
const shippingRuleSchema = new Schema<ShippingRuleDocument>({
  minWeight: { 
    type: Number 
  },
  maxWeight: { 
    type: Number 
  },
  minOrderValue: { 
    type: Number 
  },
  maxOrderValue: { 
    type: Number 
  },
  countries: [{ 
    type: String 
  }],
  regions: [{ 
    type: String 
  }],
  cost: { 
    type: Number, 
    required: true 
  },
  estimatedDeliveryDays: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  }
}, { _id: true });

// Shipping method schema
const shippingMethodSchema = new Schema<ShippingMethodDocument>({
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
  provider: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  rules: [shippingRuleSchema],
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Ensure only one default shipping method
shippingMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.models.ShippingMethod.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Indexes
shippingMethodSchema.index({ code: 1 }, { unique: true });
shippingMethodSchema.index({ isActive: 1 });
shippingMethodSchema.index({ isDefault: 1 });

const ShippingMethod = mongoose.models.ShippingMethod || 
  model<ShippingMethodDocument>('ShippingMethod', shippingMethodSchema);

export default ShippingMethod;