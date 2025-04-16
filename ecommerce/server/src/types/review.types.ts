import { Types } from 'mongoose'

export interface ReviewDocument {
    _id: string;
    product: Types.ObjectId;
    user: Types.ObjectId;
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