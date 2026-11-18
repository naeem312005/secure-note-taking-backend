import { ApiError } from '../utils/apiError.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Centralized application error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid identifier: ${err.value}`;
    error = ApiError.badRequest(message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = ApiError.unprocessable('Validation Error', formattedErrors);
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${field} already exists`;
    error = ApiError.conflict(message, [{ field, message: `${field} is already in use` }]);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  // Log server errors (500)
  if (statusCode === 500) {
    console.error('[Unhandled Server Error]', err);
  }

  return sendError(res, statusCode, message, errors);
};

/**
 * 404 Route Not Found middleware
 */
export const notFoundHandler = (req, res, next) => {
  return next(ApiError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl}`));
};
