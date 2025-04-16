import mongoose, { Schema, model } from 'mongoose';
import { WishlistDocument, WishlistItem } from '../types/wishlist.types.js';

// Wishlist item schema
const wishlistItemSchema = new Schema<WishlistItem>({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: { 
    type: Schema.Types.ObjectId 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// Wishlist schema
const wishlistSchema = new Schema<WishlistDocument>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  items: [wishlistItemSchema]
}, { 
  timestamps: true 
});

// Indexes
wishlistSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ 'items.product': 1 });

const Wishlist = mongoose.models.Wishlist || model<WishlistDocument>('Wishlist', wishlistSchema);

export default Wishlist;