import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import noteRoutes from './note.routes.js';
import postRoutes from './post.routes.js';
import adminRoutes from './admin.routes.js';
import aggregationRoutes from './aggregation.routes.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ATLAS_FALLBACK_URI } from '../config/database.js';

const router = Router();

// Health check endpoint for deployment monitoring
router.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = dbStates[mongoose.connection.readyState] || 'unknown';
  return sendSuccess(res, 200, 'Service is healthy and running', {
    status: 'healthy',
    database: state,
    databaseReady: mongoose.connection.readyState === 1,
    hasMongoUri: !!(process.env.MONGODB_URI || ATLAS_FALLBACK_URI),
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
