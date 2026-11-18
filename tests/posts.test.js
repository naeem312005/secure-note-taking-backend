import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Public Posts Module Tests', () => {
  let user1Token;
  let user2Token;
  let adminToken;

  beforeEach(async () => {
    const u1 = await request(app).post('/api/auth/register').send({
      name: 'Author One',
      email: 'author1@example.com',
      password: 'Password@123'
    });
    user1Token = u1.body.data.token;

    const u2 = await request(app).post('/api/auth/register').send({
      name: 'Author Two',
      email: 'author2@example.com',
      password: 'Password@123'
    });
    user2Token = u2.body.data.token;

    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password@123',
      role: 'admin'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password@123'
    });
    adminToken = adminLogin.body.data.token;
  });

  describe('POST /api/posts', () => {
    it('should allow authenticated users to create posts', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'My First Post',
          content: 'Hello World from CareGuide'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My First Post');
    });

    it('should reject unauthenticated post creation (401)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'Should fail'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts', () => {
    it('should allow anyone to read public posts with pagination', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Public Post 1', content: 'Public Content 1' });

      const res = await request(app).get('/api/posts?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('PUT & DELETE /api/posts/:id (Ownership Enforcement)', () => {
    let post1Id;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Original Post', content: 'Original Content' });
      post1Id = res.body.data._id;
    });

    it('should forbid other users from editing post (403)', async () => {
      const res = await request(app)
        .put(`/api/posts/${post1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    it('should allow author to update their post', async () => {
      const res = await request(app)
        .put(`/api/posts/${post1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Author Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Author Updated Title');
    });

    it('should allow admin to update any post', async () => {
      const res = await request(app)
        .put(`/api/posts/${post1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Moderated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Admin Moderated Title');
    });

    it('should forbid other users from deleting post (403)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow author to delete their post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${post1Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
    });
  });
});
