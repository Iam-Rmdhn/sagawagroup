# Setup YouTube API Integration

## Panduan Langkah demi Langkah

### 1. Dapatkan YouTube API Key

1. **Buka Google Cloud Console**
   - Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
   - Login dengan akun Google Anda

2. **Buat atau Pilih Project**
   - Klik dropdown project di bagian atas
   - Pilih project existing atau buat project baru
   - Beri nama project (contoh: "Sagawa Group Website")

3. **Aktifkan YouTube Data API v3**
   - Di sidebar, pilih "APIs & Services" > "Library"
   - Cari "YouTube Data API v3"
   - Klik dan tekan tombol "ENABLE"

4. **Buat API Key**
   - Di sidebar, pilih "APIs & Services" > "Credentials"
   - Klik "CREATE CREDENTIALS" > "API Key"
   - Copy API Key yang dihasilkan
   - **PENTING**: Simpan API Key ini dengan aman

5. **Batasi API Key (Recommended)**
   - Klik ikon edit pada API Key yang baru dibuat
   - Di "Application restrictions", pilih "HTTP referrers"
   - Tambahkan domain website Anda (contoh: `https://sagawagroup.com/*`)
   - Di "API restrictions", pilih "Restrict key" dan pilih "YouTube Data API v3"
   - Klik "SAVE"

### 2. Dapatkan Channel ID

#### Metode 1: Dari URL Channel

Jika URL channel Anda seperti: `https://youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxx`

- Channel ID adalah bagian setelah `/channel/`: `UCxxxxxxxxxxxxxxxxxxxxx`

#### Metode 2: Dari Custom URL

Jika URL channel Anda seperti: `https://youtube.com/c/YourChannelName`

1. Buka channel YouTube Anda
2. Lihat source code halaman (Ctrl+U)
3. Cari text `"channelId":"UCxxxxxxxxxxxxxxxxxxxxx"`
4. Atau gunakan tool online: [whatsmyuserid.com](https://www.whatsmyuserid.com/)

#### Metode 3: Dari YouTube Studio

1. Buka [YouTube Studio](https://studio.youtube.com/)
2. Di sidebar, pilih "Customization" > "Basic info"
3. Channel ID ditampilkan di bagian bawah

### 3. Setup di Website

1. **Edit file konfigurasi**

   ```javascript
   // src/config/youtube.config.js
   export const YOUTUBE_CONFIG = {
     apiKey: "PASTE_YOUR_API_KEY_HERE",
     channelId: "PASTE_YOUR_CHANNEL_ID_HERE",
     playlistId: null, // Opsional
     maxResults: 9,
     orderBy: "date",
     publishedAfter: null,
     cacheTimeout: 5 * 60 * 1000,
   };
   ```

2. **Test integration**
   - Buka website Anda
   - Pergi ke halaman Gallery
   - Klik tab "Video"
   - Video dari YouTube channel Anda harus muncul

### 4. Troubleshooting

#### Error: "API key not valid"

- Pastikan API Key benar dan tidak ada spasi ekstra
- Cek apakah YouTube Data API v3 sudah diaktifkan
- Pastikan domain website sudah ditambahkan di HTTP referrer restrictions

#### Error: "The request cannot be completed because you have exceeded your quota"

- YouTube API memiliki quota harian gratis: 10,000 units
- Setiap request menggunakan sekitar 100 units
- Jika terlampaui, tunggu 24 jam atau upgrade ke paid plan

#### Video tidak muncul

- Pastikan Channel ID benar
- Cek apakah channel memiliki video yang public
- Pastikan video tidak dalam status private/unlisted

#### Loading terus menerus

- Buka Developer Console (F12) untuk lihat error
- Cek koneksi internet
- Pastikan tidak ada ad blocker yang memblokir request ke YouTube API

### 5. Menggunakan Playlist (Opsional)

Jika Anda ingin menampilkan hanya video dari playlist tertentu:

1. **Dapatkan Playlist ID**
   - Buka playlist di YouTube
   - Lihat URL: `https://youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxxxxx`
   - Playlist ID adalah: `PLxxxxxxxxxxxxxxxxxxxxx`

2. **Update konfigurasi**
   ```javascript
   export const YOUTUBE_CONFIG = {
     apiKey: "YOUR_API_KEY",
     channelId: null, // Kosongkan jika menggunakan playlist
     playlistId: "YOUR_PLAYLIST_ID",
     maxResults: 9,
     // ... config lainnya
   };
   ```

### 6. Tips Optimasi

1. **Cache Management**
   - Video di-cache selama 5 menit secara default
   - Sesuaikan `cacheTimeout` sesuai kebutuhan
   - Cache disimpan di localStorage browser

2. **Performance**
   - Gunakan `maxResults` yang reasonable (6-12 video)
   - Video thumbnail loading menggunakan lazy loading
   - Pertimbangkan pagination untuk channel dengan banyak video

3. **SEO**
   - Video title dan description otomatis digunakan untuk meta tags
   - Thumbnail menggunakan lazy loading untuk performance

### 7. Monitoring dan Analytics

- Monitor usage quota di Google Cloud Console
- Setup alerts jika mendekati quota limit
- Gunakan Google Analytics untuk track engagement video

### 8. Security Notes

- **JANGAN** commit API Key ke public repository
- Gunakan environment variables untuk production
- Regularly rotate API Keys
- Monitor API usage untuk detect abuse

## Contoh Implementasi Lanjutan

### Menampilkan Video Terbaru (30 hari)

```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
export const YOUTUBE_CONFIG = {
  // ... config lainnya
  publishedAfter: thirtyDaysAgo.toISOString(),
};
```

### Menampilkan Video Berdasarkan Views

```javascript
export const YOUTUBE_CONFIG = {
  // ... config lainnya
  orderBy: "viewCount", // Urutkan berdasarkan jumlah views
};
```

### Multiple Channels/Playlists

Jika ingin menampilkan dari multiple sources, buat array konfigurasi:

```javascript
export const YOUTUBE_CONFIGS = [
  {
    name: "Channel Utama",
    channelId: "CHANNEL_ID_1",
    maxResults: 6,
  },
  {
    name: "Playlist Tutorial",
    playlistId: "PLAYLIST_ID_1",
    maxResults: 3,
  },
];
```

## Support

Jika mengalami masalah dengan setup YouTube API, silakan:

1. Cek dokumentasi resmi [YouTube Data API](https://developers.google.com/youtube/v3)
2. Lihat troubleshooting section di atas
3. Contact developer team
