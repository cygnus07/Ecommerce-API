export interface WishlistItem {
    product: string;
    variant?: string;
    addedAt: Date;
  }
  
  export interface WishlistDocument {
    _id: string;
    user: string;
    items: WishlistItem[];
    createdAt: Date;
    updatedAt: Date;
  }