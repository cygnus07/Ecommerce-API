import { Types, Document } from 'mongoose';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

export interface ProductVariantOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  _id?: Types.ObjectId;
  sku: string;
  price: number;
  compareAtPrice?: number;
  options: ProductVariantOption[];
  inventory: number;
  images: string[];
  weight?: number;
  barcode?: string;
  isDefault?: boolean;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

interface SEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface Ratings {
  average: number;
  count: number;
}

export interface Product {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: Types.ObjectId | string;
  category: Types.ObjectId | string;
  subcategory?: Types.ObjectId | string;
  tags: string[];
  status: ProductStatus;
  featuredImage: string;
  images: string[];
  variants: ProductVariant[];
  tax?: {
    taxable: boolean;
    rate?: number;
  };
  shipping?: {
    dimensions?: Dimensions;
    weight?: number;
    weightUnit?: string;
    freeShipping?: boolean;
  };
  seo?: SEO;
  ratings: Ratings;
  createdBy: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
}

export interface ProductDocument extends Product, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// For API responses
export type ProductResponse = Omit<ProductDocument, 
  'brand' | 'category' | 'subcategory' | 'createdBy' | 'updatedBy' | 'variants'> & {
  _id: string;
  brand?: string;
  category: string;
  subcategory?: string;
  createdBy: string;
  updatedBy?: string;
  variants: Array<Omit<ProductVariant, '_id'> & { _id: string }>;
};