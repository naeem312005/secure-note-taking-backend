import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import noteController from '../controllers/note.controller.js';
import aggregationController from '../controllers/aggregation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateObjectId, validatePagination } from '../validators/common.validator.js';
import { validateCreateUserByAdmin, validateUpdateUserByAdmin } from '../validators/user.validator.js';

const router = Router();

// All admin routes require both Authentication and 'admin' Role
router.use(authenticate, authorize('admin'));

// System metrics / statistics
router.get('/stats', adminController.getStats);

// User management endpoints
router.post('/users', validateCreateUserByAdmin, validate, adminController.createUser);
router.get('/users', validatePagination, validate, adminController.listUsers);
router.get('/users/:id', validateObjectId('id'), validate, adminController.getUserById);
router.put('/users/:id', validateObjectId('id'), validateUpdateUserByAdmin, validate, adminController.updateUser);
router.delete('/users/:id', validateObjectId('id'), validate, adminController.deleteUser);

// Admin note management (view all notes across users)
router.get('/notes', validatePagination, validate, noteController.getAllNotes);

// Aggregation Scenario 1: Group Users by Interests
router.get('/aggregations/users-by-interest', aggregationController.groupByInterests);

// Aggregation Scenario 2: User Posts using $lookup
router.get('/users/:id/posts', validateObjectId('id'), validate, aggregationController.getUserPosts);

export default router;
