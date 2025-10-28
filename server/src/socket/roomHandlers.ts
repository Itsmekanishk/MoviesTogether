import { Socket, Server } from 'socket.io';
import * as roomService from '../services/roomService.js';
import * as chatService from '../services/chatService.js';
import { isValidRoomId, isValidUsername } from '../utils/validators.js';
import { RoomJoinPayload } from '../types/socket.types.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

export const handleRoomJoin = (socket: Socket, io: Server, payload: RoomJoinPayload) => {
  const { roomId, userId, username, isGuest } = payload;

  // Validate inputs
  if (!isValidRoomId(roomId)) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Invalid room code',
      retryable: false,
    });
    return;
  }

  if (!isValidUsername(username)) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_username',
      message: 'Invalid username. Use 1-20 alphanumeric characters, spaces, underscores, or hyphens.',
      retryable: true,
    });
    return;
  }

  // Check if room exists
  if (!roomService.roomExists(roomId)) {
    socket.emit('room:error', {
      error: true,
      type: 'room_not_found',
      message: 'Room not found. It may have been deleted or expired.',
      retryable: false,
    });
    return;
  }

  // Add participant to room
  const success = roomService.addParticipant(roomId, userId, username, socket.id, isGuest);

  if (!success) {
    const room = roomService.getRoom(roomId);
    if (room && room.participants.size >= config.MAX_ROOM_PARTICIPANTS) {
      socket.emit('room:error', {
        error: true,
        type: 'room_full',
        message: `This room is full (${config.MAX_ROOM_PARTICIPANTS}/${config.MAX_ROOM_PARTICIPANTS} participants)`,
        retryable: false,
      });
    } else {
      socket.emit('room:error', {
        error: true,
        type: 'invalid_input',
        message: 'Failed to join room',
        retryable: true,
      });
    }
    return;
  }

  // Join socket.io room
  socket.join(roomId);

  // Store room and user info in socket data
  socket.data.roomId = roomId;
  socket.data.userId = userId;
  socket.data.username = username;

  // Get full room state
  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Send room state to joining client
  const participantsList = Array.from(room.participants.values()).map(p => ({
    userId: p.userId,
    username: p.username,
    isGuest: p.isGuest,
    socketId: p.socketId,
  }));

  socket.emit('room:joined', {
    roomId,
    hostUserId: room.hostUserId,
    participants: participantsList,
    playbackState: room.playbackState,
    queue: room.queue,
    chatHistory: chatService.getChatHistory(roomId, 50),
  });

  // Broadcast to others that someone joined
  socket.to(roomId).emit('participant:joined', {
    userId,
    username,
    isGuest,
    socketId: socket.id,
  });

  // Add system message
  const systemMessage = chatService.addSystemMessage(roomId, `${username} joined the party`);
  if (systemMessage) {
    io.to(roomId).emit('chat:new-message', systemMessage);
  }

  logger.info(`User ${username} (${userId}) joined room ${roomId}`);
};

export const handleRoomLeave = (socket: Socket, io: Server) => {
  const { roomId, userId, username } = socket.data;

  if (!roomId || !userId) return;

  // Remove participant
  roomService.removeParticipant(roomId, userId);

  // Leave socket.io room
  socket.leave(roomId);

  // Broadcast to others
  socket.to(roomId).emit('participant:left', { userId, username });

  // Add system message
  const systemMessage = chatService.addSystemMessage(roomId, `${username} left the party`);
  if (systemMessage) {
    io.to(roomId).emit('chat:new-message', systemMessage);
  }

  // Check if room became empty and should be cleaned up
  const room = roomService.getRoom(roomId);
  if (room && room.participants.size === 0) {
    // Room will be cleaned up by periodic cleanup job
    logger.info(`Room ${roomId} is now empty`);
  }

  logger.info(`User ${username} (${userId}) left room ${roomId}`);
};

export const handleRoomKick = (socket: Socket, io: Server, payload: { roomId: string; targetUserId: string }) => {
  const { roomId, targetUserId } = payload;
  const { userId: kickerUserId } = socket.data;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Check if kicker is host
  if (room.hostUserId !== kickerUserId) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Only the host can kick participants',
      retryable: false,
    });
    return;
  }

  const targetParticipant = roomService.getParticipant(roomId, targetUserId);
  if (!targetParticipant) return;

  // Notify kicked user
  io.to(targetParticipant.socketId).emit('room:kicked');

  // Remove participant
  roomService.removeParticipant(roomId, targetUserId);

  // Broadcast to others
  socket.to(roomId).emit('participant:left', {
    userId: targetUserId,
    username: targetParticipant.username,
  });

  // Add system message
  const systemMessage = chatService.addSystemMessage(roomId, `${targetParticipant.username} was kicked`);
  if (systemMessage) {
    io.to(roomId).emit('chat:new-message', systemMessage);
  }

  logger.info(`User ${targetUserId} was kicked from room ${roomId} by ${kickerUserId}`);
};

export const handleHostChange = (socket: Socket, io: Server, payload: { roomId: string; newHostUserId: string }) => {
  const { roomId, newHostUserId } = payload;
  const { userId } = socket.data;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Check if sender is current host
  if (room.hostUserId !== userId) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Only the host can transfer host status',
      retryable: false,
    });
    return;
  }

  const success = roomService.changeHost(roomId, newHostUserId);
  if (success) {
    const newHost = roomService.getParticipant(roomId, newHostUserId);
    io.to(roomId).emit('room:host-changed', { newHostUserId });

    // Add system message
    const systemMessage = chatService.addSystemMessage(roomId, `Host changed to ${newHost?.username}`);
    if (systemMessage) {
      io.to(roomId).emit('chat:new-message', systemMessage);
    }
  }
};

export const handleRoomDelete = (socket: Socket, io: Server, payload: { roomId: string }) => {
  const { roomId } = payload;
  const { userId } = socket.data;

  const room = roomService.getRoom(roomId);
  if (!room) return;

  // Check if sender is host
  if (room.hostUserId !== userId) {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Only the host can delete the room',
      retryable: false,
    });
    return;
  }

  // Notify all participants
  io.to(roomId).emit('room:deleted');

  // Delete room
  roomService.deleteRoom(roomId);

  logger.info(`Room ${roomId} deleted by host ${userId}`);
};

export const handleHeartbeat = (socket: Socket) => {
  const { roomId, userId } = socket.data;

  if (roomId && userId) {
    roomService.updateParticipantHeartbeat(roomId, userId);
  }
};
