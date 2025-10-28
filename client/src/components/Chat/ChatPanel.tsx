import { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { formatTimestamp } from '../../utils/formatters';

const ChatPanel = () => {
  const { room, sendChatMessage, currentUserId } = useRoom();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [room?.chatHistory]);

  const handleSend = () => {
    if (message.trim()) {
      sendChatMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 bg-headerBg border-b border-gray-300 flex items-center px-4">
        <h3 className="font-semibold">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {room?.chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          room?.chatHistory.map((msg) => (
            <div
              key={msg.messageId}
              className={`${msg.type === 'system' ? 'text-center text-gray-500 italic text-sm' : ''}`}
            >
              {msg.type === 'system' ? (
                <span>{msg.content}</span>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        msg.userId === currentUserId ? 'text-accent' : 'text-gray-700'
                      }`}
                    >
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <div className="text-sm mt-1">{msg.content}</div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send a message..."
            maxLength={500}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {message.length > 450 && (
          <div className="text-xs text-gray-500 mt-1">{message.length}/500</div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
