import { Router } from 'express';
import postController from '../controllers/post.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateObjectId, validatePagination } from '../validators/common.validator.js';
import { validatePostPayload, validateUpdatePostPayload } from '../validators/post.validator.js';

const router = Router();

// Public routes
router.get('/', validatePagination, validate, postController.getAllPosts);
router.get('/:id', validateObjectId('id'), validate, postController.getPostById);

// Protected routes (require login)
router.post('/', authenticate, validatePostPayload, validate, postController.createPost);
router.put('/:id', authenticate, validateObjectId('id'), validateUpdatePostPayload, validate, postController.updatePost);
router.delete('/:id', authenticate, validateObjectId('id'), validate, postController.deletePost);

export default router;
