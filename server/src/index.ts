import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initializeMediasoupWorker } from './config/mediasoup.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { cleanupInactiveRooms } from './services/roomService.js';
import roomRoutes from './routes/room.routes.js';
import youtubeRoutes from './routes/youtube.routes.js';
import config from './config/env.js';
import logger from './utils/logger.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'MoviesTogether API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use('/api/rooms', roomRoutes);
app.use('/api/youtube', youtubeRoutes);

// Setup Socket.io handlers
setupSocketHandlers(io);

// Periodic room cleanup job
setInterval(() => {
  cleanupInactiveRooms();
}, config.ROOM_CLEANUP_INTERVAL_MS);

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize mediasoup worker
    await initializeMediasoupWorker();
    logger.info('mediasoup worker initialized');

    // Start server
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`CORS origin: ${config.CORS_ORIGIN}`);
    });
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
