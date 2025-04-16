import mongoose, { Schema, model } from 'mongoose';
import { ReviewDocument } from '../types/review.types.js';

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
    max: 5 
  },
  title: { 
    type: String 
  },
  comment: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  isVerifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
  helpful: {
    count: { 
      type: Number, 
      default: 0 
    },
    users: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  reportCount: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, { 
  timestamps: true 
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.models.Review || model<ReviewDocument>('Review', reviewSchema);

export default Review;