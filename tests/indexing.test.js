import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Note from '../src/models/Note.js';
import Post from '../src/models/Post.js';

/**
 * Helper to recursively search an execution plan tree for a specific stage
 */
const findPlanStage = (plan, targetStage) => {
  if (!plan) return null;
  if (plan.stage === targetStage) return plan;
  if (plan.inputStage) {
    const found = findPlanStage(plan.inputStage, targetStage);
    if (found) return found;
  }
  if (Array.isArray(plan.inputStages)) {
    for (const child of plan.inputStages) {
      const found = findPlanStage(child, targetStage);
      if (found) return found;
    }
  }
  return null;
};

describe('MongoDB Indexing & Execution Plans Verification', () => {
  beforeAll(async () => {
    // Ensure all Mongoose schema indexes are synced
    await User.syncIndexes();
    await Note.syncIndexes();
    await Post.syncIndexes();
  });

  describe('Index Definitions Inspection', () => {
    it('should have { email: 1 } unique index and { createdAt: -1 } on User collection', async () => {
      const indexes = await User.collection.indexes();
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain('email_1');
      expect(indexNames).toContain('createdAt_-1');

      const emailIndex = indexes.find((i) => i.name === 'email_1');
      expect(emailIndex.unique).toBe(true);
    });

    it('should have { userId: 1, createdAt: -1 } compound index and { createdAt: -1 } on Note collection', async () => {
      const indexes = await Note.collection.indexes();
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain('userId_1_createdAt_-1');
      expect(indexNames).toContain('createdAt_-1');
    });

    it('should have { userId: 1, createdAt: -1 } compound index and { createdAt: -1 } on Post collection', async () => {
      const indexes = await Post.collection.indexes();
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain('userId_1_createdAt_-1');
      expect(indexNames).toContain('createdAt_-1');
    });
  });

  describe('Query Execution Plans via explain("executionStats")', () => {
    it('User login lookup by email should execute IXSCAN using email_1 index', async () => {
      await User.create({
        name: 'Indexed User',
        email: 'indexed@example.com',
        password: 'Password@123'
      });

      const explanation = await User.find({ email: 'indexed@example.com' }).explain('executionStats');
      const winningPlan = explanation.queryPlanner.winningPlan;

      const ixscan = findPlanStage(winningPlan, 'IXSCAN');
      expect(ixscan).toBeDefined();
      expect(ixscan.stage).toBe('IXSCAN');
      expect(ixscan.indexName).toBe('email_1');
    });

    it('User notes listing should execute IXSCAN using compound index { userId: 1, createdAt: -1 }', async () => {
      const sampleUserId = new mongoose.Types.ObjectId();
      await Note.create({
        title: 'Indexed Note',
        content: 'Content',
        userId: sampleUserId
      });

      const explanation = await Note.find({ userId: sampleUserId })
        .sort({ createdAt: -1 })
        .limit(10)
        .explain('executionStats');

      const winningPlan = explanation.queryPlanner.winningPlan;
      const ixscan = findPlanStage(winningPlan, 'IXSCAN');

      expect(ixscan).toBeDefined();
      expect(ixscan.stage).toBe('IXSCAN');
      expect(ixscan.indexName).toBe('userId_1_createdAt_-1');
    });

    it('Admin all-notes listing should execute IXSCAN using createdAt_-1 index', async () => {
      const explanation = await Note.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .explain('executionStats');

      const winningPlan = explanation.queryPlanner.winningPlan;
      const ixscan = findPlanStage(winningPlan, 'IXSCAN');

      expect(ixscan).toBeDefined();
      expect(ixscan.stage).toBe('IXSCAN');
      expect(ixscan.indexName).toBe('createdAt_-1');
    });
  });
});
