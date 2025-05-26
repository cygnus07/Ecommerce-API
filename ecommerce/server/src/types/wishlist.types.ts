// src/types/wishlist.types.ts
import { Types } from 'mongoose';

export interface WishlistItem {
  product: Types.ObjectId;
  variant?: string;
  addedAt: Date;
}

export interface WishlistDocument extends Document {
  user: Types.ObjectId;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PopulatedWishlistItem {
  product: {
    _id: Types.ObjectId;
    name: string;
    price: number;
    images: string[];
    description: string;
    avgRating?: number;
    reviewCount?: number;
  };
  variant?: string;
  addedAt: Date;
}

export interface PopulatedWishlistDocument extends Document {
  user: Types.ObjectId;
  items: PopulatedWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export type AddToWishlistRequest = {
  productId: string;
  variant?: string;
};

export type RemoveFromWishlistRequest = {
  productId: string;
};

export type WishlistResponse = {
  _id: string;
  user: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      images: string[];
      description: string;
      avgRating?: number;
      reviewCount?: number;
    };
    variant?: string;
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};