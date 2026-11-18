import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, interests } = req.body;
      const result = await authService.register({ name, email, password, interests });
      return sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      return sendSuccess(res, 200, 'Current user profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
