import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Note Management & RBAC Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let adminToken;

  beforeEach(async () => {
    // Create User 1
    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'Password@123'
    });
    user1Token = u1Res.body.data.token;
    user1Id = u1Res.body.data.user._id;

    // Create User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'Password@123'
    });
    user2Token = u2Res.body.data.token;
    user2Id = u2Res.body.data.user._id;

    // Create Admin directly
    const adminUser = await User.create({
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

  describe('POST /api/notes', () => {
    it('should create a note for authenticated user', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'First Note',
          content: 'This is my first private note'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('First Note');
      expect(res.body.data.userId).toBe(user1Id);
    });

    it('should reject note creation with missing title or content (422)', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: ''
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/notes', () => {
    it('should list only notes owned by the authenticated user with pagination', async () => {
      // Create 3 notes for User 1
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/notes')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ title: `User 1 Note ${i}`, content: `Content ${i}` });
      }

      // Create 2 notes for User 2
      for (let i = 1; i <= 2; i++) {
        await request(app)
          .post('/api/notes')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ title: `User 2 Note ${i}`, content: `Content ${i}` });
      }

      const res = await request(app)
        .get('/api/notes?page=1&limit=10')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.perPage).toBe(10);
      expect(res.body.pagination.totalPages).toBe(1);

      // Verify all returned notes belong to User 1
      res.body.data.forEach((note) => {
        expect(note.userId).toBe(user1Id);
      });
    });
  });

  describe('Ownership and Authorization on Note Operations', () => {
    let user1NoteId;

    beforeEach(async () => {
      const noteRes = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Secret Note', content: 'Top Secret' });
      user1NoteId = noteRes.body.data._id;
    });

    it('should allow owner to read their note', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Secret Note');
    });

    it('should forbid other regular users from viewing the note (403)', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow admin to view any user note', async () => {
      const res = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Secret Note');
    });

    it('should forbid other users from updating the note (403)', async () => {
      const res = await request(app)
        .put(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Tampered Title' });

      expect(res.status).toBe(403);
    });

    it('should allow owner to update their note', async () => {
      const res = await request(app)
        .put(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should forbid other users from deleting the note (403)', async () => {
      const res = await request(app)
        .delete(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow owner to delete their note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/notes/${user1NoteId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(checkRes.status).toBe(404);
    });

    it('should reject invalid ObjectId format (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/notes/invalid-id-123')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(422); // express-validator rejects parameter format
      expect(res.body.success).toBe(false);
    });
  });
});
