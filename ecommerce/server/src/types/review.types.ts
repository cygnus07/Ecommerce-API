import { Types } from 'mongoose';

export interface ReviewDocument {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpful: {
    count: number;
    users: Types.ObjectId[];
  };
  reportCount: number;
  reportThreshold?: number;
  moderatedAt?: Date;
  moderator?: Types.ObjectId;
  reply?: {
    text: string;
    user: Types.ObjectId;
    createdAt: Date;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  deletedAt?: Date;
}