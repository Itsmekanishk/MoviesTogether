import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  YOUTUBE_API_KEY: string;
  MAX_ROOM_PARTICIPANTS: number;
  ROOM_CLEANUP_INTERVAL_MS: number;
  ROOM_INACTIVITY_TIMEOUT_MS: number;
  MEDIASOUP_LISTEN_IP: string;
  MEDIASOUP_ANNOUNCED_IP: string;
  MEDIASOUP_MIN_PORT: number;
  MEDIASOUP_MAX_PORT: number;
  CORS_ORIGIN: string;
}

const config: Config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'development_secret_change_in_production',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  MAX_ROOM_PARTICIPANTS: parseInt(process.env.MAX_ROOM_PARTICIPANTS || '20', 10),
  ROOM_CLEANUP_INTERVAL_MS: parseInt(process.env.ROOM_CLEANUP_INTERVAL_MS || '600000', 10), // 10 minutes
  ROOM_INACTIVITY_TIMEOUT_MS: parseInt(process.env.ROOM_INACTIVITY_TIMEOUT_MS || '86400000', 10), // 24 hours
  MEDIASOUP_LISTEN_IP: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
  MEDIASOUP_ANNOUNCED_IP: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
  MEDIASOUP_MIN_PORT: parseInt(process.env.MEDIASOUP_MIN_PORT || '40000', 10),
  MEDIASOUP_MAX_PORT: parseInt(process.env.MEDIASOUP_MAX_PORT || '49999', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

// Validate critical configuration
if (!config.YOUTUBE_API_KEY && config.NODE_ENV === 'production') {
  logger.warn('YOUTUBE_API_KEY not set. YouTube search functionality will be unavailable.');
}

export default config;
