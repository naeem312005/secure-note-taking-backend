import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';

describe('Authentication & Authorization Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password@123',
    interests: ['coding', 'music']
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with hashed password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.password).toBeUndefined(); // Must never expose password
      expect(res.body.data.token).toBeDefined();

      // Check DB directly
      const savedUser = await User.findOne({ email: testUser.email }).select('+password');
      expect(savedUser.password).not.toBe(testUser.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });

    it('should reject registration with existing email (409 Conflict)', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should prevent privilege escalation: public registration cannot create admin', async () => {
      const adminAttempt = {
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password@123',
        role: 'admin' // Attempting to grant admin role
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(adminAttempt);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('user'); // Must remain user
    });

    it('should fail validation with invalid email and short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should log in successfully with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject login with incorrect password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid Bearer token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(testUser);
      const token = registerRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject request with missing token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token format (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with expired token (401)', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: '60c72b2f9b1d8b2badbee555', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });
  });
});
