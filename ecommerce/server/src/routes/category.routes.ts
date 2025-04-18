import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { 
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamsSchema,
  categoryProductsQuerySchema
} from '../validators/category.validator.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validate(categoryIdParamsSchema), categoryController.getCategoryById);
router.get(
  '/:id/products',
  validate(categoryIdParamsSchema),
  validate(categoryProductsQuerySchema),
  categoryController.getProductsByCategory
);

// Admin-only routes
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put(
  '/:id',
  validate(categoryIdParamsSchema),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  validate(categoryIdParamsSchema),
  categoryController.deleteCategory
);

export default router;