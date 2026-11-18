import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

class AggregationService {
  /**
   * SCENARIO 1: Group Users by Interests
   * Uses exactly ONE User.aggregate() call.
   * Does NOT use find(), findOne(), populate(), or in-memory grouping.
   * 
   * Pipeline stages:
   * 1. $match: Filter users with non-empty interests array
   * 2. $unwind: Deconstruct the interests array
   * 3. $match: Filter out empty strings or invalid interest entries
   * 4. $group: Group documents by interest name, accumulate unique user names
   * 5. $project: Shape response with interest as _id, users array, and totalUsers
   * 6. $sort: Sort by totalUsers descending, then interest name ascending
   */
  async groupUsersByInterests() {
    const pipeline = [
      {
        $match: {
          interests: { $exists: true, $type: 'array', $ne: [] }
        }
      },
      {
        $unwind: '$interests'
      },
      {
        $match: {
          interests: { $type: 'string', $nin: ['', null] }
        }
      },
      {
        $group: {
          _id: '$interests',
          users: { $addToSet: '$name' }
        }
      },
      {
        $project: {
          _id: 1,
          users: 1,
          totalUsers: { $size: '$users' }
        }
      },
      {
        $sort: {
          totalUsers: -1,
          _id: 1
        }
      }
    ];

    const results = await User.aggregate(pipeline);
    return results;
  }

  /**
   * SCENARIO 2: User Posts using $lookup
   * Uses a single aggregation pipeline with $lookup.
   * Starting collection: User
   * Joined collection: Posts
   * Does NOT use populate() or separate find() queries.
   * 
   * Pipeline stages:
   * 1. $match: Find target user by _id
   * 2. $lookup: Join 'posts' collection on localField '_id' === foreignField 'userId'
   * 3. $project: Format user details and posts array, omitting password
   */
  async getUserPostsWithLookup(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.badRequest('Invalid user ObjectId');
    }

    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          createdAt: 1,
          posts: {
            $map: {
              input: '$posts',
              as: 'post',
              in: {
                _id: '$$post._id',
                title: '$$post.title',
                content: '$$post.content',
                createdAt: '$$post.createdAt'
              }
            }
          }
        }
      }
    ];

    const results = await User.aggregate(pipeline);
    if (!results || results.length === 0) {
      throw ApiError.notFound('User not found');
    }

    return results[0];
  }
}

export default new AggregationService();
