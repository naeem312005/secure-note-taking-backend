import userRepository from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/jwt.js';

class AuthService {
  async register({ name, email, password, interests = [] }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // Security requirement: Prevent public registration from assigning admin role
    const newUser = await userRepository.create({
      name,
      email,
      password,
      role: 'user', // Forced to user
      interests
    });

    const token = signToken({
      id: newUser._id,
      role: newUser.role,
      email: newUser.email
    });

    return {
      user: newUser,
      token
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    // Remove password before returning
    const userObj = user.toJSON();

    return {
      user: userObj,
      token
    };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

export default new AuthService();
