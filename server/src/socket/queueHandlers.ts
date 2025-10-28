import { Socket, Server } from 'socket.io';
import * as queueService from '../services/queueService.js';
import * as syncService from '../services/syncService.js';
import * as roomService from '../services/roomService.js';
import * as chatService from '../services/chatService.js';
import { QueueAddPayload, QueueRemovePayload, QueueReorderPayload } from '../types/socket.types.js';
import logger from '../utils/logger.js';

const queueAddTimestamps = new Map<string, number[]>();
const QUEUE_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const QUEUE_RATE_LIMIT_MAX = 10;

const checkQueueRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const timestamps = queueAddTimestamps.get(userId) || [];

  const recentTimestamps = timestamps.filter(ts => now - ts < QUEUE_RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= QUEUE_RATE_LIMIT_MAX) {
    return false;
  }

  recentTimestamps.push(now);
  queueAddTimestamps.set(userId, recentTimestamps);
  return true;
};

export const handleQueueAdd = (socket: Socket, io: Server, payload: QueueAddPayload) => {
  const { roomId, videoId, title, thumbnail, duration, addedBy } = payload;
  const { userId } = socket.data;

  // Check rate limit
  if (!checkQueueRateLimit(userId)) {
    socket.emit('queue:rate_limit', {
      error: true,
      type: 'rate_limit',
      message: 'Adding videos too quickly. Please wait.',
      retryable: true,
      retryAfter: QUEUE_RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  const success = queueService.addVideoToQueue(roomId, videoId, title, thumbnail, duration, addedBy);

  if (success) {
    const queue = queueService.getQueue(roomId);
    io.to(roomId).emit('queue:updated', { queue });
    logger.info(`Video ${videoId} added to queue in room ${roomId}`);
  } else {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to add video to queue',
      retryable: false,
    });
  }
};

export const handleQueueRemove = (socket: Socket, io: Server, payload: QueueRemovePayload) => {
  const { roomId, videoId } = payload;

  const success = queueService.removeVideoFromQueue(roomId, videoId);

  if (success) {
    const queue = queueService.getQueue(roomId);
    io.to(roomId).emit('queue:updated', { queue });
    logger.info(`Video ${videoId} removed from queue in room ${roomId}`);
  }
};

export const handleQueueReorder = (socket: Socket, io: Server, payload: QueueReorderPayload) => {
  const { roomId, oldIndex, newIndex } = payload;

  const success = queueService.reorderQueue(roomId, oldIndex, newIndex);

  if (success) {
    const queue = queueService.getQueue(roomId);
    io.to(roomId).emit('queue:updated', { queue });
    logger.debug(`Queue reordered in room ${roomId}: ${oldIndex} -> ${newIndex}`);
  }
};

export const handleQueuePlayNext = (socket: Socket, io: Server, payload: { roomId: string }) => {
  const { roomId } = payload;

  const nextVideo = queueService.removeNextVideo(roomId);

  if (nextVideo) {
    // Update playback state with new video
    syncService.updatePlaybackState(roomId, 'play', 0, nextVideo.videoId);

    // Broadcast video change
    io.to(roomId).emit('video:change', {
      videoId: nextVideo.videoId,
      title: nextVideo.title,
    });

    // Update queue
    const queue = queueService.getQueue(roomId);
    io.to(roomId).emit('queue:updated', { queue });

    // Add system message
    const systemMessage = chatService.addSystemMessage(roomId, `Now playing: ${nextVideo.title}`);
    if (systemMessage) {
      io.to(roomId).emit('chat:new-message', systemMessage);
    }

    logger.info(`Next video ${nextVideo.videoId} started in room ${roomId}`);
  } else {
    // Queue is empty
    logger.info(`Queue finished in room ${roomId}`);
  }
};

export const handleQueueClear = (socket: Socket, io: Server, payload: { roomId: string }) => {
  const { roomId } = payload;
  const { userId } = socket.data;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Only host can clear queue
  if (room.hostUserId !== userId) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Only the host can clear the queue',
      retryable: false,
    });
    return;
  }

  queueService.clearQueue(roomId);
  const queue = queueService.getQueue(roomId);
  io.to(roomId).emit('queue:updated', { queue });

  logger.info(`Queue cleared in room ${roomId} by host ${userId}`);
};
