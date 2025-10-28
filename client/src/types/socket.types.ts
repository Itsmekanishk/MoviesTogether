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
