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
    _id?: string;
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
  
  export interface ProductDocument {
    _id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    brand?: string;
    category: string;
    subcategory?: string;
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
      dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
      };
      weight?: number;
      weightUnit?: string;
      freeShipping?: boolean;
    };
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    ratings: {
      average: number;
      count: number;
    };
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }