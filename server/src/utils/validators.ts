export const isValidRoomId = (roomId: string): boolean => {
  return /^[a-zA-Z0-9]{10}$/.test(roomId);
};

export const isValidVideoId = (videoId: string): boolean => {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
};

export const isValidUsername = (username: string): boolean => {
  if (!username || username.length === 0 || username.length > 20) {
    return false;
  }
  // Alphanumeric, spaces, underscores, hyphens
  return /^[a-zA-Z0-9 _-]+$/.test(username);
};

export const isValidMessage = (message: string): boolean => {
  if (!message || message.length === 0 || message.length > 500) {
    return false;
  }
  return true;
};

export const parseTimestamp = (text: string): number | null => {
  // Match MM:SS or HH:MM:SS patterns
  const regex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/;
  const match = text.match(regex);

  if (!match) {
    return null;
  }

  const hours = match[3] ? parseInt(match[1], 10) : 0;
  const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);

  return hours * 3600 + minutes * 60 + seconds;
};
