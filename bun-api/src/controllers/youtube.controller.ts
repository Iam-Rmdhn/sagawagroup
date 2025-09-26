/**
 * YouTube Controller Functions
 * Handles HTTP requests for YouTube API endpoints using Bun fetch API
 */

import { youtubeService } from "../services/youtube.service";

/**
 * GET /api/youtube/videos
 * Mengambil daftar video dari YouTube channel/playlist
 */
export const getYouTubeVideos = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    const result = await youtubeService.getVideos(forceRefresh);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.error || "Failed to fetch videos",
          data: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Videos fetched successfully",
        data: result.data,
        fromCache: result.fromCache || false,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("YouTube Controller Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/youtube/video/:id
 * Mengambil detail video berdasarkan ID
 */
export const getYouTubeVideoById = async (
  req: Request,
  videoId: string
): Promise<Response> => {
  try {
    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Video ID is required",
          data: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await youtubeService.getVideoById(videoId);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.error || "Video not found",
          data: null,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Video fetched successfully",
        data: result.data,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("YouTube Controller Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/youtube/config
 * Mengambil konfigurasi YouTube API (tanpa API key untuk keamanan)
 */
export const getYouTubeConfig = async (req: Request): Promise<Response> => {
  try {
    const config = youtubeService.getConfig();
    const validation = youtubeService.validateConfig();

    // Remove sensitive data
    const safeConfig = {
      hasApiKey: !!config.apiKey,
      channelId: config.channelId,
      playlistId: config.playlistId,
      maxResults: config.maxResults,
      orderBy: config.orderBy,
      publishedAfter: config.publishedAfter,
      cacheTimeout: config.cacheTimeout,
      validation: validation,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configuration fetched successfully",
        data: safeConfig,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("YouTube Controller Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/youtube/cache/clear
 * Clear YouTube cache
 */
export const clearYouTubeCache = async (req: Request): Promise<Response> => {
  try {
    const cacheStats = youtubeService.getCacheStats();
    youtubeService.clearCache();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache cleared successfully",
        data: {
          previousCacheSize: cacheStats.size,
          clearedKeys: cacheStats.keys,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("YouTube Controller Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/youtube/cache/stats
 * Get cache statistics
 */
export const getYouTubeCacheStats = async (req: Request): Promise<Response> => {
  try {
    const stats = youtubeService.getCacheStats();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache stats fetched successfully",
        data: stats,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("YouTube Controller Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
