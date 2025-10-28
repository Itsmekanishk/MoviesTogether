import { Room, RoomStore, Participant } from '../types/room.types.js';
import { generateRoomId } from '../utils/idGenerator.js';
import { getCurrentTimestamp } from '../utils/timeUtils.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const rooms: RoomStore = {};

export const createRoom = (hostUserId: string): string => {
  const roomId = generateRoomId();
  const now = getCurrentTimestamp();

  rooms[roomId] = {
    roomId,
    createdAt: now,
    lastActivityAt: now,
    hostUserId,
    participants: new Map<string, Participant>(),
    playbackState: {
      videoId: null,
      currentTime: 0,
      isPlaying: false,
      lastUpdateTimestamp: now,
    },
    queue: [],
    chatHistory: [],
  };

  logger.info(`Room created: ${roomId} by user ${hostUserId}`);
  return roomId;
};

export const getRoom = (roomId: string): Room | null => {
  return rooms[roomId] || null;
};

export const roomExists = (roomId: string): boolean => {
  return !!rooms[roomId];
};

export const deleteRoom = (roomId: string): void => {
  if (rooms[roomId]) {
    delete rooms[roomId];
    logger.info(`Room deleted: ${roomId}`);
  }
};

export const updateRoomActivity = (roomId: string): void => {
  const room = getRoom(roomId);
  if (room) {
    room.lastActivityAt = getCurrentTimestamp();
  }
};

export const addParticipant = (
  roomId: string,
  userId: string,
  username: string,
  socketId: string,
  isGuest: boolean
): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  // Check capacity
  if (room.participants.size >= config.MAX_ROOM_PARTICIPANTS) {
    return false;
  }

  const now = getCurrentTimestamp();
  const participant: Participant = {
    userId,
    username,
    isGuest,
    socketId,
    joinedAt: now,
    lastHeartbeat: now,
    isReconnecting: false,
  };

  room.participants.set(userId, participant);
  updateRoomActivity(roomId);

  logger.info(`Participant ${username} (${userId}) joined room ${roomId}`);
  return true;
};

export const removeParticipant = (roomId: string, userId: string): void => {
  const room = getRoom(roomId);
  if (!room) {
    return;
  }

  const participant = room.participants.get(userId);
  if (participant) {
    room.participants.delete(userId);
    logger.info(`Participant ${participant.username} (${userId}) left room ${roomId}`);

    // Handle host transfer if host left
    if (room.hostUserId === userId && room.participants.size > 0) {
      // Assign host to next participant (by join order)
      const participants = Array.from(room.participants.values()).sort((a, b) => a.joinedAt - b.joinedAt);
      room.hostUserId = participants[0].userId;
      logger.info(`Host transferred to ${participants[0].username} in room ${roomId}`);
    }
  }

  updateRoomActivity(roomId);
};

export const getParticipant = (roomId: string, userId: string): Participant | null => {
  const room = getRoom(roomId);
  return room ? room.participants.get(userId) || null : null;
};

export const updateParticipantHeartbeat = (roomId: string, userId: string): void => {
  const participant = getParticipant(roomId, userId);
  if (participant) {
    participant.lastHeartbeat = getCurrentTimestamp();
  }
};

export const setParticipantReconnecting = (roomId: string, userId: string, reconnecting: boolean): void => {
  const participant = getParticipant(roomId, userId);
  if (participant) {
    participant.isReconnecting = reconnecting;
  }
};

export const changeHost = (roomId: string, newHostUserId: string): boolean => {
  const room = getRoom(roomId);
  if (!room || !room.participants.has(newHostUserId)) {
    return false;
  }

  room.hostUserId = newHostUserId;
  logger.info(`Host changed to user ${newHostUserId} in room ${roomId}`);
  return true;
};

export const cleanupInactiveRooms = (): void => {
  const now = getCurrentTimestamp();
  const inactiveRoomIds: string[] = [];

  for (const [roomId, room] of Object.entries(rooms)) {
    if (now - room.lastActivityAt > config.ROOM_INACTIVITY_TIMEOUT_MS) {
      inactiveRoomIds.push(roomId);
    }
  }

  inactiveRoomIds.forEach(roomId => {
    deleteRoom(roomId);
    logger.info(`Cleaned up inactive room: ${roomId}`);
  });

  if (inactiveRoomIds.length > 0) {
    logger.info(`Cleaned up ${inactiveRoomIds.length} inactive rooms`);
  }
};

export const getAllRooms = (): Room[] => {
  return Object.values(rooms);
};
