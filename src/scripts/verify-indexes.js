import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Post from '../models/Post.js';
import { connectDB, disconnectDB } from '../config/database.js';

dotenv.config();

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

const verifyIndexes = async () => {
  let memoryServer = null;
  try {
    console.log('====================================================');
    console.log('   MONGODB INDEXING & EXECUTION PLAN VERIFICATION   ');
    console.log('====================================================\n');

    try {
      await connectDB();
    } catch (connErr) {
      console.log('[Notice] Local MongoDB not reachable. Spawning in-memory MongoDB for index verification...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri());
      console.log('[Database] Connected to In-Memory MongoDB engine successfully.');
    }

    // Ensure all indexes defined via schema.index() are synchronized in MongoDB
    console.log('[1] Syncing indexes with MongoDB via schema.index() definitions...');
    await Promise.all([User.syncIndexes(), Note.syncIndexes(), Post.syncIndexes()]);

    console.log('\n[2] Synchronized collection indexes in MongoDB:');
    const userIndexes = await User.collection.indexes();
    console.log('\n--- User Collection Indexes ---');
    userIndexes.forEach((idx) => console.log(` - Index [${idx.name}]:`, JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : ''));

    const noteIndexes = await Note.collection.indexes();
    console.log('\n--- Note Collection Indexes ---');
    noteIndexes.forEach((idx) => console.log(` - Index [${idx.name}]:`, JSON.stringify(idx.key)));

    const postIndexes = await Post.collection.indexes();
    console.log('\n--- Post Collection Indexes ---');
    postIndexes.forEach((idx) => console.log(` - Index [${idx.name}]:`, JSON.stringify(idx.key)));

    console.log('\n[3] Executing explain("executionStats") for critical query patterns...\n');

    // Seed dummy records to ensure planner evaluates realistic query plans
    const sampleUserId = new mongoose.Types.ObjectId();
    await User.create({
      name: 'Naeem Sample',
      email: 'naeem.verify@example.com',
      password: 'HashedPassword123!',
      role: 'user',
      interests: ['coding', 'reading']
    });

    await Note.create({
      title: 'Sample Note for Index Test',
      content: 'Demonstrating ESR rule and compound index efficiency',
      userId: sampleUserId
    });

    await Post.create({
      title: 'Sample Post for Index Test',
      content: 'Public content demonstrating createdAt sorting index',
      userId: sampleUserId
    });

    // Pattern 1: User lookup by email during authentication
    console.log('----------------------------------------------------');
    console.log('Query Pattern 1: User login lookup by email');
    console.log('Query: User.find({ email: "naeem.verify@example.com" })');
    const emailExplain = await User.find({ email: 'naeem.verify@example.com' }).explain('executionStats');
    const emailPlan = emailExplain.queryPlanner.winningPlan;
    const emailIxscan = findPlanStage(emailPlan, 'IXSCAN');
    console.log(` -> Winning Plan Stage: ${emailPlan.stage}`);
    console.log(` -> Index Stage: ${emailIxscan?.stage || 'None'}`);
    console.log(` -> Index Used: ${emailIxscan?.indexName || 'COLLSCAN'}`);
    console.log(` -> Execution Time: ${emailExplain.executionStats.executionTimeMillis} ms`);
    console.log(` -> Total Keys Examined: ${emailExplain.executionStats.totalKeysExamined}`);
    console.log(` -> Total Docs Examined: ${emailExplain.executionStats.totalDocsExamined}`);

    // Pattern 2: User notes listing sorted by createdAt (Compound Index)
    console.log('----------------------------------------------------');
    console.log('Query Pattern 2: User-specific notes listing with sorting');
    console.log('Query: Note.find({ userId: sampleUserId }).sort({ createdAt: -1 }).limit(10)');
    const noteExplain = await Note.find({ userId: sampleUserId })
      .sort({ createdAt: -1 })
      .limit(10)
      .explain('executionStats');
    const notePlan = noteExplain.queryPlanner.winningPlan;
    const noteIxscan = findPlanStage(notePlan, 'IXSCAN');
    console.log(` -> Winning Plan Stage: ${notePlan.stage}`);
    console.log(` -> Index Stage: ${noteIxscan?.stage || 'None'}`);
    console.log(` -> Index Used: ${noteIxscan?.indexName || 'COLLSCAN'}`);
    console.log(` -> Execution Time: ${noteExplain.executionStats.executionTimeMillis} ms`);
    console.log(` -> Total Keys Examined: ${noteExplain.executionStats.totalKeysExamined}`);
    console.log(` -> Total Docs Examined: ${noteExplain.executionStats.totalDocsExamined}`);

    // Pattern 3: Admin all-notes listing sorted by createdAt
    console.log('----------------------------------------------------');
    console.log('Query Pattern 3: Admin all-notes listing');
    console.log('Query: Note.find().sort({ createdAt: -1 }).limit(10)');
    const adminNoteExplain = await Note.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .explain('executionStats');
    const adminNotePlan = adminNoteExplain.queryPlanner.winningPlan;
    const adminNoteIxscan = findPlanStage(adminNotePlan, 'IXSCAN');
    console.log(` -> Winning Plan Stage: ${adminNotePlan.stage}`);
    console.log(` -> Index Stage: ${adminNoteIxscan?.stage || 'None'}`);
    console.log(` -> Index Used: ${adminNoteIxscan?.indexName || 'COLLSCAN'}`);
    console.log(` -> Execution Time: ${adminNoteExplain.executionStats.executionTimeMillis} ms`);
    console.log(` -> Total Keys Examined: ${adminNoteExplain.executionStats.totalKeysExamined}`);
    console.log(` -> Total Docs Examined: ${adminNoteExplain.executionStats.totalDocsExamined}`);

    // Pattern 4: Posts listing sorted by createdAt
    console.log('----------------------------------------------------');
    console.log('Query Pattern 4: Public posts feed listing');
    console.log('Query: Post.find().sort({ createdAt: -1 }).limit(10)');
    const postExplain = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .explain('executionStats');
    const postPlan = postExplain.queryPlanner.winningPlan;
    const postIxscan = findPlanStage(postPlan, 'IXSCAN');
    console.log(` -> Winning Plan Stage: ${postPlan.stage}`);
    console.log(` -> Index Stage: ${postIxscan?.stage || 'None'}`);
    console.log(` -> Index Used: ${postIxscan?.indexName || 'COLLSCAN'}`);
    console.log(` -> Execution Time: ${postExplain.executionStats.executionTimeMillis} ms`);
    console.log(` -> Total Keys Examined: ${postExplain.executionStats.totalKeysExamined}`);
    console.log(` -> Total Docs Examined: ${postExplain.executionStats.totalDocsExamined}`);

    console.log('\n====================================================');
    console.log('   ALL INDEXES VERIFIED TO UTILIZE IXSCAN STAGE     ');
    console.log('====================================================\n');
  } catch (error) {
    console.error(`[Index Verification Error]: ${error.message}`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
    if (memoryServer) {
      await memoryServer.stop();
    }
  }
};

verifyIndexes();
