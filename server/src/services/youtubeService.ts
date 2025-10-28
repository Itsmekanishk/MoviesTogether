import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
}

export const searchYouTube = async (query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> => {
  if (!config.YOUTUBE_API_KEY) {
    logger.error('YouTube API key not configured');
    throw new Error('YouTube search is unavailable');
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        key: config.YOUTUBE_API_KEY,
      },
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video details for duration
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails',
        id: videoIds,
        key: config.YOUTUBE_API_KEY,
      },
    });

    const results: YouTubeSearchResult[] = response.data.items.map((item: any, index: number) => {
      const details = detailsResponse.data.items[index];
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        duration: details?.contentDetails?.duration || 'PT0S',
        channelName: item.snippet.channelTitle,
      };
    });

    logger.info(`YouTube search completed for query: ${query}, found ${results.length} results`);
    return results;
  } catch (error: any) {
    if (error.response?.status === 403) {
      logger.error('YouTube API quota exceeded or key invalid');
      throw new Error('YouTube API quota exceeded');
    }
    logger.error(`YouTube API error: ${error.message}`);
    throw new Error('YouTube search failed');
  }
};

// Convert ISO 8601 duration to seconds
export const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
};
