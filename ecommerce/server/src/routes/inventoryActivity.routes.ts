import express from 'express';
import { inventoryActivityController } from '../controllers/inventoryActivity.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { inventoryActivityValidators } from '../validators/inventoryActivity.validator.js';
import { paginate } from '../middlewares/pagination.middleware.js';
import { withAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All inventory routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.post(
  '/', 
  validate(inventoryActivityValidators.logActivity),
  withAuth(inventoryActivityController.logActivity)
);

router.get(
  '/product/:productId', 
  validate(inventoryActivityValidators.getProductActivities.params, 'params'),
  validate(inventoryActivityValidators.getProductActivities.query, 'query'),
  paginate,
  inventoryActivityController.getProductActivities
);

router.get(
  '/',
  paginate,
  inventoryActivityController.getAllActivities
);

router.get(
  '/summary', 
  validate(inventoryActivityValidators.getActivitySummary.query, 'query'),
  inventoryActivityController.getActivitySummary
);

export default router;