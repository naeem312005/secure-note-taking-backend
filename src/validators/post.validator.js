import { body } from 'express-validator';

export const validatePostPayload = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Post title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isString()
    .withMessage('Content must be a string')
];

export const validateUpdatePostPayload = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isString()
    .withMessage('Content must be a string')
];
