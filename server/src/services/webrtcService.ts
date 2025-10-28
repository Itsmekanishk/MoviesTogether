import { types as mediasoupTypes } from 'mediasoup';
import { getWorker, mediaCodecs } from '../config/mediasoup.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

interface RoomRouter {
  router: mediasoupTypes.Router;
  transports: Map<string, mediasoupTypes.WebRtcTransport>;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
}

const roomRouters = new Map<string, RoomRouter>();

export const createRouter = async (roomId: string): Promise<mediasoupTypes.Router> => {
  if (roomRouters.has(roomId)) {
    return roomRouters.get(roomId)!.router;
  }

  const worker = getWorker();
  const router = await worker.createRouter({ mediaCodecs });

  roomRouters.set(roomId, {
    router,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
  });

  logger.info(`mediasoup router created for room ${roomId}`);
  return router;
};

export const getRouter = (roomId: string): mediasoupTypes.Router | null => {
  const roomRouter = roomRouters.get(roomId);
  return roomRouter ? roomRouter.router : null;
};

export const createWebRTCTransport = async (
  roomId: string
): Promise<{ transport: mediasoupTypes.WebRtcTransport; params: any }> => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    throw new Error('Router not found for room');
  }

  const transport = await roomRouter.router.createWebRtcTransport({
    listenIps: [
      {
        ip: config.MEDIASOUP_LISTEN_IP,
        announcedIp: config.MEDIASOUP_ANNOUNCED_IP,
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  roomRouter.transports.set(transport.id, transport);

  const params = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };

  logger.debug(`WebRTC transport created: ${transport.id} for room ${roomId}`);
  return { transport, params };
};

export const connectTransport = async (
  roomId: string,
  transportId: string,
  dtlsParameters: mediasoupTypes.DtlsParameters
): Promise<void> => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    throw new Error('Router not found for room');
  }

  const transport = roomRouter.transports.get(transportId);
  if (!transport) {
    throw new Error('Transport not found');
  }

  await transport.connect({ dtlsParameters });
  logger.debug(`Transport connected: ${transportId} in room ${roomId}`);
};

export const createProducer = async (
  roomId: string,
  transportId: string,
  rtpParameters: mediasoupTypes.RtpParameters,
  kind: mediasoupTypes.MediaKind
): Promise<mediasoupTypes.Producer> => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    throw new Error('Router not found for room');
  }

  const transport = roomRouter.transports.get(transportId);
  if (!transport) {
    throw new Error('Transport not found');
  }

  const producer = await transport.produce({
    kind,
    rtpParameters,
  });

  roomRouter.producers.set(producer.id, producer);
  logger.info(`Producer created: ${producer.id} (${kind}) in room ${roomId}`);

  return producer;
};

export const createConsumer = async (
  roomId: string,
  transportId: string,
  producerId: string,
  rtpCapabilities: mediasoupTypes.RtpCapabilities
): Promise<mediasoupTypes.Consumer> => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    throw new Error('Router not found for room');
  }

  const transport = roomRouter.transports.get(transportId);
  if (!transport) {
    throw new Error('Transport not found');
  }

  const producer = roomRouter.producers.get(producerId);
  if (!producer) {
    throw new Error('Producer not found');
  }

  if (!roomRouter.router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume producer');
  }

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused: false,
  });

  roomRouter.consumers.set(consumer.id, consumer);
  logger.info(`Consumer created: ${consumer.id} for producer ${producerId} in room ${roomId}`);

  return consumer;
};

export const closeProducer = (roomId: string, producerId: string): void => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    return;
  }

  const producer = roomRouter.producers.get(producerId);
  if (producer) {
    producer.close();
    roomRouter.producers.delete(producerId);
    logger.info(`Producer closed: ${producerId} in room ${roomId}`);
  }
};

export const closeTransport = (roomId: string, transportId: string): void => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    return;
  }

  const transport = roomRouter.transports.get(transportId);
  if (transport) {
    transport.close();
    roomRouter.transports.delete(transportId);
    logger.debug(`Transport closed: ${transportId} in room ${roomId}`);
  }
};

export const closeRouter = (roomId: string): void => {
  const roomRouter = roomRouters.get(roomId);
  if (!roomRouter) {
    return;
  }

  roomRouter.router.close();
  roomRouters.delete(roomId);
  logger.info(`Router closed for room ${roomId}`);
};

export const getRoomProducers = (roomId: string): mediasoupTypes.Producer[] => {
  const roomRouter = roomRouters.get(roomId);
  return roomRouter ? Array.from(roomRouter.producers.values()) : [];
};
