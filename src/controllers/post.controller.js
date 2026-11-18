import postService from '../services/post.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

class PostController {
  async createPost(req, res, next) {
    try {
      const { title, content } = req.body;
      const post = await postService.createPost(req.user._id, { title, content });
      return sendSuccess(res, 201, 'Post created successfully', post);
    } catch (error) {
      next(error);
    }
  }

  async getAllPosts(req, res, next) {
    try {
      const { data, pagination } = await postService.getAllPosts(req.query);
      return sendSuccess(res, 200, 'Posts retrieved successfully', data, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const post = await postService.getPostById(req.params.id);
      return sendSuccess(res, 200, 'Post retrieved successfully', post);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    try {
      const { title, content } = req.body;
      const post = await postService.updatePost(req.params.id, req.user, { title, content });
      return sendSuccess(res, 200, 'Post updated successfully', post);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const result = await postService.deletePost(req.params.id, req.user);
      return sendSuccess(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }
}

export default new PostController();
