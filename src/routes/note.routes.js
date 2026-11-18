import { Router } from 'express';
import noteController from '../controllers/note.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateObjectId, validatePagination } from '../validators/common.validator.js';
import { validateNotePayload, validateUpdateNotePayload } from '../validators/note.validator.js';

const router = Router();

// All note operations require authentication
router.use(authenticate);

router.post('/', validateNotePayload, validate, noteController.createNote);
router.get('/', validatePagination, validate, noteController.getUserNotes);
router.get('/:id', validateObjectId('id'), validate, noteController.getNoteById);
router.put('/:id', validateObjectId('id'), validateUpdateNotePayload, validate, noteController.updateNote);
router.delete('/:id', validateObjectId('id'), validate, noteController.deleteNote);

export default router;
