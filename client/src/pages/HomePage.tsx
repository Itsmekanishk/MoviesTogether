import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const HomePage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const response = await axios.post(`${SERVER_URL}/api/rooms/create`);
      const { roomId } = response.data;
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-containerBg">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-2 text-text">MoviesTogether</h1>
        <p className="text-center text-gray-600 mb-8">
          Watch YouTube videos together with friends in perfect sync
        </p>

        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full py-3 px-4 bg-accent text-white rounded hover:bg-blue-700 font-semibold text-lg mb-6 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create New Room'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-text">Join Room</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            placeholder="Enter room code"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleJoinRoom}
            disabled={!roomCode.trim()}
            className="w-full py-2 px-4 bg-button text-text rounded hover:bg-gray-400 font-semibold disabled:opacity-50"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
