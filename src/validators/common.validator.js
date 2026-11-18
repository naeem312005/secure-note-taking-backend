import { param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Validate MongoDB ObjectId in request parameters
 * @param {string} paramName - Name of the route parameter (default 'id')
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${paramName}: must be a valid 24-character hexadecimal MongoDB ObjectId`)
];

/**
 * Validate optional pagination query parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
];
