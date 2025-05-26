import { Types } from 'mongoose';
import { z } from 'zod';

// MongoDB ObjectId Zod schema
export const objectIdSchema = z.string().refine(
  (value) => Types.ObjectId.isValid(value),
  { message: "Invalid ObjectId format" }
);

// Review document interface
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

// Zod schemas for validation
export const createReviewSchema = z.object({
  productId: objectIdSchema,
  rating: z.number().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).optional()
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  comment: z.string().min(10).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional()
});

export const reviewIdParamSchema = z.object({
  reviewId: objectIdSchema
});

export const productIdParamSchema = z.object({
  productId: objectIdSchema
});

export const userIdParamSchema = z.object({
  userId: objectIdSchema.optional()
});

export const replySchema = z.object({
  text: z.string().min(1).max(2000)
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected'])
});

// Export types from schemas
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;