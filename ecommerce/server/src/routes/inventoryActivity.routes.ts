// src/routes/inventoryActivity.routes.ts
import express from 'express';
import { inventoryActivityController } from '../controllers/inventoryActivity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { inventoryActivityValidators } from '../validators/inventoryActivity.validator.js';
import { paginate } from '../middleware/pagination.middleware.js';

const router = express.Router();

// All inventory routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

router.post(
  '/', 
  validate(inventoryActivityValidators.logActivity), 
  inventoryActivityController.logActivity
);

router.get(
  '/product/:productId', 
  validate(inventoryActivityValidators.getProductActivities),
  paginate,
  inventoryActivityController.getProductActivities
);

router.get('/', paginate, inventoryActivityController.getAllActivities);

router.get(
  '/summary', 
  validate(inventoryActivityValidators.getActivitySummary),
  inventoryActivityController.getActivitySummary
);

export default router;