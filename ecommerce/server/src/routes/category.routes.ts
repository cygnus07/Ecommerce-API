import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { 
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamsSchema,
  categoryProductsQuerySchema
} from '../validations/category.validator.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validate(categoryIdParamsSchema, 'params'), categoryController.getCategoryById);
router.get(
  '/:id/products',
  validate(categoryIdParamsSchema, 'params'),
  validate(categoryProductsQuerySchema, 'query'),
  categoryController.getProductsByCategory
);

// Admin-only routes
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put(
  '/:id',
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  validate(categoryIdParamsSchema, 'params'),
  categoryController.deleteCategory
);

export default router;