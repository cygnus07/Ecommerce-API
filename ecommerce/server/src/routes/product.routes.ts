import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validation.middleware.js';
import { 
  productCreateSchema, 
  productUpdateSchema, 
  productIdParamsSchema,
  productQuerySchema
} from '../validators/product.validator.js';
import { upload } from "../utils/fileUpload.js";
import { auth } from '../middlewares/auth.middleware.js'; // Now importing the auth object

const router = Router();

// Option 1: Using the combined admin middleware
router.post(
  '/',
  auth.admin, // Uses both authenticate and authorize
  // upload.array('images', 5),
  validate(productCreateSchema),
  productController.createProduct
);

// Option 2: Using separate middlewares (alternative)
// router.post(
//   '/',
//   auth.authenticate,
//   auth.authorize(['admin']),
//   upload.array('images', 5),
//   validate(productCreateSchema),
//   productController.createProduct
// );

// Get all products (Public)
router.get(
  '/',
  // auth.admin,

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
  auth.admin, // Using combined middleware
  upload.array('images', 5),
  validate(productIdParamsSchema),
  validate(productUpdateSchema),
  productController.updateProduct
);

// Delete a product (Admin only)
router.delete(
  '/:id',
  auth.admin, // Using combined middleware
  validate(productIdParamsSchema),
  productController.deleteProduct
);

export default router;