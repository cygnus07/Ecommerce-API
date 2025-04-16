export interface ReviewDocument {
    _id: string;
    product: string;
    user: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpful: {
      count: number;
      users: string[];
    };
    reportCount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
  }