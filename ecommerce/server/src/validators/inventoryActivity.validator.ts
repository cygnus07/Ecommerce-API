import { z } from 'zod';

// Define enums to match your Mongoose schema
const InventoryActivityType = z.enum([
  'stock_addition',
  'stock_removal',
  'purchase',
  'sale',
  'return',
  'adjustment',
  'damaged',
  'transfer'
]);

const ReferenceType = z.enum([
  'order',
  'purchase',
  'adjustment',
  'return'
]);

export const inventoryActivityValidators = {
  logActivity: z.object({
    product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required'),
    type: InventoryActivityType,
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    variant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid variant ID is required').optional(),
    reference: z.object({
      type: ReferenceType,
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid reference ID is required')
    }).optional(),
    note: z.string().optional()
  }),

  getProductActivities: {
    params: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid product ID is required')
    }),
    query: z.object({
      page: z.preprocess(
        val => parseInt(String(val), 10),
        z.number().int().positive().default(1)
      ),
      limit: z.preprocess(
        val => parseInt(String(val), 10),
        z.number().int().min(1).max(100).default(20)
      )
    })
  },

  getActivitySummary: {
    query: z.object({ 
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      type: InventoryActivityType.optional(), // Add activity type filter
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional() // Add product filter
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