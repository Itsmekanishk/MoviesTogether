export interface RoomJoinPayload {
  roomId: string;
  userId: string;
  username: string;
  isGuest: boolean;
}

export interface VideoControlPayload {
  roomId: string;
  userId: string;
  currentTime: number;
  timestamp: number;
}

export interface VideoSeekPayload {
  roomId: string;
  userId: string;
  seekTo: number;
  timestamp: number;
}

export interface PositionUpdatePayload {
  roomId: string;
  userId: string;
  currentTime: number;
  isPlaying: boolean;
}

export interface BufferingPayload {
  roomId: string;
  userId: string;
  username: string;
  duration: number;
}

export interface QueueAddPayload {
  roomId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: string;
}

export interface QueueRemovePayload {
  roomId: string;
  videoId: string;
}

export interface QueueReorderPayload {
  roomId: string;
  videoId: string;
  oldIndex: number;
  newIndex: number;
}

export interface ChatMessagePayload {
  roomId: string;
  userId: string;
  content: string;
}

export interface ChatReactionPayload {
  roomId: string;
  messageId: string;
  emoji: string;
  userId: string;
}

export interface SyncBroadcast {
  action: 'play' | 'pause' | 'seek';
  currentTime: number;
  videoId: string | null;
  serverTimestamp: number;
  initiatedBy: string;
}

export interface ErrorResponse {
  error: true;
  type: 'room_not_found' | 'room_full' | 'invalid_username' | 'rate_limit' | 'invalid_input';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}
