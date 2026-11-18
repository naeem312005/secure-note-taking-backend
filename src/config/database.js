import mongoose from 'mongoose';

let memoryServerInstance = null;

export const ATLAS_FALLBACK_URI = 'mongodb+srv://naimulhasan0179_db_user:6S9jb1DyUKxwqPss@cluster0.x8twxlz.mongodb.net/careguide_notes?retryWrites=true&w=majority';

/**
 * Connect to MongoDB database
 */
export const connectDB = async (uri = process.env.MONGODB_URI) => {
  const targetUri = uri || process.env.MONGODB_URI || ATLAS_FALLBACK_URI;

  try {
    const conn = await mongoose.connect(targetUri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 30000
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);

    // Ensure database is populated with sample data/admin
    try {
      const { autoSeed } = await import('../scripts/autoSeed.js');
      await autoSeed();
    } catch (seedErr) {
      console.warn('[AutoSeed Warning]:', seedErr.message);
    }

    return conn;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(`[Database Warning] Could not connect to local/configured MongoDB (${error.message}).`);
      console.log('[Database] Starting built-in in-memory MongoDB engine for zero-setup local development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] Connected to In-Memory MongoDB: ${memUri}`);

      // Auto-seed default admin and sample data
      try {
        const { autoSeed } = await import('../scripts/autoSeed.js');
        await autoSeed();
      } catch (seedErr) {
        console.warn('[AutoSeed Warning]:', seedErr.message);
      }

      return conn;
    }

    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
    console.log('[Database] MongoDB Disconnected successfully');
  } catch (error) {
    console.error(`[Database Error] Disconnection error: ${error.message}`);
  }
};
