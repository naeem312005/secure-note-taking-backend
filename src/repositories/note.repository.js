import Note from '../models/Note.js';

class NoteRepository {
  async create(noteData) {
    return Note.create(noteData);
  }

  async findById(id) {
    return Note.findById(id).exec();
  }

  async findUserNotesPaginated(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    // Uses compound index { userId: 1, createdAt: -1 }
    const [data, total] = await Promise.all([
      Note.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Note.countDocuments({ userId })
    ]);
    return { data, total };
  }

  async findAllNotesPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    // Uses index { createdAt: -1 }
    const [data, total] = await Promise.all([
      Note.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Note.countDocuments()
    ]);
    return { data, total };
  }

  async count(filter = {}) {
    return Note.countDocuments(filter);
  }

  async updateById(id, updateData) {
    return Note.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  async deleteById(id) {
    return Note.findByIdAndDelete(id).exec();
  }

  async deleteByUserId(userId) {
    return Note.deleteMany({ userId }).exec();
  }
}

export default new NoteRepository();
