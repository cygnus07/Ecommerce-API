import Joi from 'joi';

// Common validation patterns
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().pattern(emailPattern).required().messages({
    'string.empty': 'Email is required',
    'string.pattern.base': 'Please enter a valid email address'
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    'string.empty': 'Password is required',
    'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().pattern(emailPattern).required().messages({
    'string.empty': 'Email is required',
    'string.pattern.base': 'Please enter a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required'
  })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().pattern(emailPattern).messages({
    'string.pattern.base': 'Please enter a valid email address'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  address: Joi.string().max(200).messages({
    'string.max': 'Address cannot exceed 200 characters'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided to update'
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required'
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.empty': 'New password is required',
    'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  })
});

export const adminUpdateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().pattern(emailPattern).messages({
    'string.pattern.base': 'Please enter a valid email address'
  }),
  role: Joi.string().valid('customer', 'admin').messages({
    'any.only': 'Role must be either customer or admin'
  }),
  isActive: Joi.boolean().messages({
    'boolean.base': 'isActive must be a boolean'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided to update'
});

export const userIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'User ID must be a valid hexadecimal',
    'string.length': 'User ID must be 24 characters long',
    'any.required': 'User ID is required'
  })
});