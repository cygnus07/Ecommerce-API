import Joi from 'joi';

// Common validation patterns
const addressPattern = /^[a-zA-Z0-9\s\.,'-]{5,100}$/;
const couponPattern = /^[A-Z0-9]{5,15}$/;

export const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    street: Joi.string().pattern(addressPattern).required().messages({
      'string.pattern.base': 'Street must be 5-100 alphanumeric characters',
      'any.required': 'Street is required'
    }),
    city: Joi.string().pattern(/^[a-zA-Z\s-]{2,50}$/).required().messages({
      'string.pattern.base': 'City must be 2-50 letters and hyphens',
      'any.required': 'City is required'
    }),
    state: Joi.string().pattern(/^[a-zA-Z\s-]{2,50}$/).required().messages({
      'string.pattern.base': 'State must be 2-50 letters and hyphens',
      'any.required': 'State is required'
    }),
    postalCode: Joi.string().pattern(/^[0-9]{5,10}$/).required().messages({
      'string.pattern.base': 'Postal code must be 5-10 digits',
      'any.required': 'Postal code is required'
    }),
    country: Joi.string().pattern(/^[a-zA-Z\s-]{2,50}$/).required().messages({
      'string.pattern.base': 'Country must be 2-50 letters and hyphens',
      'any.required': 'Country is required'
    })
  }).required().messages({
    'object.base': 'Shipping address must be an object',
    'any.required': 'Shipping address is required'
  }),
  paymentMethod: Joi.string().valid('card', 'cash', 'bank').default('card').messages({
    'any.only': 'Payment method must be card, cash, or bank'
  }),
  couponCode: Joi.string().pattern(couponPattern).optional().allow(null).messages({
    'string.pattern.base': 'Coupon code must be 5-15 uppercase alphanumeric characters'
  })
});

export const confirmOrderSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Order ID must be a valid hexadecimal',
    'string.length': 'Order ID must be 24 characters long',
    'any.required': 'Order ID is required'
  }),
  paymentIntentId: Joi.when('paymentMethod', {
    is: 'card',
    then: Joi.string().required().messages({
      'any.required': 'Payment intent ID is required for card payments'
    }),
    otherwise: Joi.string().optional()
  })
});

export const orderIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Order ID must be a valid hexadecimal',
    'string.length': 'Order ID must be 24 characters long',
    'any.required': 'Order ID is required'
  })
});

export const orderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').required().messages({
    'any.only': 'Status must be one of: pending, confirmed, shipped, delivered, cancelled',
    'any.required': 'Status is required'
  })
});

export const ordersQuerySchema = Joi.object({
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
  status: Joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled').messages({
    'any.only': 'Status must be one of: pending, confirmed, shipped, delivered, cancelled'
  })
});