import { Router } from 'express';
import aggregationController from '../controllers/aggregation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = Router();

// Aggregation endpoints require admin privileges
router.use(authenticate, authorize('admin'));

// SCENARIO 1: Group users by interests
router.get('/users-by-interest', aggregationController.groupByInterests);

export default router;
