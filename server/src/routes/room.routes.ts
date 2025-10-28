import express, { Request, Response } from 'express';
import * as roomService from '../services/roomService.js';
import { generateUserId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Create a new room
router.post('/create', (req: Request, res: Response) => {
  try {
    // Generate a temporary host user ID (will be replaced when user joins)
    const hostUserId = generateUserId();
    const roomId = roomService.createRoom(hostUserId);

    res.json({
      success: true,
      roomId,
    });

    logger.info(`Room created via HTTP: ${roomId}`);
  } catch (error: any) {
    logger.error(`Room creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
    });
  }
});

// Get room info (for checking if room exists)
router.get('/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;

  const room = roomService.getRoom(roomId);

  if (!room) {
    res.status(404).json({
      success: false,
      error: 'Room not found',
    });
    return;
  }

  res.json({
    success: true,
    room: {
      roomId: room.roomId,
      participantCount: room.participants.size,
      createdAt: room.createdAt,
    },
  });
});

export default router;
