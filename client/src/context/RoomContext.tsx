import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useNotification } from './NotificationContext';
import { Room, Participant, VideoData, MessageData, PlaybackState } from '../types/room.types';
import { SyncBroadcast, ErrorResponse } from '../types/socket.types';

interface RoomContextType {
  room: Room | null;
  currentUserId: string | null;
  currentUsername: string | null;
  isInRoom: boolean;
  joinRoom: (roomId: string, username: string) => void;
  leaveRoom: () => void;
  sendVideoControl: (action: 'play' | 'pause' | 'seek', currentTime: number, seekTo?: number) => void;
  sendChatMessage: (content: string) => void;
  addVideoToQueue: (videoId: string, title: string, thumbnail: string, duration: number) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { socket, isConnected } = useSocket();
  const { addNotification } = useNotification();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const joinRoom = useCallback((roomId: string, username: string) => {
    if (!socket) return;

    const userId = localStorage.getItem('userId') || `guest_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('userId', userId);

    setCurrentUserId(userId);
    setCurrentUsername(username);

    socket.emit('room:join', {
      roomId,
      userId,
      username,
      isGuest: true,
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('room:leave');
    setRoom(null);
  }, [socket]);

  const sendVideoControl = useCallback((action: 'play' | 'pause' | 'seek', currentTime: number, seekTo?: number) => {
    if (!socket || !room) return;

    if (action === 'seek' && seekTo !== undefined) {
      socket.emit('video:seek', {
        roomId: room.roomId,
        userId: currentUserId,
        seekTo,
        timestamp: Date.now(),
      });
    } else {
      socket.emit(`video:${action}`, {
        roomId: room.roomId,
        userId: currentUserId,
        currentTime,
        timestamp: Date.now(),
      });
    }
  }, [socket, room, currentUserId]);

  const sendChatMessage = useCallback((content: string) => {
    if (!socket || !room) return;
    socket.emit('chat:message', {
      roomId: room.roomId,
      userId: currentUserId,
      content,
    });
  }, [socket, room, currentUserId]);

  const addVideoToQueue = useCallback((videoId: string, title: string, thumbnail: string, duration: number) => {
    if (!socket || !room || !currentUsername) return;
    socket.emit('queue:add', {
      roomId: room.roomId,
      videoId,
      title,
      thumbnail,
      duration,
      addedBy: currentUsername,
    });
  }, [socket, room, currentUsername]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room:joined', (data: any) => {
      setRoom({
        roomId: data.roomId,
        hostUserId: data.hostUserId,
        participants: data.participants,
        playbackState: data.playbackState,
        queue: data.queue,
        chatHistory: data.chatHistory,
      });
      addNotification('Joined room successfully', 'success');
    });

    socket.on('room:error', (error: ErrorResponse) => {
      addNotification(error.message, 'error');
    });

    socket.on('participant:joined', (participant: Participant) => {
      setRoom(prev => prev ? {
        ...prev,
        participants: [...prev.participants, participant],
      } : null);
    });

    socket.on('participant:left', (data: { userId: string }) => {
      setRoom(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => p.userId !== data.userId),
      } : null);
    });

    socket.on('sync:broadcast', (data: SyncBroadcast) => {
      setRoom(prev => prev ? {
        ...prev,
        playbackState: {
          videoId: data.videoId,
          currentTime: data.currentTime,
          isPlaying: data.action === 'play',
          lastUpdateTimestamp: data.serverTimestamp,
        },
      } : null);
    });

    socket.on('queue:updated', (data: { queue: VideoData[] }) => {
      setRoom(prev => prev ? { ...prev, queue: data.queue } : null);
    });

    socket.on('chat:new-message', (message: MessageData) => {
      setRoom(prev => prev ? {
        ...prev,
        chatHistory: [...prev.chatHistory, message],
      } : null);
    });

    socket.on('video:change', (data: { videoId: string }) => {
      setRoom(prev => prev ? {
        ...prev,
        playbackState: {
          ...prev.playbackState,
          videoId: data.videoId,
          currentTime: 0,
          isPlaying: true,
        },
      } : null);
    });

    return () => {
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('participant:joined');
      socket.off('participant:left');
      socket.off('sync:broadcast');
      socket.off('queue:updated');
      socket.off('chat:new-message');
      socket.off('video:change');
    };
  }, [socket, addNotification]);

  return (
    <RoomContext.Provider value={{
      room,
      currentUserId,
      currentUsername,
      isInRoom: !!room,
      joinRoom,
      leaveRoom,
      sendVideoControl,
      sendChatMessage,
      addVideoToQueue,
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
};
