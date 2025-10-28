import { customAlphabet } from 'nanoid';
import { randomUUID } from 'crypto';

// 10-character alphanumeric room IDs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export const generateRoomId = (): string => {
  return nanoid();
};

export const generateMessageId = (): string => {
  return randomUUID();
};

export const generateUserId = (): string => {
  return randomUUID();
};
