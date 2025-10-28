import { useEffect, useRef, useState } from 'react';
import { useRoom } from '../../context/RoomContext';

const VideoPlayer = () => {
  const { room, sendVideoControl } = useRoom();
  const playerRef = useRef<YT.Player | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Wait for YouTube API to load
    const checkYTAPI = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYTAPI);
        initializePlayer();
      }
    }, 100);

    return () => {
      clearInterval(checkYTAPI);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    if (!playerRef.current && window.YT) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: room?.playbackState.videoId || undefined,
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            console.log('YouTube player ready');
          },
          onStateChange: (event) => {
            handleStateChange(event);
          },
        },
      });
    }
  };

  const handleStateChange = (event: YT.OnStateChangeEvent) => {
    if (isSyncingRef.current) return;

    const state = event.data;
    const currentTime = playerRef.current?.getCurrentTime() || 0;

    if (state === YT.PlayerState.PLAYING) {
      sendVideoControl('play', currentTime);
    } else if (state === YT.PlayerState.PAUSED) {
      sendVideoControl('pause', currentTime);
    }
  };

  // Sync with room playback state
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !room) return;

    const { videoId, currentTime, isPlaying, lastUpdateTimestamp } = room.playbackState;

    if (!videoId) return;

    isSyncingRef.current = true;

    // Load video if different
    const currentVideoId = playerRef.current.getVideoData ? playerRef.current.getVideoData().video_id : null;
    if (currentVideoId !== videoId) {
      playerRef.current.loadVideoById(videoId);
    }

    // Calculate expected position based on time elapsed
    const now = Date.now();
    const elapsed = (now - lastUpdateTimestamp) / 1000;
    const expectedTime = currentTime + (isPlaying ? elapsed : 0);

    // Seek if drift is significant
    const actualTime = playerRef.current.getCurrentTime();
    if (Math.abs(actualTime - expectedTime) > 2) {
      playerRef.current.seekTo(expectedTime, true);
    }

    // Match play/pause state
    const currentState = playerRef.current.getPlayerState();
    if (isPlaying && currentState !== YT.PlayerState.PLAYING && currentState !== YT.PlayerState.BUFFERING) {
      playerRef.current.playVideo();
    } else if (!isPlaying && currentState === YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 500);
  }, [room?.playbackState, isPlayerReady]);

  if (!room?.playbackState.videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl">No video playing</p>
          <p className="text-sm text-gray-400 mt-2">Add a video to the queue to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div id="youtube-player" className="w-full h-full"></div>
    </div>
  );
};

export default VideoPlayer;
