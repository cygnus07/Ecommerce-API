import { z } from 'zod';

export const inventoryActivityValidators = {
  logActivity: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required'),
    activityType: z.enum(['add', 'remove', 'adjust']),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    note: z.string().optional()
  }),

  getProductActivities: {
    params: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required')
    }),
    query: z.object({
      page: z.preprocess(
        val => Number(val),
        z.number().int().positive().optional()
      ),
      limit: z.preprocess(
        val => Number(val),
        z.number().int().min(1).max(100).optional()
      )
    })
  },

  getActivitySummary: {
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }).refine(data => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    }, {
      message: 'End date must be after start date',
      path: ['endDate']
    })
  }
};