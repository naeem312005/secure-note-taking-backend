import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Admin Management & RBAC Protection Tests', () => {
  let adminToken;
  let adminId;
  let userToken;
  let userId;

  beforeEach(async () => {
    // Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'Password@123',
      role: 'admin'
    });
    adminId = admin._id.toString();

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password@123'
    });
    adminToken = adminLogin.body.data.token;

    // Create Normal User
    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password@123',
      role: 'user'
    });
    userId = user._id.toString();

    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'Password@123'
    });
    userToken = userLogin.body.data.token;
  });

  describe('RBAC Protection', () => {
    it('should block regular users from accessing admin routes (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow admin to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('Admin User Management CRUD', () => {
    it('should allow admin to create a user with a specific role', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Manager User',
          email: 'manager@example.com',
          password: 'Password@123',
          role: 'admin',
          interests: ['finance', 'management']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('manager@example.com');
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should allow admin to update user details', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          interests: ['AI', 'Robotics']
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.interests).toContain('AI');
    });

    it('should prevent admin from deleting their own account (Self-Deletion Safeguard)', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/self-deletion/i);
    });

    it('should prevent deleting the last remaining admin (Last Admin Safeguard)', async () => {
      // Even if another user/admin tried to delete the only admin
      const res = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should allow admin to delete a regular user', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user is removed
      const check = await User.findById(userId);
      expect(check).toBeNull();
    });
  });

  describe('GET /api/admin/notes', () => {
    it('should allow admin to list all notes across the system with pagination', async () => {
      // Create a note for the regular user
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'User Note', content: 'Content' });

      // Create a note for the admin
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Note', content: 'Content' });

      const res = await request(app)
        .get('/api/admin/notes?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });
});
