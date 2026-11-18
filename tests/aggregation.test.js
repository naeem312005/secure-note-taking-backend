import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import aggregationService from '../src/services/aggregation.service.js';

describe('MongoDB Aggregation Scenarios Tests', () => {
  let adminToken;
  let naeemId;
  let rahimId;

  beforeEach(async () => {
    // Create Admin
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password@123',
      role: 'admin',
      interests: ['management']
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password@123'
    });
    adminToken = adminLogin.body.data.token;

    // Seed test users matching assignment example
    const naeem = await User.create({
      name: 'Naeem',
      email: 'naeem@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['coding', 'reading']
    });
    naeemId = naeem._id.toString();

    const rahim = await User.create({
      name: 'Rahim',
      email: 'rahim@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['coding', 'chess']
    });
    rahimId = rahim._id.toString();

    const karim = await User.create({
      name: 'Karim',
      email: 'karim@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['reading']
    });

    // User with no interests
    await User.create({
      name: 'NoInterestsUser',
      email: 'empty@example.com',
      password: 'Password@123',
      role: 'user',
      interests: []
    });

    // Create Posts for Naeem
    await Post.create([
      {
        title: 'Laravel Tutorial',
        content: 'Building modern APIs with Laravel',
        userId: naeem._id
      },
      {
        title: 'MongoDB Aggregation Guide',
        content: 'Advanced single-pipeline aggregations',
        userId: naeem._id
      }
    ]);

    // Create Post for Rahim
    await Post.create({
      title: 'Chess Strategies',
      content: 'Mastering the Sicilian Defense',
      userId: rahim._id
    });
  });

  describe('Scenario 1: Group Users by Interests (GET /api/admin/aggregations/users-by-interest)', () => {
    it('should group users by interests using exactly ONE aggregate() call and NO find/findOne/populate', async () => {
      const aggregateSpy = vi.spyOn(User, 'aggregate');
      const findSpy = vi.spyOn(User, 'find');
      const findOneSpy = vi.spyOn(User, 'findOne');

      // Call aggregationService directly to isolate database aggregation pipeline
      const results = await aggregationService.groupUsersByInterests();

      // Constraint verification
      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).not.toHaveBeenCalled();
      expect(findOneSpy).not.toHaveBeenCalled();

      // Verify data grouping
      expect(Array.isArray(results)).toBe(true);

      const codingGroup = results.find((g) => g._id === 'coding');
      const readingGroup = results.find((g) => g._id === 'reading');
      const chessGroup = results.find((g) => g._id === 'chess');

      expect(codingGroup).toBeDefined();
      expect(codingGroup.totalUsers).toBe(2);
      expect(codingGroup.users).toContain('Naeem');
      expect(codingGroup.users).toContain('Rahim');

      expect(readingGroup).toBeDefined();
      expect(readingGroup.totalUsers).toBe(2);
      expect(readingGroup.users).toContain('Naeem');
      expect(readingGroup.users).toContain('Karim');

      expect(chessGroup).toBeDefined();
      expect(chessGroup.totalUsers).toBe(1);
      expect(chessGroup.users).toContain('Rahim');

      aggregateSpy.mockRestore();
      findSpy.mockRestore();
      findOneSpy.mockRestore();
    });

    it('should expose HTTP endpoint GET /api/admin/aggregations/users-by-interest for admins', async () => {
      const res = await request(app)
        .get('/api/admin/aggregations/users-by-interest')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 2: User Posts using $lookup (GET /api/admin/users/:id/posts)', () => {
    it('should retrieve a user with their posts via single $lookup aggregation pipeline', async () => {
      const aggregateSpy = vi.spyOn(User, 'aggregate');
      const postFindSpy = vi.spyOn(Post, 'find');

      // Test aggregation service directly to verify pipeline constraints
      const result = await aggregationService.getUserPostsWithLookup(naeemId);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(postFindSpy).not.toHaveBeenCalled();

      expect(result.name).toBe('Naeem');
      expect(result.email).toBe('naeem@example.com');
      expect(Array.isArray(result.posts)).toBe(true);
      expect(result.posts.length).toBe(2);

      const postTitles = result.posts.map((p) => p.title);
      expect(postTitles).toContain('Laravel Tutorial');
      expect(postTitles).toContain('MongoDB Aggregation Guide');

      aggregateSpy.mockRestore();
      postFindSpy.mockRestore();
    });

    it('should expose HTTP endpoint GET /api/admin/users/:id/posts for admins', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${naeemId}/posts`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Naeem');
      expect(res.body.data.posts.length).toBe(2);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 404 if user does not exist in $lookup endpoint', async () => {
      const nonExistentId = '60c72b2f9b1d8b2badbee999';
      const res = await request(app)
        .get(`/api/admin/users/${nonExistentId}/posts`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
