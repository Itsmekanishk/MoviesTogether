import { Socket, Server } from 'socket.io';
import * as chatService from '../services/chatService.js';
import { ChatMessagePayload, ChatReactionPayload } from '../types/socket.types.js';
import logger from '../utils/logger.js';

export const handleChatMessage = (socket: Socket, io: Server, payload: ChatMessagePayload) => {
  const { roomId, userId, content } = payload;
  const { username } = socket.data;

  // Check rate limit
  if (!chatService.checkRateLimit(userId)) {
    socket.emit('chat:rate_limit', {
      error: true,
      type: 'rate_limit',
      message: 'Sending messages too quickly. Please slow down.',
      retryable: true,
      retryAfter: 5000,
    });
    return;
  }

  const message = chatService.addMessage(roomId, userId, username, content);

  if (message) {
    // Convert Map to object for JSON serialization
    const messageToSend = {
      ...message,
      reactions: Object.fromEntries(message.reactions),
    };

    io.to(roomId).emit('chat:new-message', messageToSend);
    logger.debug(`Message sent in room ${roomId} by ${username}`);
  } else {
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Invalid message',
      retryable: false,
    });
  }
};

export const handleAddReaction = (socket: Socket, io: Server, payload: ChatReactionPayload) => {
  const { roomId, messageId, emoji, userId } = payload;

  const success = chatService.addReaction(roomId, messageId, emoji, userId);

  if (success) {
    io.to(roomId).emit('chat:reaction-added', {
      messageId,
      emoji,
      userId,
    });
    logger.debug(`Reaction ${emoji} added to message ${messageId} in room ${roomId}`);
  }
};

export const handleRemoveReaction = (socket: Socket, io: Server, payload: ChatReactionPayload) => {
  const { roomId, messageId, emoji, userId } = payload;

  const success = chatService.removeReaction(roomId, messageId, emoji, userId);

  if (success) {
    io.to(roomId).emit('chat:reaction-removed', {
      messageId,
      emoji,
      userId,
    });
    logger.debug(`Reaction ${emoji} removed from message ${messageId} in room ${roomId}`);
  }
};
