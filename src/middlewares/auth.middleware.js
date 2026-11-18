import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication token missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired. Please login again'));
      }
      return next(ApiError.unauthorized('Invalid authentication token'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('User belonging to this token no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
