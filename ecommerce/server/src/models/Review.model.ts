import mongoose, { Schema, model } from 'mongoose';
import { ReviewDocument } from '../types/review.types.js';

// URL validation function
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Review schema
const reviewSchema = new Schema<ReviewDocument>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    set: (v: number) => Math.round(v * 2) / 2 // Allows half-star ratings (1, 1.5, 2...)
  },
  title: { 
    type: String,
    trim: true,
    maxlength: 120 
  },
  comment: { 
    type: String, 
    required: true,
    minlength: 10,
    maxlength: 2000,
    trim: true
  },
  images: [{ 
    type: String,
    validate: {
      validator: isValidUrl, 
      message: (props: any) => `${props.value} is not a valid URL!`
    },
    max: 5 // Limit to 5 images per review
  }],
  isVerifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
  helpful: {
    count: { 
      type: Number, 
      default: 0,
      min: 0
    },
    users: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      default: []
    }]
  },
  reportCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  reportThreshold: {
    type: Number,
    default: 5,
    select: false
  },
  moderatedAt: {
    type: Date,
    select: false
  },
  moderator: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    select: false
  },
  reply: {
    text: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    createdAt: Date
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  deleted: { 
    type: Boolean, 
    default: false,
    select: false 
  },
  deletedAt: { 
    type: Date,
    select: false 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ title: 'text', comment: 'text' });

// Prevent returning deleted reviews in normal queries
reviewSchema.pre(/^find/, function(this: mongoose.Query<any, any>, next) {
  this.where({ deleted: { $ne: true } });
  next();
});

const Review = mongoose.models.Review || model<ReviewDocument>('Review', reviewSchema);

export default Review;