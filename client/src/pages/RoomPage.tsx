import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useSocket } from '../context/SocketContext';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import ChatPanel from '../components/Chat/ChatPanel';
import QueuePanel from '../components/Queue/QueuePanel';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { room, joinRoom, isInRoom } = useRoom();
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
    }
  }, [roomId, navigate]);

  const handleJoin = () => {
    if (username.trim() && roomId) {
      joinRoom(roomId, username.trim());
      setHasJoined(true);
      localStorage.setItem('username', username.trim());
    }
  };

  // Show nickname prompt if not joined
  if (!hasJoined && !isInRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-containerBg">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Enter Your Nickname</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Your nickname"
            maxLength={20}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={!username.trim() || !isConnected}
            className="w-full py-2 px-4 bg-accent text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {isConnected ? 'Join Room' : 'Connecting...'}
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-containerBg">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading room...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-containerBg">
      {/* Header */}
      <header className="h-16 bg-headerBg border-b border-gray-300 flex items-center justify-between px-4">
        <div className="text-lg font-semibold">Room: {room.roomId}</div>
        <div className="text-sm text-gray-600">
          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video and Queue */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          <div className="flex-[6] bg-black rounded">
            <VideoPlayer />
          </div>
          <div className="flex-[4] bg-white rounded shadow">
            <QueuePanel />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="w-96 bg-white shadow-lg">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
