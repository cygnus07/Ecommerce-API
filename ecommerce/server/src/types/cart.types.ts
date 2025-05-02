import { Document,Types } from 'mongoose';

export interface CartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId; // Changed to only ObjectId since we always convert string to ObjectId
  variant?: Types.ObjectId;
  quantity: number;
  price?: number; // Made optional since it's not in all operations
  name?: string; // Made optional since it's not in all operations
  image?: string;
  options?: {
    name: string;
    value: string;
  }[];
  addedAt?: Date; // Made optional
}

export interface CartModel extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  guestId?: string;
  items: CartItem[];
  summary?: { // Made optional since it's calculated on the fly
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
  createdAt?: Date; // Made optional
  updatedAt?: Date; // Made optional
  expiresAt?: Date;
  save(): Promise<this>;
}

// For frontend usage
export type ClientCartItem = Omit<CartItem, 'product' | 'variant'> & {
  product: string;
  variant?: string;
};

  export type ClientCartDocument = Omit<CartModel, 'user' | 'items'> & {
  user?: string;
  items: ClientCartItem[];
};

// Type for populated product in cart items
export interface PopulatedCartItem extends Omit<CartItem, 'product'> {
  _id: Types.ObjectId;
  product: {
    _id: Types.ObjectId;
    name: string;
    price: number;
    images?: string[];
    stockQuantity: number;
    discount: number;
  };
}

export interface PopulatedCartDocument extends Omit<CartModel, 'items'> {
  items: PopulatedCartItem[];
}