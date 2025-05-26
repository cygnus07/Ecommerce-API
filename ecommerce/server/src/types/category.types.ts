export interface CategoryDocument {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    parent?: string;
    level: number;
    image?: string;
    featuredOrder?: number;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }