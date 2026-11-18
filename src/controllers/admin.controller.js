import adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

class AdminController {
  async createUser(req, res, next) {
    try {
      const user = await adminService.createUser(req.body);
      return sendSuccess(res, 201, 'User created successfully by admin', user);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const { data, pagination } = await adminService.listUsers(req.query);
      return sendSuccess(res, 200, 'Users retrieved successfully', data, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await adminService.getUserById(req.params.id);
      return sendSuccess(res, 200, 'User details retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      return sendSuccess(res, 200, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await adminService.deleteUser(req.params.id, req.user._id);
      return sendSuccess(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      return sendSuccess(res, 200, 'Admin dashboard statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
