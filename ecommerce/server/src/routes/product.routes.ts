import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { 
  productCreateSchema, 
  productUpdateSchema, 
  productIdParamsSchema,
  productQuerySchema
} from '../validators/product.validator.js';
import { upload } from '../utils/fileUpload.js';
import { auth } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/permission.middleware.js';

const router = Router();

// Create a new product (Admin only)
router.post(
  '/',
  auth,
  checkPermission('admin'),
  upload.array('images', 5),
  validate(productCreateSchema),
  productController.createProduct
);

// Get all products (Public)
router.get(
  '/',
  validate(productQuerySchema, 'query'),
  productController.getAllProducts
);

// Get a single product (Public)
router.get(
  '/:id',
  validate(productIdParamsSchema, 'params'),
  productController.getProductById
);

// Update a product (Admin only)
router.put(
  '/:id',
  auth,
  checkPermission('admin'),
  upload.array('images', 5),
  validate(productIdParamsSchema, 'params'),
  validate(productUpdateSchema),
  productController.updateProduct
);

// Delete a product (Admin only)
router.delete(
  '/:id',
  auth,
  checkPermission('admin'),
  validate(productIdParamsSchema, 'params'),
  productController.deleteProduct
);

export default router;