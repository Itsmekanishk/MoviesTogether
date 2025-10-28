export interface Participant {
  userId: string;
  username: string;
  isGuest: boolean;
  socketId: string;
  joinedAt: number;
  lastHeartbeat: number;
  isReconnecting: boolean;
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
  reactions: Map<string, string[]>;
}

export interface Room {
  roomId: string;
  createdAt: number;
  lastActivityAt: number;
  hostUserId: string;
  participants: Map<string, Participant>;
  playbackState: PlaybackState;
  queue: VideoData[];
  chatHistory: MessageData[];
}

export interface RoomStore {
  [roomId: string]: Room;
}
