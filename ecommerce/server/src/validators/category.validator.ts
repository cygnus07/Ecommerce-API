import Joi from 'joi';

// Common validation patterns
const namePattern = /^[a-zA-Z0-9\s\-&]+$/;

export const createCategorySchema = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.pattern.base': 'Name can only contain letters, numbers, spaces, hyphens, and ampersands',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  parentId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null)
    .messages({
      'string.hex': 'Parent ID must be a valid hexadecimal',
      'string.length': 'Parent ID must be 24 characters long'
    })
});

export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.pattern.base': 'Name can only contain letters, numbers, spaces, hyphens, and ampersands',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  parentId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null)
    .messages({
      'string.hex': 'Parent ID must be a valid hexadecimal',
      'string.length': 'Parent ID must be 24 characters long'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided to update'
});

export const categoryIdParamsSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Category ID must be a valid hexadecimal',
      'string.length': 'Category ID must be 24 characters long',
      'any.required': 'Category ID is required'
    })
});

export const categoryProductsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  tree: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'Tree must be either "true" or "false"'
    })
});