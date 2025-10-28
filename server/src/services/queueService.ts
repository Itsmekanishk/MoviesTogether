import { VideoData } from '../types/room.types.js';
import { getRoom, updateRoomActivity } from './roomService.js';
import { isValidVideoId } from '../utils/validators.js';
import { getCurrentTimestamp } from '../utils/timeUtils.js';
import logger from '../utils/logger.js';

const MAX_QUEUE_SIZE = 100;

export const addVideoToQueue = (
  roomId: string,
  videoId: string,
  title: string,
  thumbnail: string,
  duration: number,
  addedBy: string
): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  if (!isValidVideoId(videoId)) {
    logger.warn(`Invalid video ID attempted to add: ${videoId}`);
    return false;
  }

  if (room.queue.length >= MAX_QUEUE_SIZE) {
    logger.warn(`Queue full in room ${roomId}, cannot add video`);
    return false;
  }

  const videoData: VideoData = {
    videoId,
    title,
    thumbnail,
    duration,
    addedBy,
    addedAt: getCurrentTimestamp(),
  };

  room.queue.push(videoData);
  updateRoomActivity(roomId);

  logger.info(`Video ${videoId} added to queue in room ${roomId} by ${addedBy}`);
  return true;
};

export const removeVideoFromQueue = (roomId: string, videoId: string): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  const initialLength = room.queue.length;
  room.queue = room.queue.filter(video => video.videoId !== videoId);

  if (room.queue.length < initialLength) {
    updateRoomActivity(roomId);
    logger.info(`Video ${videoId} removed from queue in room ${roomId}`);
    return true;
  }

  return false;
};

export const reorderQueue = (roomId: string, oldIndex: number, newIndex: number): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  if (oldIndex < 0 || oldIndex >= room.queue.length || newIndex < 0 || newIndex >= room.queue.length) {
    return false;
  }

  const [movedVideo] = room.queue.splice(oldIndex, 1);
  room.queue.splice(newIndex, 0, movedVideo);

  updateRoomActivity(roomId);
  logger.debug(`Queue reordered in room ${roomId}: ${oldIndex} -> ${newIndex}`);
  return true;
};

export const getNextVideo = (roomId: string): VideoData | null => {
  const room = getRoom(roomId);
  if (!room || room.queue.length === 0) {
    return null;
  }

  return room.queue[0];
};

export const removeNextVideo = (roomId: string): VideoData | null => {
  const room = getRoom(roomId);
  if (!room || room.queue.length === 0) {
    return null;
  }

  const nextVideo = room.queue.shift();
  if (nextVideo) {
    updateRoomActivity(roomId);
    logger.info(`Next video ${nextVideo.videoId} removed from queue in room ${roomId}`);
  }

  return nextVideo || null;
};

export const clearQueue = (roomId: string): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  room.queue = [];
  updateRoomActivity(roomId);
  logger.info(`Queue cleared in room ${roomId}`);
  return true;
};

export const getQueue = (roomId: string): VideoData[] => {
  const room = getRoom(roomId);
  return room ? room.queue : [];
};
