import { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { extractVideoId } from '../../utils/videoIdParser';
import { formatDuration } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';

const QueuePanel = () => {
  const { room, addVideoToQueue } = useRoom();
  const { addNotification } = useNotification();
  const [videoUrl, setVideoUrl] = useState('');

  const handleAddVideo = () => {
    if (!videoUrl.trim()) return;

    const videoId = extractVideoId(videoUrl.trim());
    if (!videoId) {
      addNotification('Invalid YouTube URL', 'error');
      return;
    }

    // For simplicity, using placeholder data. In production, would fetch from YouTube API
    addVideoToQueue(
      videoId,
      'Video Title',
      `https://img.youtube.com/vi/${videoId}/default.jpg`,
      0
    );

    setVideoUrl('');
    addNotification('Video added to queue', 'success');
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Up Next ({room?.queue.length || 0})</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
            placeholder="Paste YouTube URL..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
          <button
            onClick={handleAddVideo}
            disabled={!videoUrl.trim()}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-blue-700 font-semibold text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {room?.queue.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No videos in queue. Add one to get started!
          </div>
        ) : (
          room?.queue.map((video, index) => (
            <div key={video.videoId} className="flex gap-3 p-2 bg-gray-50 rounded hover:bg-gray-100">
              <div className="flex-shrink-0 w-16 h-12 bg-gray-300 rounded overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{video.title || `Video ${index + 1}`}</div>
                <div className="text-xs text-gray-500">Added by {video.addedBy}</div>
              </div>
              <div className="text-xs text-gray-500 self-center">
                {video.duration > 0 ? formatDuration(video.duration) : '--:--'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
