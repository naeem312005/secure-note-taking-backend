import { ApiError } from '../utils/apiError.js';

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles - List of authorized roles (e.g., 'admin', 'user')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Forbidden: You do not have permission to perform this action'));
    }

    next();
  };
};
