import User from '../models/User.js';

class UserRepository {
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async create(userData) {
    return User.create(userData);
  }

  async findPaginated({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(filter)
    ]);
    return { data, total };
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id).exec();
  }

  async countAdmins() {
    return User.countDocuments({ role: 'admin' });
  }
}

export default new UserRepository();
