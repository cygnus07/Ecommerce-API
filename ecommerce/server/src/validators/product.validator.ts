import Joi from 'joi';

// Common validation patterns
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const skuPattern = /^[A-Z0-9-]+$/;

export const productIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Product ID must be a valid hexadecimal',
    'string.length': 'Product ID must be 24 characters long',
    'any.required': 'Product ID is required'
  })
});

export const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  price: Joi.string().pattern(decimalPattern).required().messages({
    'string.empty': 'Price is required',
    'string.pattern.base': 'Price must be a valid decimal number with up to 2 decimal places'
  }),
  categoryId: Joi.string().hex().length(24).messages({
    'string.hex': 'Category ID must be a valid hexadecimal',
    'string.length': 'Category ID must be 24 characters long'
  }),
  sku: Joi.string().pattern(skuPattern).required().messages({
    'string.empty': 'SKU is required',
    'string.pattern.base': 'SKU can only contain uppercase letters, numbers and hyphens'
  }),
  stockQuantity: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative'
  }),
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': 'isActive must be a boolean'
  }),
  tags: Joi.string().max(500).messages({
    'string.max': 'Tags cannot exceed 500 characters'
  }),
  specifications: Joi.string().messages({
    'string.base': 'Specifications must be a valid JSON string'
  }),
  discount: Joi.number().min(0).max(100).default(0).messages({
    'number.base': 'Discount must be a number',
    'number.min': 'Discount cannot be negative',
    'number.max': 'Discount cannot exceed 100'
  }),
  removeImages: Joi.string().messages({
    'string.base': 'Remove images must be a comma-separated string'
  })
});

export const productUpdateSchema = productCreateSchema.keys({
  name: Joi.string().min(2).max(100).messages({
    'string.empty': 'Product name cannot be empty',
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  description: Joi.string().min(10).max(2000).messages({
    'string.empty': 'Description cannot be empty',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  price: Joi.string().pattern(decimalPattern).messages({
    'string.empty': 'Price cannot be empty',
    'string.pattern.base': 'Price must be a valid decimal number with up to 2 decimal places'
  }),
  sku: Joi.string().pattern(skuPattern).messages({
    'string.empty': 'SKU cannot be empty',
    'string.pattern.base': 'SKU can only contain uppercase letters, numbers and hyphens'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided to update'
});

export const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  sort: Joi.string().valid(
    'name', 'price', 'createdAt', 'updatedAt', 'stockQuantity'
  ).default('createdAt').messages({
    'string.base': 'Sort must be a string',
    'any.only': 'Sort must be one of: name, price, createdAt, updatedAt, stockQuantity'
  }),
  order: Joi.string().valid('asc', 'desc').default('desc').messages({
    'string.base': 'Order must be a string',
    'any.only': 'Order must be either "asc" or "desc"'
  }),
  category: Joi.string().hex().length(24).messages({
    'string.hex': 'Category ID must be a valid hexadecimal',
    'string.length': 'Category ID must be 24 characters long'
  }),
  minPrice: Joi.number().min(0).messages({
    'number.base': 'Minimum price must be a number',
    'number.min': 'Minimum price cannot be negative'
  }),
  maxPrice: Joi.number().min(0).messages({
    'number.base': 'Maximum price must be a number',
    'number.min': 'Maximum price cannot be negative'
  }),
  search: Joi.string().max(100).messages({
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  tags: Joi.string().max(500).messages({
    'string.max': 'Tags filter cannot exceed 500 characters'
  }),
  inStock: Joi.string().valid('true', 'false').messages({
    'string.base': 'In stock filter must be a string',
    'any.only': 'In stock filter must be either "true" or "false"'
  })
});