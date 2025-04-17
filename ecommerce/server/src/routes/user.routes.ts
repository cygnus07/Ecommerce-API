import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminUpdateUserSchema
} from '../validators/user.validator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.post('/refresh-token', validate(refreshTokenSchema), userController.refreshToken);

// Authenticated routes
router.use(authenticate);
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);

// Admin routes
router.use(authorize('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validate(adminUpdateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;