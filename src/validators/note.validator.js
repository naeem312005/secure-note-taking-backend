import { body } from 'express-validator';

export const validateNotePayload = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Note title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isString()
    .withMessage('Content must be a string')
];

export const validateUpdateNotePayload = [
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
