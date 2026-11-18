import userRepository from '../repositories/user.repository.js';
import noteRepository from '../repositories/note.repository.js';
import postRepository from '../repositories/post.repository.js';
import { ApiError } from '../utils/apiError.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';
import bcrypt from 'bcryptjs';

class AdminService {
  async createUser({ name, email, password, role = 'user', interests = [] }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    return userRepository.create({
      name,
      email,
      password,
      role,
      interests
    });
  }

  async listUsers(query) {
    const { page, limit } = getPaginationParams(query);
    const { data, total } = await userRepository.findPaginated({
      page,
      limit,
      sort: { createdAt: -1 }
    });
    const pagination = buildPaginationMetadata(total, page, limit);
    return { data, pagination };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateUser(id, updateData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if email changed and is taken
    if (updateData.email && updateData.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing) {
        throw ApiError.conflict('Email is already taken by another account');
      }
    }

    // Prevent demoting the last active admin
    if (updateData.role && updateData.role !== 'admin' && user.role === 'admin') {
      const adminCount = await userRepository.countAdmins();
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot change role of the last remaining active administrator');
      }
    }

    // If updating password, hash it securely
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    return userRepository.updateById(id, updateData);
  }

  async deleteUser(targetUserId, currentAdminId) {
    // Safeguard 1: Prevent self-deletion
    if (targetUserId.toString() === currentAdminId.toString()) {
      throw ApiError.badRequest('Accidental self-deletion prevented: Administrators cannot delete their own account');
    }

    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Safeguard 2: Prevent deleting the last remaining admin
    if (user.role === 'admin') {
      const adminCount = await userRepository.countAdmins();
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot delete the last remaining active administrator');
      }
    }

    // Cascaded deletion: Delete user's notes and posts to maintain database integrity
    await Promise.all([
      noteRepository.deleteByUserId(targetUserId),
      postRepository.deleteByUserId(targetUserId),
      userRepository.deleteById(targetUserId)
    ]);

    return { message: 'User and all associated notes and posts deleted successfully' };
  }

  async getDashboardStats() {
    const [totalUsers, totalNotes, totalPosts] = await Promise.all([
      userRepository.count(),
      noteRepository.count(),
      postRepository.count()
    ]);

    return {
      totalUsers,
      totalNotes,
      totalPosts
    };
  }
}

export default new AdminService();
