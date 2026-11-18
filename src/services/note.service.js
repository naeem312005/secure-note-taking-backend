import noteRepository from '../repositories/note.repository.js';
import { ApiError } from '../utils/apiError.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';

class NoteService {
  async createNote(userId, { title, content }) {
    return noteRepository.create({
      title,
      content,
      userId
    });
  }

  async getUserNotes(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { data, total } = await noteRepository.findUserNotesPaginated(userId, page, limit);
    const pagination = buildPaginationMetadata(total, page, limit);
    return { data, pagination };
  }

  async getNoteById(noteId, user) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      throw ApiError.notFound('Note not found');
    }

    // Role-based access control & ownership verification
    const isOwner = note.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Forbidden: You can only access your own notes');
    }

    return note;
  }

  async updateNote(noteId, user, { title, content }) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      throw ApiError.notFound('Note not found');
    }

    // Role-based access control & ownership verification
    const isOwner = note.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Forbidden: You can only modify your own notes');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    return noteRepository.updateById(noteId, updateData);
  }

  async deleteNote(noteId, user) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      throw ApiError.notFound('Note not found');
    }

    const isOwner = note.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Forbidden: You can only delete your own notes');
    }

    await noteRepository.deleteById(noteId);
    return { message: 'Note deleted successfully' };
  }

  async getAllNotesForAdmin(query) {
    const { page, limit } = getPaginationParams(query);
    const { data, total } = await noteRepository.findAllNotesPaginated(page, limit);
    const pagination = buildPaginationMetadata(total, page, limit);
    return { data, pagination };
  }
}

export default new NoteService();
