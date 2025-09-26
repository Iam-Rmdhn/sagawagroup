/**
 * YouTube Routes
 * Routing untuk semua endpoint YouTube API
 */

import {
  getYouTubeVideos,
  getYouTubeVideoById,
  getYouTubeConfig,
  clearYouTubeCache,
  getYouTubeCacheStats,
} from "../controllers/youtube.controller";

export const youtubeRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // GET /api/youtube/videos
  if (req.method === "GET" && pathname === "/api/youtube/videos") {
    return await getYouTubeVideos(req);
  }

  // GET /api/youtube/video/:id
  if (req.method === "GET" && pathname.startsWith("/api/youtube/video/")) {
    const videoId = pathname.split("/api/youtube/video/")[1];
    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Video ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return await getYouTubeVideoById(req, videoId);
  }

  // GET /api/youtube/config
  if (req.method === "GET" && pathname === "/api/youtube/config") {
    return await getYouTubeConfig(req);
  }

  // POST /api/youtube/cache/clear
  if (req.method === "POST" && pathname === "/api/youtube/cache/clear") {
    return await clearYouTubeCache(req);
  }

  // GET /api/youtube/cache/stats
  if (req.method === "GET" && pathname === "/api/youtube/cache/stats") {
    return await getYouTubeCacheStats(req);
  }

  // Route not found
  return new Response(
    JSON.stringify({
      success: false,
      message: "YouTube API endpoint not found",
      availableEndpoints: [
        "GET /api/youtube/videos",
        "GET /api/youtube/video/:id",
        "GET /api/youtube/config",
        "POST /api/youtube/cache/clear",
        "GET /api/youtube/cache/stats",
      ],
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
};
