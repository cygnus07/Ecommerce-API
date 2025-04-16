export interface CartItem {
    _id?: string;
    product: string;
    variant?: string;
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
    _id: string;
    user?: string;
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