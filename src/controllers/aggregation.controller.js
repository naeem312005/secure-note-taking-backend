import aggregationService from '../services/aggregation.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

class AggregationController {
  /**
   * Scenario 1: Group Users by Interests
   * GET /api/admin/aggregations/users-by-interest
   */
  async groupByInterests(req, res, next) {
    try {
      const data = await aggregationService.groupUsersByInterests();
      return sendSuccess(res, 200, 'Users successfully grouped by interests via single aggregation pipeline', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scenario 2: User Posts using $lookup
   * GET /api/admin/users/:id/posts
   */
  async getUserPosts(req, res, next) {
    try {
      const data = await aggregationService.getUserPostsWithLookup(req.params.id);
      return sendSuccess(res, 200, 'User posts retrieved successfully via single $lookup aggregation pipeline', data);
    } catch (error) {
      next(error);
    }
  }
}

export default new AggregationController();
