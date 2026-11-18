import { Router } from 'express';
import authRoutes from './auth.routes.js';
import noteRoutes from './note.routes.js';
import postRoutes from './post.routes.js';
import adminRoutes from './admin.routes.js';
import aggregationRoutes from './aggregation.routes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

// Health check endpoint for deployment monitoring
router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Service is healthy and running', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);
router.use('/posts', postRoutes);
router.use('/admin', adminRoutes);
router.use('/aggregations', aggregationRoutes);

export default router;
