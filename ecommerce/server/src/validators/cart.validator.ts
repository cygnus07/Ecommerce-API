import Joi from 'joi';

// Validation for adding item to cart
export const addToCartSchema = Joi.object({
  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Product ID must be a valid hexadecimal',
      'string.length': 'Product ID must be 24 characters long',
      'any.required': 'Product ID is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1'
    })
});

// Validation for updating cart item quantity
export const updateCartItemSchema = Joi.object({
  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Product ID must be a valid hexadecimal',
      'string.length': 'Product ID must be 24 characters long',
      'any.required': 'Product ID is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    })
});

// Optional: Schema for cart item ID param validation
export const cartItemParamsSchema = Joi.object({
  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Product ID must be a valid hexadecimal',
      'string.length': 'Product ID must be 24 characters long',
      'any.required': 'Product ID is required'
    })
});