import { getRoom, updateRoomActivity } from './roomService.js';
import { getCurrentTimestamp } from '../utils/timeUtils.js';
import logger from '../utils/logger.js';

const DRIFT_THRESHOLD_SECONDS = 3;

export const updatePlaybackState = (
  roomId: string,
  action: 'play' | 'pause' | 'seek',
  currentTime: number,
  videoId?: string
): boolean => {
  const room = getRoom(roomId);
  if (!room) {
    return false;
  }

  const now = getCurrentTimestamp();

  switch (action) {
    case 'play':
      room.playbackState.isPlaying = true;
      room.playbackState.currentTime = currentTime;
      room.playbackState.lastUpdateTimestamp = now;
      if (videoId) {
        room.playbackState.videoId = videoId;
      }
      break;

    case 'pause':
      room.playbackState.isPlaying = false;
      room.playbackState.currentTime = currentTime;
      room.playbackState.lastUpdateTimestamp = now;
      break;

    case 'seek':
      room.playbackState.currentTime = currentTime;
      room.playbackState.lastUpdateTimestamp = now;
      break;
  }

  updateRoomActivity(roomId);
  logger.debug(`Playback state updated in room ${roomId}: ${action} at ${currentTime}s`);
  return true;
};

export const checkDrift = (
  roomId: string,
  reportedTime: number,
  reportedPlaying: boolean
): { needsResync: boolean; correctTime: number; correctPlaying: boolean } => {
  const room = getRoom(roomId);
  if (!room) {
    return { needsResync: false, correctTime: 0, correctPlaying: false };
  }

  const now = getCurrentTimestamp();
  const timeSinceUpdate = (now - room.playbackState.lastUpdateTimestamp) / 1000; // in seconds

  // Calculate expected current time
  let expectedTime = room.playbackState.currentTime;
  if (room.playbackState.isPlaying) {
    expectedTime += timeSinceUpdate;
  }

  const drift = Math.abs(reportedTime - expectedTime);
  const playingMismatch = reportedPlaying !== room.playbackState.isPlaying;

  const needsResync = drift > DRIFT_THRESHOLD_SECONDS || playingMismatch;

  if (needsResync) {
    logger.debug(
      `Drift detected in room ${roomId}: reported=${reportedTime}s, expected=${expectedTime}s, drift=${drift}s`
    );
  }

  return {
    needsResync,
    correctTime: expectedTime,
    correctPlaying: room.playbackState.isPlaying,
  };
};

export const getExpectedPlaybackPosition = (roomId: string): number => {
  const room = getRoom(roomId);
  if (!room) {
    return 0;
  }

  const now = getCurrentTimestamp();
  const timeSinceUpdate = (now - room.playbackState.lastUpdateTimestamp) / 1000;

  let expectedTime = room.playbackState.currentTime;
  if (room.playbackState.isPlaying) {
    expectedTime += timeSinceUpdate;
  }

  return expectedTime;
};
