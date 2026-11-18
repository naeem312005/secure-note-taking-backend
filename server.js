import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/database.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

let server;

const startServer = async () => {
  try {
    // Start HTTP server immediately so cloud platforms (Render, etc.) detect open port & pass healthchecks
    server = app.listen(PORT, HOST, () => {
      console.log(`[Server] CareGuide Secure Note-Taking API running on http://${HOST}:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Connect to database
    await connectDB();
  } catch (error) {
    console.error(`[Server Error] Database connection issue on startup: ${error.message}`);
    // In production, do not immediately exit if DB takes a moment; retry gracefully
    if (process.env.NODE_ENV === 'production') {
      console.log('[Server] Will attempt database reconnection in 5 seconds...');
      setTimeout(async () => {
        try {
          await connectDB();
          console.log('[Server] Database successfully reconnected.');
        } catch (retryErr) {
          console.error('[Server Error] Reconnection failed:', retryErr.message);
        }
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`[Server] ${signal} signal received: closing HTTP server...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
