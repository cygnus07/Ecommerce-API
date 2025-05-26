import mongoose, { Schema, model } from 'mongoose';
import { OrderDocument, OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from '../types/order.types.js';

// Address subschema (for both billing and shipping)
const addressSchema = new Schema({
  fullName: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

// Order item schema
const orderItemSchema = new Schema<OrderItem>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: { 
    type: Schema.Types.ObjectId 
  },
  name: { 
    type: String, 
    required: true 
  },
  sku: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  image: { 
    type: String 
  },
  options: [{
    name: { type: String },
    value: { type: String }
  }]
}, { _id: false });

// Order schema
const orderSchema = new Schema<OrderDocument>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [orderItemSchema],
  billing: {
    address: { 
      type: addressSchema, 
      required: true 
    },
    email: { 
      type: String, 
      required: true 
    }
  },
  shipping: {
    address: { 
      type: addressSchema, 
      required: true 
    },
    method: { 
      type: String, 
      required: true 
    },
    cost: { 
      type: Number, 
      required: true 
    },
    trackingNumber: { 
      type: String 
    },
    trackingUrl: { 
      type: String 
    },
    estimatedDelivery: { 
      type: Date 
    }
  },
  payment: {
    method: { 
      type: String, 
      enum: Object.values(PaymentMethod),
      required: true 
    },
    transactionId: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      default: 'USD' 
    }
  },
  summary: {
    subtotal: { 
      type: Number, 
      required: true 
    },
    tax: { 
      type: Number, 
      required: true 
    },
    discount: { 
      type: Number, 
      default: 0 
    },
    shipping: { 
      type: Number, 
      required: true 
    },
    total: { 
      type: Number, 
      required: true 
    }
  },
  status: { 
    type: String, 
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING 
  },
  notes: { 
    type: String 
  },
  couponCode: { 
    type: String 
  },
  discount: {
    code: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  invoiceUrl: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Indexes
// orderSchema.index({ orderNumber: 1 }, { unique: true });
// orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Static method to generate unique order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  // Find the highest existing order number with this prefix
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}`)
  }).sort({ orderNumber: -1 });
  
  // Extract the sequence number or start at 1
  let sequenceNumber = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(prefix.length));
    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }
  
  return `${prefix}${String(sequenceNumber).padStart(5, '0')}`;
};

const Order = mongoose.models.Order || model<OrderDocument>('Order', orderSchema);

export default Order;