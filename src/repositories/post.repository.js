import Post from '../models/Post.js';

class PostRepository {
  async create(postData) {
    return Post.create(postData);
  }

  async findById(id) {
    return Post.findById(id).populate('userId', 'name email').exec();
  }

  async findPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    // Uses index { createdAt: -1 }
    const [data, total] = await Promise.all([
      Post.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Post.countDocuments()
    ]);
    return { data, total };
  }

  async findByUserId(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    // Uses compound index { userId: 1, createdAt: -1 }
    const [data, total] = await Promise.all([
      Post.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Post.countDocuments({ userId })
    ]);
    return { data, total };
  }

  async count(filter = {}) {
    return Post.countDocuments(filter);
  }

  async updateById(id, updateData) {
    return Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  async deleteById(id) {
    return Post.findByIdAndDelete(id).exec();
  }

  async deleteByUserId(userId) {
    return Post.deleteMany({ userId }).exec();
  }
}

export default new PostRepository();
