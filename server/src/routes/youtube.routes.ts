import express, { Request, Response } from 'express';
import * as youtubeService from '../services/youtubeService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Search YouTube videos
router.get('/search', async (req: Request, res: Response) => {
  const { q: query, maxResults } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Search query is required',
    });
    return;
  }

  try {
    const max = maxResults ? parseInt(maxResults as string, 10) : 10;
    const results = await youtubeService.searchYouTube(query, max);

    // Convert ISO 8601 durations to seconds
    const formattedResults = results.map(result => ({
      ...result,
      durationSeconds: youtubeService.parseDuration(result.duration),
    }));

    res.json({
      success: true,
      results: formattedResults,
    });
  } catch (error: any) {
    logger.error(`YouTube search error: ${error.message}`);

    if (error.message.includes('quota')) {
      res.status(503).json({
        success: false,
        error: 'YouTube search is temporarily unavailable. Please add videos by URL.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'YouTube search failed',
      });
    }
  }
});

export default router;
