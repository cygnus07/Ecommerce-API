import mongoose, { Schema, model } from 'mongoose';
import { ProductDocument, ProductStatus, ProductVariant, ProductVariantOption } from '../types/product.types.js';

// Product variant option schema
const productVariantOptionSchema = new Schema<ProductVariantOption>({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

// Product variant schema
const productVariantSchema = new Schema<ProductVariant>({
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  options: [productVariantOptionSchema],
  inventory: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  weight: { type: Number },
  barcode: { type: String },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: false });

// Product schema
const productSchema = new Schema<ProductDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  shortDescription: { 
    type: String 
  },
  brand: { 
    type: String 
  },
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  subcategory: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category' 
  },
  tags: [{ 
    type: String 
  }],
  status: { 
    type: String, 
    enum: Object.values(ProductStatus),
    default: ProductStatus.DRAFT 
  },
  featuredImage: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  variants: [productVariantSchema],
  tax: {
    taxable: { type: Boolean, default: true },
    rate: { type: Number }
  },
  shipping: {
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: 'cm' }
    },
    weight: { type: Number },
    weightUnit: { type: String, default: 'kg' },
    freeShipping: { type: Boolean, default: false }
  },
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }]
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Indexes
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text', tags: 'text' });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'ratings.average': -1 });

// Ensure at least one default variant
productSchema.pre('save', function(next) {
  // If there's no default variant and we have variants, make the first one default
  if (this.variants.length > 0 && !this.variants.some(variant => variant.isDefault)) {
    this.variants[0].isDefault = true;
  }
  next();
});

const Product = mongoose.models.Product || model<ProductDocument>('Product', productSchema);

export default Product;