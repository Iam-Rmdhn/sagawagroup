/**
 * YouTube API Configuration
 * Menggunakan environment variables dari .env file
 */

export interface YouTubeConfig {
  apiKey: string;
  channelId: string;
  playlistId?: string | null;
  maxResults: number;
  orderBy: "date" | "relevance" | "rating" | "title" | "viewCount";
  publishedAfter?: string | null;
  cacheTimeout: number;
}

export interface YouTubeValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Fungsi untuk menghitung tanggal publishedAfter
 * Jika nilai adalah "auto_7_days", akan return tanggal 7 hari yang lalu
 */
export const getPublishedAfterDate = (
  publishedAfterConfig: string | null
): string | null => {
  if (!publishedAfterConfig) return null;

  if (publishedAfterConfig === "auto_7_days") {
    // Hitung 7 hari yang lalu
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Return dalam format ISO string yang dibutuhkan YouTube API
    return sevenDaysAgo.toISOString();
  }

  // Jika bukan auto, return value asli (bisa berupa tanggal manual)
  return publishedAfterConfig;
};

/**
 * Default YouTube configuration menggunakan environment variables
 */
export const getYouTubeConfig = (): YouTubeConfig => {
  return {
    // YouTube API Key dari environment variable
    apiKey: process.env.YT_API_KEY || "",

    // Channel ID dari environment variable
    channelId: process.env.YOUTUBE_CHANNEL_ID || "",

    // Playlist ID (opsional) - bisa ditambahkan ke .env jika diperlukan
    playlistId: process.env.YOUTUBE_PLAYLIST_ID || null,

    // Pengaturan default - hanya tampilkan 3 video terbaru
    maxResults: parseInt(process.env.YOUTUBE_MAX_RESULTS || "3"),
    orderBy: (process.env.YOUTUBE_ORDER_BY as any) || "date",
    publishedAfter: getPublishedAfterDate(
      process.env.YOUTUBE_PUBLISHED_AFTER || null
    ),

    // Cache timeout (default 7 hari)
    cacheTimeout: parseInt(process.env.YOUTUBE_CACHE_TIMEOUT || "604800000"), // 7 hari dalam ms
  };
};

/**
 * Validasi konfigurasi YouTube
 */
export const validateYouTubeConfig = (
  config: YouTubeConfig
): YouTubeValidationResult => {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push("YouTube API Key (YT_API_KEY) harus diisi di file .env");
  }

  if (!config.channelId && !config.playlistId) {
    errors.push(
      "Channel ID (YOUTUBE_CHANNEL_ID) atau Playlist ID (YOUTUBE_PLAYLIST_ID) harus diisi di file .env"
    );
  }

  if (config.maxResults < 1 || config.maxResults > 50) {
    errors.push("maxResults harus antara 1-50");
  }

  if (
    !["date", "relevance", "rating", "title", "viewCount"].includes(
      config.orderBy
    )
  ) {
    errors.push(
      "orderBy harus salah satu dari: date, relevance, rating, title, viewCount"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Interface untuk response YouTube API
 */
export interface YouTubeVideoItem {
  id:
    | {
        kind: string;
        videoId: string;
      }
    | string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    resourceId?: {
      kind: string;
      videoId: string;
    };
  };
}

export interface YouTubeApiResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoItem[];
}

/**
 * Interface untuk video yang sudah diproses
 */
export interface ProcessedVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  url: string;
  duration?: string;
  isShorts?: boolean; // Menandai apakah ini video shorts
}

/**
 * Fungsi helper untuk memproses response YouTube API
 */
export const processYouTubeVideos = (
  items: YouTubeVideoItem[]
): ProcessedVideo[] => {
  return items.map((item) => {
    // Handle different ID formats
    const videoId =
      typeof item.id === "string"
        ? item.id
        : item.id?.videoId || item.snippet?.resourceId?.videoId || "";

    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  });
};

/**
 * Fungsi untuk build URL API YouTube
 * Mengambil video dan shorts dari channel
 */
export const buildYouTubeApiUrl = (
  config: YouTubeConfig,
  searchType?: "video" | "shorts" | "all"
): string => {
  const baseParams = `maxResults=${config.maxResults}&key=${config.apiKey}`;

  // Tentukan type berdasarkan searchType parameter
  let contentType = "video";
  if (searchType === "shorts") {
    contentType = "video"; // Shorts juga merupakan video
  } else if (searchType === "all") {
    contentType = "video"; // Ambil semua video (termasuk shorts)
  }

  if (config.playlistId) {
    // URL untuk playlist
    return `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${config.playlistId}&${baseParams}`;
  } else if (config.channelId) {
    // URL untuk channel - akan mengambil video dan shorts
    let channelParams = `part=snippet&channelId=${config.channelId}&order=${config.orderBy}&type=${contentType}`;

    // Untuk shorts, tambahkan filter durasi pendek (di bawah 1 menit)
    if (searchType === "shorts") {
      channelParams += "&videoDuration=short"; // Durasi pendek (<4 menit, tapi umumnya shorts <1 menit)
    }

    // Tambahkan filter tanggal jika ada
    if (config.publishedAfter) {
      channelParams += `&publishedAfter=${config.publishedAfter}`;
    }

    return `https://www.googleapis.com/youtube/v3/search?${channelParams}&${baseParams}`;
  } else {
    throw new Error("Channel ID atau Playlist ID harus diisi");
  }
};

/**
 * Default export untuk kemudahan import
 */
const youtubeConfig = {
  getYouTubeConfig,
  validateYouTubeConfig,
  processYouTubeVideos,
  buildYouTubeApiUrl,
};

export default youtubeConfig;
