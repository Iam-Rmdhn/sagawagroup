# YouTube Integration - Backend Migration

## 📋 Migrasi dari Frontend ke Backend API

YouTube integration telah berhasil dipindahkan dari frontend ke backend untuk keamanan yang lebih baik dan manajemen yang terpusat.

## 🔧 **File-file yang Telah Dibuat/Diubah:**

### **Backend (bun-api/):**

1. **`src/config/youtube.config.ts`** - Konfigurasi TypeScript untuk YouTube API
2. **`src/services/youtube.service.ts`** - Service layer untuk YouTube API operations
3. **`src/controllers/youtube.controller.ts`** - Controller untuk handling HTTP requests
4. **`src/routes/youtube.route.ts`** - Routing untuk YouTube endpoints
5. **`.env`** - Updated dengan YouTube environment variables

### **Frontend (vue-frontend/):**

1. **`src/pages/gallery.astro`** - Updated untuk menggunakan backend API
2. **Deleted:** `src/config/youtube.config.js` - Dipindahkan ke backend

## 🚀 **API Endpoints yang Tersedia:**

### **1. GET /api/youtube/videos**

```http
GET /api/youtube/videos
GET /api/youtube/videos?refresh=true
```

**Response:**

```json
{
  "success": true,
  "message": "Videos fetched successfully",
  "data": [
    {
      "id": "VIDEO_ID",
      "title": "Video Title",
      "description": "Video description...",
      "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/medium.jpg",
      "publishedAt": "2024-01-01T00:00:00Z",
      "channelTitle": "Channel Name",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ],
  "fromCache": false,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **2. GET /api/youtube/video/:id**

```http
GET /api/youtube/video/VIDEO_ID
```

**Response:**

```json
{
  "success": true,
  "message": "Video fetched successfully",
  "data": {
    "id": "VIDEO_ID",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/medium.jpg",
    "publishedAt": "2024-01-01T00:00:00Z",
    "channelTitle": "Channel Name",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **3. GET /api/youtube/config**

```http
GET /api/youtube/config
```

**Response:**

```json
{
  "success": true,
  "message": "Configuration fetched successfully",
  "data": {
    "hasApiKey": true,
    "channelId": "YOUR_CHANNEL_ID",
    "playlistId": null,
    "maxResults": 9,
    "orderBy": "date",
    "publishedAfter": null,
    "cacheTimeout": 300000,
    "validation": {
      "isValid": true,
      "errors": []
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **4. POST /api/youtube/cache/clear**

```http
POST /api/youtube/cache/clear
```

**Response:**

```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "previousCacheSize": 1,
    "clearedKeys": ["youtube_CHANNEL_ID_9_date"]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **5. GET /api/youtube/cache/stats**

```http
GET /api/youtube/cache/stats
```

**Response:**

```json
{
  "success": true,
  "message": "Cache stats fetched successfully",
  "data": {
    "size": 1,
    "keys": ["youtube_CHANNEL_ID_9_date"]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## ⚙️ **Environment Variables (di .env):**

```env
# YouTube API Configuration
YT_API_KEY=your_youtube_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here
YOUTUBE_PLAYLIST_ID=
YOUTUBE_MAX_RESULTS=9
YOUTUBE_ORDER_BY=date
YOUTUBE_PUBLISHED_AFTER=
YOUTUBE_CACHE_TIMEOUT=300000
```

## 🔐 **Keamanan:**

✅ **API Key tidak lagi exposed** di frontend  
✅ **Server-side validation** untuk semua requests  
✅ **Rate limiting** dan caching untuk menghemat quota  
✅ **Error handling** yang comprehensive  
✅ **CORS** configured untuk frontend access

## 📈 **Keuntungan Migrasi:**

1. **Security**: API key tidak exposed di client-side
2. **Performance**: Server-side caching yang lebih efisien
3. **Quota Management**: Centralized quota usage tracking
4. **Error Handling**: Better error management dan fallbacks
5. **Scalability**: Easier to scale dan maintain
6. **Monitoring**: Centralized logging dan monitoring

## 🔧 **Setup Instructions:**

### **1. Backend Setup:**

```bash
# Navigate ke folder bun-api
cd bun-api

# Install dependencies (jika belum)
bun install

# Update .env dengan YouTube credentials
cp .env.example .env
# Edit .env dan isi YT_API_KEY dan YOUTUBE_CHANNEL_ID

# Start server
bun run dev
```

### **2. Frontend Setup:**

```javascript
// Di gallery.astro, update BACKEND_API_BASE jika perlu
const BACKEND_API_BASE = "http://localhost:5000"; // Development
// const BACKEND_API_BASE = 'https://api.sagawagroup.com'; // Production
```

### **3. Testing:**

```bash
# Test API endpoint
curl http://localhost:5000/api/youtube/videos

# Test frontend
# Buka website dan pergi ke halaman Gallery > tab Video
```

## 🐛 **Troubleshooting:**

### **Error: "YouTube API Key belum dikonfigurasi"**

- Pastikan `YT_API_KEY` sudah diisi di file `.env`
- Restart server setelah update `.env`

### **Error: "Channel ID atau Playlist ID harus diisi"**

- Pastikan `YOUTUBE_CHANNEL_ID` sudah diisi di file `.env`
- Atau isi `YOUTUBE_PLAYLIST_ID` jika menggunakan playlist

### **Error: "Failed to fetch from backend"**

- Pastikan backend server berjalan di port 5000
- Check `BACKEND_API_BASE` di frontend
- Check CORS configuration

### **Video tidak muncul di frontend:**

- Buka Developer Console (F12) untuk lihat error
- Test API endpoint langsung dengan curl/Postman
- Check network tab untuk lihat request/response

## 📚 **Additional Resources:**

- **YouTube Data API Documentation**: https://developers.google.com/youtube/v3
- **Google Cloud Console**: https://console.cloud.google.com/
- **Bun Documentation**: https://bun.sh/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## 🔄 **Migration Checklist:**

- [x] Move YouTube config to backend TypeScript
- [x] Create YouTube service layer
- [x] Create YouTube controller dengan Bun fetch API
- [x] Create YouTube routes
- [x] Integrate routes ke main server
- [x] Update environment variables
- [x] Update frontend untuk menggunakan backend API
- [x] Remove frontend YouTube config file
- [x] Test semua endpoints
- [x] Update documentation

## 🚀 **Next Steps:**

1. **Production Deployment**: Update production .env dengan real API credentials
2. **Monitoring**: Add logging dan monitoring untuk API usage
3. **Rate Limiting**: Implement rate limiting untuk prevent abuse
4. **Webhooks**: Consider YouTube webhook untuk real-time updates
5. **Admin Panel**: Buat admin interface untuk manage YouTube settings

---

**Migration completed successfully! 🎉**
