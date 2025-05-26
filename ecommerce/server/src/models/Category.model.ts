import mongoose, { Schema, model } from 'mongoose';
import { CategoryDocument } from '../types/category.types.js';

// Category schema
const categorySchema = new Schema<CategoryDocument>({
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
    type: String 
  },
  parent: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category' 
  },
  level: { 
    type: Number, 
    default: 0 
  },
  image: { 
    type: String 
  },
  featuredOrder: { 
    type: Number 
  },
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }]
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual field for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ featuredOrder: 1 });

const Category = mongoose.models.Category || model<CategoryDocument>('Category', categorySchema);

export default Category;
