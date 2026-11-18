import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in dev/test, manage explicitly in prod
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout instead of 30 seconds
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
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
    console.log('[Database] MongoDB Disconnected successfully');
  } catch (error) {
    console.error(`[Database Error] Disconnection error: ${error.message}`);
  }
};
