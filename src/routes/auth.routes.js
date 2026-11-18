import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validateRegister, validate, authController.register);
router.post('/login', authRateLimiter, validateLogin, validate, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
