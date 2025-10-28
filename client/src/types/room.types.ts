export interface Participant {
  userId: string;
  username: string;
  isGuest: boolean;
  socketId: string;
}

export interface PlaybackState {
  videoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  lastUpdateTimestamp: number;
}

export interface VideoData {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: string;
  addedAt: number;
}

export interface MessageData {
  messageId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  type: 'text' | 'emoji' | 'system' | 'timestamp-link';
  videoTimestamp?: number;
  reactions: { [emoji: string]: string[] };
}

export interface Room {
  roomId: string;
  hostUserId: string;
  participants: Participant[];
  playbackState: PlaybackState;
  queue: VideoData[];
  chatHistory: MessageData[];
}

export interface RoomState {
  room: Room | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}
