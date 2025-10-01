# Visitor Analytics Implementation

## Overview
Implementasi sistem tracking pengunjung real-time pada dashboard admin dengan integrasi Google Analytics.

## Features Implemented

### 1. Google Analytics Integration
- **File**: `vue-frontend/src/layouts/Layout.astro`
- Google Analytics tag (G-3EKRGXR1J5) telah ditambahkan di semua halaman
- Tracking pageviews dan user behavior secara otomatis

### 2. Real-time Visitor Counter Backend
- **File**: `bun-api/src/routes/analytics.route.ts`
- **Endpoints**:
  - `POST /api/analytics/track` - Track page views dan visitor sessions
  - `GET /api/analytics/stats` - Ambil statistik visitor real-time
  - `POST /api/analytics/heartbeat` - Keep session alive

#### Features:
- In-memory visitor tracking dengan session management
- Auto-cleanup inactive sessions (5 menit timeout)
- Tracking metrics:
  - Total visitors
  - Active visitors (real-time)
  - Total page views

### 3. Dashboard Admin - Visitor Stats Card
- **File**: `vue-frontend/src/pages/admin/dashboard.astro`
- Card baru "Visitor Online" ditambahkan di dashboard
- Menampilkan jumlah pengunjung aktif real-time
- Icon mata (eye) dengan gradient hijau
- Update otomatis setiap 10 detik

### 4. Client-side Tracking
- **File**: `vue-frontend/src/layouts/Layout.astro`
- Automatic page view tracking pada semua halaman
- Session persistence menggunakan localStorage
- Heartbeat mechanism (setiap 2 menit) untuk keep session alive
- Clean up on page unload

## How It Works

### Client Side (Visitor)
1. User membuka website Sagawa Group
2. Script di Layout.astro otomatis:
   - Generate/retrieve session ID dari localStorage
   - Track page view ke API
   - Send heartbeat setiap 2 menit
3. Google Analytics juga tracking secara paralel

### Server Side (Backend API)
1. Menerima tracking events dari client
2. Simpan session information di memory
3. Update active visitor count
4. Auto-cleanup inactive sessions setiap 5 menit

### Admin Dashboard
1. Dashboard admin fetch stats dari `/api/analytics/stats`
2. Update display setiap 10 detik
3. Smooth animation saat angka berubah
4. Real-time visibility pengunjung aktif

## API Endpoints Details

### POST /api/analytics/track
Track page view atau event dari visitor
```json
Request:
{
  "sessionId": "vis_1234567890_abc123",
  "eventType": "pageview",
  "page": "/",
  "timestamp": "2025-10-01T10:30:00.000Z"
}

Response:
{
  "success": true,
  "sessionId": "vis_1234567890_abc123",
  "activeVisitors": 5
}
```

### GET /api/analytics/stats
Ambil statistik visitor untuk admin dashboard
```json
Response:
{
  "totalVisitors": 150,
  "activeVisitors": 5,
  "totalPageViews": 450,
  "timestamp": "2025-10-01T10:30:00.000Z"
}
```

### POST /api/analytics/heartbeat
Keep session alive untuk active visitors
```json
Request:
{
  "sessionId": "vis_1234567890_abc123"
}

Response:
{
  "success": true,
  "activeVisitors": 5
}
```

## Configuration

### API URL
Default: `https://api.sagawagroup.id`
Dapat diubah di:
- `vue-frontend/src/layouts/Layout.astro` (line ~180)
- `vue-frontend/src/pages/admin/dashboard.astro` (line ~871)

### Update Intervals
- **Heartbeat**: 2 menit (client to server)
- **Dashboard refresh**: 10 detik (admin dashboard)
- **Session cleanup**: 5 menit (server-side)
- **Session timeout**: 5 menit inactivity

## Benefits

1. **Real-time Monitoring**: Admin dapat melihat jumlah pengunjung aktif secara real-time
2. **Session Management**: Tracking session dengan proper cleanup untuk accurate counts
3. **Dual Analytics**: Google Analytics untuk detailed insights + custom tracking untuk real-time dashboard
4. **Lightweight**: In-memory tracking tanpa perlu database tambahan
5. **Auto-cleanup**: Tidak ada memory leak dengan automatic session cleanup

## Testing

### Test Visitor Tracking:
1. Buka website Sagawa Group di beberapa browser/tab berbeda
2. Check browser console untuk log "[Analytics] Page view tracked"
3. Buka Admin Dashboard
4. Lihat card "Visitor Online" - akan menampilkan jumlah active visitors
5. Refresh halaman atau buka tab baru - angka akan update

### Test Session Persistence:
1. Buka website
2. Check localStorage untuk 'visitor_session_id'
3. Refresh halaman - session ID tetap sama
4. Tunggu >5 menit tanpa activity - session akan expire

## Maintenance Notes

- Visitor data tersimpan di memory server, akan reset saat server restart
- Untuk persistent storage, bisa tambahkan database integration
- Active visitor count akurat untuk visitors dalam 5 menit terakhir
- Google Analytics data tersedia di Google Analytics Dashboard untuk historical analysis

## Future Enhancements

1. **Database Integration**: Simpan visitor history untuk analytics jangka panjang
2. **Visitor Location**: Track location data untuk geographic insights
3. **Page Analytics**: Detailed per-page visitor statistics
4. **Traffic Sources**: Track dari mana visitor datang (referrer, campaign, etc)
5. **Dashboard Charts**: Visualisasi traffic patterns per jam/hari/bulan
6. **Conversion Tracking**: Track visitor actions (form submissions, clicks, etc)
