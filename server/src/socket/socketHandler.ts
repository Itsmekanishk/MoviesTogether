import { Server, Socket } from 'socket.io';
import * as roomHandlers from './roomHandlers.js';
import * as videoHandlers from './videoHandlers.js';
import * as queueHandlers from './queueHandlers.js';
import * as chatHandlers from './chatHandlers.js';
import * as webrtcHandlers from './webrtcHandlers.js';
import logger from '../utils/logger.js';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Room management events
    socket.on('room:join', (payload) => roomHandlers.handleRoomJoin(socket, io, payload));
    socket.on('room:leave', () => roomHandlers.handleRoomLeave(socket, io));
    socket.on('room:kick', (payload) => roomHandlers.handleRoomKick(socket, io, payload));
    socket.on('room:host-change', (payload) => roomHandlers.handleHostChange(socket, io, payload));
    socket.on('room:delete', (payload) => roomHandlers.handleRoomDelete(socket, io, payload));
    socket.on('connection:heartbeat', () => roomHandlers.handleHeartbeat(socket));

    // Video synchronization events
    socket.on('video:play', (payload) => videoHandlers.handleVideoPlay(socket, io, payload));
    socket.on('video:pause', (payload) => videoHandlers.handleVideoPause(socket, io, payload));
    socket.on('video:seek', (payload) => videoHandlers.handleVideoSeek(socket, io, payload));
    socket.on('sync:position-update', (payload) => videoHandlers.handlePositionUpdate(socket, io, payload));
    socket.on('sync:buffering', (payload) => videoHandlers.handleBuffering(socket, io, payload));
    socket.on('sync:buffer-resolved', (payload) => videoHandlers.handleBufferResolved(socket, io, payload));

    // Queue management events
    socket.on('queue:add', (payload) => queueHandlers.handleQueueAdd(socket, io, payload));
    socket.on('queue:remove', (payload) => queueHandlers.handleQueueRemove(socket, io, payload));
    socket.on('queue:reorder', (payload) => queueHandlers.handleQueueReorder(socket, io, payload));
    socket.on('queue:play-next', (payload) => queueHandlers.handleQueuePlayNext(socket, io, payload));
    socket.on('queue:clear', (payload) => queueHandlers.handleQueueClear(socket, io, payload));

    // Chat events
    socket.on('chat:message', (payload) => chatHandlers.handleChatMessage(socket, io, payload));
    socket.on('chat:add-reaction', (payload) => chatHandlers.handleAddReaction(socket, io, payload));
    socket.on('chat:remove-reaction', (payload) => chatHandlers.handleRemoveReaction(socket, io, payload));

    // WebRTC events
    socket.on('webrtc:join-room', (payload) => webrtcHandlers.handleWebRTCJoinRoom(socket, payload));
    socket.on('webrtc:create-send-transport', (payload) => webrtcHandlers.handleCreateSendTransport(socket, payload));
    socket.on('webrtc:create-receive-transport', (payload) => webrtcHandlers.handleCreateReceiveTransport(socket, payload));
    socket.on('webrtc:transport-connect', (payload) => webrtcHandlers.handleTransportConnect(socket, payload));
    socket.on('webrtc:produce', (payload) => webrtcHandlers.handleProduce(socket, io, payload));
    socket.on('webrtc:consume', (payload) => webrtcHandlers.handleConsume(socket, payload));
    socket.on('webrtc:producer-close', (payload) => webrtcHandlers.handleProducerClose(socket, io, payload));

    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      roomHandlers.handleRoomLeave(socket, io);
    });
  });
};
