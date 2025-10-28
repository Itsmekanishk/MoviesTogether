import { Socket, Server } from 'socket.io';
import * as syncService from '../services/syncService.js';
import * as roomService from '../services/roomService.js';
import { VideoControlPayload, VideoSeekPayload, PositionUpdatePayload, BufferingPayload } from '../types/socket.types.js';
import { getCurrentTimestamp } from '../utils/timeUtils.js';
import logger from '../utils/logger.js';

export const handleVideoPlay = (socket: Socket, io: Server, payload: VideoControlPayload) => {
  const { roomId, userId, currentTime } = payload;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Update playback state
  syncService.updatePlaybackState(roomId, 'play', currentTime);

  const participant = roomService.getParticipant(roomId, userId);

  // Broadcast to all clients
  io.to(roomId).emit('sync:broadcast', {
    action: 'play',
    currentTime,
    videoId: room.playbackState.videoId,
    serverTimestamp: getCurrentTimestamp(),
    initiatedBy: participant?.username || 'Unknown',
  });

  logger.debug(`Video play in room ${roomId} at ${currentTime}s by ${userId}`);
};

export const handleVideoPause = (socket: Socket, io: Server, payload: VideoControlPayload) => {
  const { roomId, userId, currentTime } = payload;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Update playback state
  syncService.updatePlaybackState(roomId, 'pause', currentTime);

  const participant = roomService.getParticipant(roomId, userId);

  // Broadcast to all clients
  io.to(roomId).emit('sync:broadcast', {
    action: 'pause',
    currentTime,
    videoId: room.playbackState.videoId,
    serverTimestamp: getCurrentTimestamp(),
    initiatedBy: participant?.username || 'Unknown',
  });

  logger.debug(`Video pause in room ${roomId} at ${currentTime}s by ${userId}`);
};

export const handleVideoSeek = (socket: Socket, io: Server, payload: VideoSeekPayload) => {
  const { roomId, userId, seekTo } = payload;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Update playback state
  syncService.updatePlaybackState(roomId, 'seek', seekTo);

  const participant = roomService.getParticipant(roomId, userId);

  // Broadcast to all clients
  io.to(roomId).emit('sync:broadcast', {
    action: 'seek',
    currentTime: seekTo,
    videoId: room.playbackState.videoId,
    serverTimestamp: getCurrentTimestamp(),
    initiatedBy: participant?.username || 'Unknown',
  });

  logger.debug(`Video seek in room ${roomId} to ${seekTo}s by ${userId}`);
};

export const handlePositionUpdate = (socket: Socket, io: Server, payload: PositionUpdatePayload) => {
  const { roomId, userId, currentTime, isPlaying } = payload;

  const { needsResync, correctTime, correctPlaying } = syncService.checkDrift(roomId, currentTime, isPlaying);

  if (needsResync) {
    // Send resync command to this specific client
    socket.emit('sync:force-resync', {
      currentTime: correctTime,
      isPlaying: correctPlaying,
    });
    logger.debug(`Forcing resync for user ${userId} in room ${roomId}`);
  }
};

const bufferingUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

export const handleBuffering = (socket: Socket, io: Server, payload: BufferingPayload) => {
  const { roomId, userId, username, duration } = payload;

  // Only trigger group pause if buffering exceeds 5 seconds
  if (duration < 5000) return;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Add to buffering users
  if (!bufferingUsers.has(roomId)) {
    bufferingUsers.set(roomId, new Set());
  }
  bufferingUsers.get(roomId)!.add(userId);

  // Pause group
  syncService.updatePlaybackState(roomId, 'pause', room.playbackState.currentTime);

  const bufferingUsernames = Array.from(bufferingUsers.get(roomId)!)
    .map(uid => roomService.getParticipant(roomId, uid)?.username)
    .filter(name => name);

  // Broadcast group pause
  io.to(roomId).emit('sync:group-pause', {
    reason: 'buffering',
    usernames: bufferingUsernames,
  });

  logger.info(`Group pause in room ${roomId} due to buffering by ${username}`);
};

export const handleBufferResolved = (socket: Socket, io: Server, payload: { roomId: string; userId: string }) => {
  const { roomId, userId } = payload;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Remove from buffering users
  if (bufferingUsers.has(roomId)) {
    bufferingUsers.get(roomId)!.delete(userId);

    // If no more buffering users, resume playback
    if (bufferingUsers.get(roomId)!.size === 0) {
      bufferingUsers.delete(roomId);

      // Calculate expected position
      const expectedTime = syncService.getExpectedPlaybackPosition(roomId);
      syncService.updatePlaybackState(roomId, 'play', expectedTime);

      // Broadcast group resume
      io.to(roomId).emit('sync:group-resume', {
        currentTime: expectedTime,
      });

      logger.info(`Group resume in room ${roomId}, all buffering resolved`);
    }
  }
};
