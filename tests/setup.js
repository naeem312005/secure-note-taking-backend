import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(uri);

  // Sync schema indexes so explain and index tests work seamlessly
  const models = mongoose.modelNames();
  for (const modelName of models) {
    await mongoose.model(modelName).init();
  }
});

beforeEach(async () => {
  // Clear all collections between test cases
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
