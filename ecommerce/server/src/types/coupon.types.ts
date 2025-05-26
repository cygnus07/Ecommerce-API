import { Types } from 'mongoose';

export interface CouponDocument {
  _id: Types.ObjectId;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  description?: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  applicableProducts?: Types.ObjectId[] | string[];
  applicableCategories?: Types.ObjectId[] | string[];
  excludedProducts?: Types.ObjectId[] | string[];
  usedBy: Types.ObjectId[] | string[];
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// For frontend/client usage
export type ClientCouponDocument = Omit<CouponDocument, 
  'applicableProducts' | 'applicableCategories' | 
  'excludedProducts' | 'usedBy' | 'createdBy'> & {
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  usedBy: string[];
  createdBy: string;
};