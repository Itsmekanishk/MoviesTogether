import { Socket, Server } from 'socket.io';
import { types as mediasoupTypes } from 'mediasoup';
import * as webrtcService from '../services/webrtcService.js';
import * as roomService from '../services/roomService.js';
import logger from '../utils/logger.js';

export const handleWebRTCJoinRoom = async (socket: Socket, payload: { roomId: string }) => {
  const { roomId } = payload;

  try {
    const router = await webrtcService.createRouter(roomId);

    socket.emit('webrtc:router-rtp-capabilities', {
      rtpCapabilities: router.rtpCapabilities,
    });

    logger.info(`WebRTC router capabilities sent for room ${roomId}`);
  } catch (error: any) {
    logger.error(`WebRTC join error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to initialize WebRTC',
      retryable: true,
    });
  }
};

export const handleCreateSendTransport = async (socket: Socket, payload: { roomId: string }) => {
  const { roomId } = payload;

  try {
    const { transport, params } = await webrtcService.createWebRTCTransport(roomId);

    socket.emit('webrtc:send-transport-created', params);

    logger.debug(`Send transport created for room ${roomId}`);
  } catch (error: any) {
    logger.error(`Create send transport error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to create transport',
      retryable: true,
    });
  }
};

export const handleCreateReceiveTransport = async (socket: Socket, payload: { roomId: string }) => {
  const { roomId } = payload;

  try {
    const { transport, params } = await webrtcService.createWebRTCTransport(roomId);

    socket.emit('webrtc:receive-transport-created', params);

    logger.debug(`Receive transport created for room ${roomId}`);
  } catch (error: any) {
    logger.error(`Create receive transport error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to create transport',
      retryable: true,
    });
  }
};

export const handleTransportConnect = async (
  socket: Socket,
  payload: { roomId: string; transportId: string; dtlsParameters: mediasoupTypes.DtlsParameters }
) => {
  const { roomId, transportId, dtlsParameters } = payload;

  try {
    await webrtcService.connectTransport(roomId, transportId, dtlsParameters);
    socket.emit('webrtc:transport-connected', { transportId });
    logger.debug(`Transport ${transportId} connected in room ${roomId}`);
  } catch (error: any) {
    logger.error(`Transport connect error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to connect transport',
      retryable: true,
    });
  }
};

export const handleProduce = async (
  socket: Socket,
  io: Server,
  payload: {
    roomId: string;
    transportId: string;
    kind: mediasoupTypes.MediaKind;
    rtpParameters: mediasoupTypes.RtpParameters;
  }
) => {
  const { roomId, transportId, kind, rtpParameters } = payload;
  const { userId } = socket.data;

  try {
    const producer = await webrtcService.createProducer(roomId, transportId, rtpParameters, kind);

    socket.emit('webrtc:producer-created', { producerId: producer.id });

    // Notify all other participants in the room about the new producer
    socket.to(roomId).emit('webrtc:new-producer', {
      producerId: producer.id,
      userId,
      kind,
    });

    logger.info(`Producer ${producer.id} created for user ${userId} in room ${roomId}`);
  } catch (error: any) {
    logger.error(`Produce error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to produce media',
      retryable: true,
    });
  }
};

export const handleConsume = async (
  socket: Socket,
  payload: {
    roomId: string;
    transportId: string;
    producerId: string;
    rtpCapabilities: mediasoupTypes.RtpCapabilities;
  }
) => {
  const { roomId, transportId, producerId, rtpCapabilities } = payload;

  try {
    const consumer = await webrtcService.createConsumer(roomId, transportId, producerId, rtpCapabilities);

    socket.emit('webrtc:consumer-created', {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });

    logger.info(`Consumer ${consumer.id} created for producer ${producerId} in room ${roomId}`);
  } catch (error: any) {
    logger.error(`Consume error: ${error.message}`);
    socket.emit('room:error', {
      error: true,
      type: 'invalid_input',
      message: 'Failed to consume media',
      retryable: true,
    });
  }
};

export const handleProducerClose = (socket: Socket, io: Server, payload: { roomId: string; producerId: string }) => {
  const { roomId, producerId } = payload;

  webrtcService.closeProducer(roomId, producerId);

  // Notify all participants
  io.to(roomId).emit('webrtc:producer-closed', { producerId });

  logger.info(`Producer ${producerId} closed in room ${roomId}`);
};
