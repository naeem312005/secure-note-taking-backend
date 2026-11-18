import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to check express-validator validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return next(ApiError.unprocessable('Validation failed', formattedErrors));
  }
  next();
};
