import mongoose, { Schema, model, Types } from 'mongoose';

export enum InventoryActivityType {
  STOCK_ADDITION = 'stock_addition',
  STOCK_REMOVAL = 'stock_removal',
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  DAMAGED = 'damaged',
  TRANSFER = 'transfer'
}

type ReferenceType = 'order' | 'purchase' | 'adjustment' | 'return';

interface InventoryActivity {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  type: InventoryActivityType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: {
    type: ReferenceType;
    id: Types.ObjectId;
  };
  note?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

interface InventoryActivityDocument extends InventoryActivity, mongoose.Document {
  _id: Types.ObjectId;
}

interface InventoryActivityModel extends mongoose.Model<InventoryActivityDocument> {
  logActivity: (
    params: {
      product: Types.ObjectId | string;
      variant?: Types.ObjectId | string;
      type: InventoryActivityType;
      quantity: number;
      reference?: {
        type: ReferenceType;
        id: Types.ObjectId | string;
      };
      note?: string;
      performedBy: Types.ObjectId | string;
    }
  ) => Promise<InventoryActivityDocument>;
}

const referenceSchema = new Schema({
  type: { 
    type: String, 
    enum: ['order', 'purchase', 'adjustment', 'return'] as const,
    required: true
  },
  id: { 
    type: Schema.Types.ObjectId,
    required: true
  }
}, { _id: false });

const inventoryActivitySchema = new Schema<InventoryActivityDocument, InventoryActivityModel>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: { 
    type: Schema.Types.ObjectId,
    ref: 'ProductVariant' 
  },
  type: { 
    type: String, 
    enum: Object.values(InventoryActivityType),
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  previousQuantity: { 
    type: Number, 
    required: true,
    default: 0 
  },
  newQuantity: { 
    type: Number, 
    required: true,
    default: 0 
  },
  reference: referenceSchema,
  note: { 
    type: String 
  },
  performedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: { createdAt: true, updatedAt: false } 
});

// Pre-save hook to calculate quantities
inventoryActivitySchema.pre('save', function(next) {
  this.newQuantity = this.previousQuantity + this.quantity;
  next();
});

// Static method for logging activities
inventoryActivitySchema.statics.logActivity = async function(params) {
  const latest = await this.findOne({ product: params.product })
    .sort({ createdAt: -1 })
    .exec();

  const previousQuantity = latest?.newQuantity || 0;

  return this.create({
    ...params,
    previousQuantity,
    newQuantity: previousQuantity + params.quantity
  });
};

// Indexes
inventoryActivitySchema.index({ product: 1, createdAt: -1 });
inventoryActivitySchema.index({ 'reference.id': 1, 'reference.type': 1 });
inventoryActivitySchema.index({ type: 1 });
inventoryActivitySchema.index({ performedBy: 1 });

const InventoryActivity = mongoose.models.InventoryActivity as InventoryActivityModel || 
  model<InventoryActivityDocument, InventoryActivityModel>('InventoryActivity', inventoryActivitySchema);

export default InventoryActivity;