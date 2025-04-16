import mongoose, { Schema, model } from 'mongoose';
import { CartDocument, CartItem } from '../types/cart.types.js';


// Cart item schema
const cartItemSchema = new Schema<CartItem>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: { 
    type: Schema.Types.ObjectId 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  price: { 
    type: Number, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String 
  },
  options: [{
    name: { type: String },
    value: { type: String }
  }],
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

// Cart schema
const cartSchema = new Schema<CartDocument>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    sparse: true 
  },
  guestId: { 
    type: String, 
    sparse: true 
  },
  items: [cartItemSchema],
  summary: {
    subtotal: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    tax: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    discount: { 
      type: Number, 
      default: 0 
    },
    shipping: { 
      type: Number, 
      default: 0 
    },
    total: { 
      type: Number, 
      required: true, 
      default: 0 
    }
  },
  couponCode: { 
    type: String 
  },
  discount: {
    code: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  expiresAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Either user or guestId must be set
cartSchema.pre('save', function(next) {
  if (!this.user && !this.guestId) {
    return next(new Error('Either user or guestId must be specified'));
  }
  next();
});

// Ensure only one cart per user or guest
cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

// Index for expiration
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.models.Cart || model<CartDocument>('Cart', cartSchema);

export default Cart;