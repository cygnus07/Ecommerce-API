import { Types } from 'mongoose';

export interface CartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId | string; // Accepts both ObjectId and string
  variant?: Types.ObjectId | string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  options?: {
    name: string;
    value: string;
  }[];
  addedAt: Date;
}

export interface CartDocument {
  _id: Types.ObjectId;
  user?: Types.ObjectId | string;
  guestId?: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    tax: number;
    discount: number;
    shipping: number;
    total: number;
  };
  couponCode?: string;
  discount?: {
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// For frontend usage (optional)
export type ClientCartItem = Omit<CartItem, 'product' | 'variant'> & {
  product: string;
  variant?: string;
};

export type ClientCartDocument = Omit<CartDocument, 'user' | 'items'> & {
  user?: string;
  items: ClientCartItem[];
};