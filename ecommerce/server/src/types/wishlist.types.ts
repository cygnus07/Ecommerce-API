import { Types } from 'mongoose'

export interface WishlistItem {
    product: Types.ObjectId;
    variant?: string;
    addedAt: Date;
  }
  
  export interface WishlistDocument {
    _id: string;
    user: Types.ObjectId;
    items: WishlistItem[];
    createdAt: Date;
    updatedAt: Date;
  }