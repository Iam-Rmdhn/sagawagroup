/**
 * YouTube API Service
 * Service untuk menghandle semua operasi terkait YouTube API
 */

import {
  getYouTubeConfig,
  validateYouTubeConfig,
  buildYouTubeApiUrl,
  processYouTubeVideos,
  type YouTubeApiResponse,
  type ProcessedVideo,
  type YouTubeConfig,
} from "../config/youtube.config";

export class YouTubeService {
  private config: YouTubeConfig;
  private cache: Map<string, { data: ProcessedVideo[]; timestamp: number }> =
    new Map();

  constructor() {
    this.config = getYouTubeConfig();
  }

  /**
   * Validasi konfigurasi YouTube
   */
  validateConfig() {
    return validateYouTubeConfig(this.config);
  }

  /**
   * Mengambil video dari YouTube API dengan caching
   */
  async getVideos(forceRefresh: boolean = false): Promise<{
    success: boolean;
    data?: ProcessedVideo[];
    error?: string;
    fromCache?: boolean;
  }> {
    try {
      // Validasi konfigurasi terlebih dahulu
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return {
          success: false,
          error: `Konfigurasi tidak valid: ${validation.errors.join(", ")}`,
        };
      }

      const cacheKey = this.getCacheKey();

      // Cek cache jika tidak force refresh
      if (!forceRefresh && this.isCacheValid(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)!;
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
        };
      }

      // Fetch dari YouTube API
      const apiUrl = buildYouTubeApiUrl(this.config);
      console.log("Fetching from YouTube API:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as YouTubeApiResponse;

      if (!data.items) {
        throw new Error("No items found in YouTube API response");
      }

      // Proses video data
      const processedVideos = processYouTubeVideos(data.items);

      // Simpan ke cache
      this.cache.set(cacheKey, {
        data: processedVideos,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: processedVideos,
        fromCache: false,
      };
    } catch (error) {
      console.error("YouTube API Error:", error);

      // Jika ada error, coba return dari cache (meskipun expired)
      const cacheKey = this.getCacheKey();
      if (this.cache.has(cacheKey)) {
        console.log("Returning expired cache due to error");
        return {
          success: true,
          data: this.cache.get(cacheKey)!.data,
          fromCache: true,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Mengambil video berdasarkan ID tertentu
   */
  async getVideoById(videoId: string): Promise<{
    success: boolean;
    data?: ProcessedVideo;
    error?: string;
  }> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return {
          success: false,
          error: `Konfigurasi tidak valid: ${validation.errors.join(", ")}`,
        };
      }

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.config.apiKey}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as YouTubeApiResponse;

      if (!data.items || data.items.length === 0) {
        return {
          success: false,
          error: "Video not found",
        };
      }

      const processedVideos = processYouTubeVideos(data.items);

      return {
        success: true,
        data: processedVideos[0],
      };
    } catch (error) {
      console.error("YouTube API Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): YouTubeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (untuk testing atau dynamic config)
   */
  updateConfig(newConfig: Partial<YouTubeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
  }

  // Private methods

  private getCacheKey(): string {
    return `youtube_${this.config.channelId || this.config.playlistId}_${
      this.config.maxResults
    }_${this.config.orderBy}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    const isValid = now - cached.timestamp < this.config.cacheTimeout;

    if (!isValid) {
      this.cache.delete(cacheKey); // Remove expired cache
    }

    return isValid;
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
export default youtubeService;
