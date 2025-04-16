export interface CouponDocument {
    _id: string;
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
    applicableProducts?: string[];
    applicableCategories?: string[];
    excludedProducts?: string[];
    usedBy: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }