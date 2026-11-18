import postRepository from '../repositories/post.repository.js';
import { ApiError } from '../utils/apiError.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';

class PostService {
  async createPost(userId, { title, content }) {
    return postRepository.create({
      title,
      content,
      userId
    });
  }

  async getAllPosts(query) {
    const { page, limit } = getPaginationParams(query);
    const { data, total } = await postRepository.findPaginated(page, limit);
    const pagination = buildPaginationMetadata(total, page, limit);
    return { data, pagination };
  }

  async getPostById(postId) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }
    return post;
  }

  async updatePost(postId, user, { title, content }) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const isOwner = post.userId._id
      ? post.userId._id.toString() === user._id.toString()
      : post.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Forbidden: You can only update your own posts');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    return postRepository.updateById(postId, updateData);
  }

  async deletePost(postId, user) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    const isOwner = post.userId._id
      ? post.userId._id.toString() === user._id.toString()
      : post.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Forbidden: You can only delete your own posts');
    }

    await postRepository.deleteById(postId);
    return { message: 'Post deleted successfully' };
  }
}

export default new PostService();
