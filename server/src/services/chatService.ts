import { MessageData } from '../types/room.types.js';
import { getRoom, updateRoomActivity } from './roomService.js';
import { generateMessageId } from '../utils/idGenerator.js';
import { getCurrentTimestamp } from '../utils/timeUtils.js';
import { parseTimestamp, isValidMessage } from '../utils/validators.js';
import logger from '../utils/logger.js';

const MAX_CHAT_HISTORY = 200;
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds
const RATE_LIMIT_MAX_MESSAGES = 5;

const userMessageTimestamps = new Map<string, number[]>();

export const checkRateLimit = (userId: string): boolean => {
  const now = getCurrentTimestamp();
  const timestamps = userMessageTimestamps.get(userId) || [];

  // Remove timestamps older than the rate limit window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    return false; // Rate limit exceeded
  }

  // Update with current timestamp
  recentTimestamps.push(now);
  userMessageTimestamps.set(userId, recentTimestamps);

  return true;
};

export const addMessage = (
  roomId: string,
  userId: string,
  username: string,
  content: string
): MessageData | null => {
  const room = getRoom(roomId);
  if (!room) {
    return null;
  }

  if (!isValidMessage(content)) {
    logger.warn(`Invalid message from user ${userId}: length ${content.length}`);
    return null;
  }

  // Check for timestamp in message
  const detectedTimestamp = parseTimestamp(content);
  const messageType = detectedTimestamp !== null ? 'timestamp-link' : 'text';

  const messageData: MessageData = {
    messageId: generateMessageId(),
    userId,
    username,
    content: content.trim(),
    timestamp: getCurrentTimestamp(),
    type: messageType,
    videoTimestamp: detectedTimestamp || undefined,
    reactions: new Map<string, string[]>(),
  };

  room.chatHistory.push(messageData);

  // Keep only last MAX_CHAT_HISTORY messages
  if (room.chatHistory.length > MAX_CHAT_HISTORY) {
    room.chatHistory.shift();
  }

  updateRoomActivity(roomId);
  logger.debug(`Message added in room ${roomId} by ${username}`);

  return messageData;
};

export const addSystemMessage = (roomId: string, content: string): MessageData | null => {
  const room = getRoom(roomId);
  if (!room) {
    return null;
  }

  const messageData: MessageData = {
    messageId: generateMessageId(),
    userId: 'system',
    username: 'System',
    content,
    timestamp: getCurrentTimestamp(),
    type: 'system',
    reactions: new Map<string, string[]>(),
  };

  room.chatHistory.push(messageData);

  if (room.chatHistory.length > MAX_CHAT_HISTORY) {
    room.chatHistory.shift();
  }

  return messageData;
};

export const addReaction = (roomId: string, messageId: string, emoji: string, userId: string): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  const message = room.chatHistory.find(msg => msg.messageId === messageId);
  if (!message) {
    return false;
  }

  const usersForEmoji = message.reactions.get(emoji) || [];

  // Check if user already reacted with this emoji
  if (usersForEmoji.includes(userId)) {
    return false;
  }

  // Check max 6 different emoji types
  if (message.reactions.size >= 6 && !message.reactions.has(emoji)) {
    return false;
  }

  usersForEmoji.push(userId);
  message.reactions.set(emoji, usersForEmoji);

  updateRoomActivity(roomId);
  logger.debug(`Reaction ${emoji} added by ${userId} to message ${messageId} in room ${roomId}`);

  return true;
};

export const removeReaction = (roomId: string, messageId: string, emoji: string, userId: string): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  const message = room.chatHistory.find(msg => msg.messageId === messageId);
  if (!message) {
    return false;
  }

  const usersForEmoji = message.reactions.get(emoji);
  if (!usersForEmoji) {
    return false;
  }

  const userIndex = usersForEmoji.indexOf(userId);
  if (userIndex === -1) {
    return false;
  }

  usersForEmoji.splice(userIndex, 1);

  // Remove emoji entirely if no users left
  if (usersForEmoji.length === 0) {
    message.reactions.delete(emoji);
  } else {
    message.reactions.set(emoji, usersForEmoji);
  }

  updateRoomActivity(roomId);
  logger.debug(`Reaction ${emoji} removed by ${userId} from message ${messageId} in room ${roomId}`);

  return true;
};

export const getChatHistory = (roomId: string, limit: number = 50): MessageData[] => {
  const room = getRoom(roomId);
  if (!room) {
    return [];
  }

  // Return last `limit` messages
  return room.chatHistory.slice(-limit);
};
