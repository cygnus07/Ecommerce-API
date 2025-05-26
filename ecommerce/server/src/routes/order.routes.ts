// import { Router } from 'express';
// import { orderController } from '../controllers/order.controller.js';
// import { authenticate, authorize } from '../middlewares/auth.middleware.js';
// import { validate } from '../middlewares/validation.middleware.js';
// import { 
//   createOrderSchema,
//   confirmOrderSchema,
//   orderIdParamsSchema,
//   orderStatusSchema,
//   ordersQuerySchema
// } from '../validators/order.validator.js';

// const router = Router();

// // Authenticated user routes
// router.use(authenticate);

// router.post('/', validate(createOrderSchema), orderController.createOrder);
// router.post('/confirm', validate(confirmOrderSchema), orderController.confirmOrder);
// router.get('/user', validate(ordersQuerySchema, 'query'), orderController.getUserOrders);
// router.get('/:id', validate(orderIdParamsSchema, 'params'), orderController.getOrderById);

// // Admin-only routes
// router.use(authorize('admin'));

// router.get('/', validate(ordersQuerySchema, 'query'), orderController.getAllOrders);
// router.put(
//   '/:id/status',
//   validate(orderIdParamsSchema, 'params'),
//   validate(orderStatusSchema),
//   orderController.updateOrderStatus
// );
// router.post(
//   '/:id/invoice',
//   validate(orderIdParamsSchema, 'params'),
//   orderController.generateInvoice
// );

// export default router;