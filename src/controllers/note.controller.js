import noteService from '../services/note.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

class NoteController {
  async createNote(req, res, next) {
    try {
      const { title, content } = req.body;
      const note = await noteService.createNote(req.user._id, { title, content });
      return sendSuccess(res, 201, 'Note created successfully', note);
    } catch (error) {
      next(error);
    }
  }

  async getUserNotes(req, res, next) {
    try {
      const { data, pagination } = await noteService.getUserNotes(req.user._id, req.query);
      return sendSuccess(res, 200, 'User notes retrieved successfully', data, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req, res, next) {
    try {
      const note = await noteService.getNoteById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Note retrieved successfully', note);
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req, res, next) {
    try {
      const { title, content } = req.body;
      const updatedNote = await noteService.updateNote(req.params.id, req.user, { title, content });
      return sendSuccess(res, 200, 'Note updated successfully', updatedNote);
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req, res, next) {
    try {
      const result = await noteService.deleteNote(req.params.id, req.user);
      return sendSuccess(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  async getAllNotes(req, res, next) {
    try {
      const { data, pagination } = await noteService.getAllNotesForAdmin(req.query);
      return sendSuccess(res, 200, 'All notes retrieved successfully for admin', data, pagination);
    } catch (error) {
      next(error);
    }
  }
}

export default new NoteController();
