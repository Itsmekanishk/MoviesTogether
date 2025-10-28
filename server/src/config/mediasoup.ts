import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
import config from './env.js';
import logger from '../utils/logger.js';

export const mediaCodecs: mediasoupTypes.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/h264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000,
    },
  },
];

let worker: mediasoupTypes.Worker | null = null;

export const initializeMediasoupWorker = async (): Promise<mediasoupTypes.Worker> => {
  if (worker) {
    return worker;
  }

  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: config.MEDIASOUP_MIN_PORT,
    rtcMaxPort: config.MEDIASOUP_MAX_PORT,
  });

  worker.on('died', () => {
    logger.error('mediasoup worker died, exiting process');
    process.exit(1);
  });

  logger.info(`mediasoup worker created with PID: ${worker.pid}`);

  return worker;
};

export const getWorker = (): mediasoupTypes.Worker => {
  if (!worker) {
    throw new Error('mediasoup worker not initialized');
  }
  return worker;
};
