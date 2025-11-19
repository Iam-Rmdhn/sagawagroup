# Google Drive Gallery - Panduan Setup Lengkap

## ✅ Status Integrasi
- API sudah terkonfigurasi dengan benar
- Service account berhasil diinisialisasi
- **Masalah**: Folder masih kosong atau service account belum punya akses

## 📋 Langkah-Langkah Setup

### 1. **Buka Google Drive Folder**
   - Buka link: https://drive.google.com/drive/folders/`1jQUDqepzgNXsUrIAQSliAJiXYdIrBKLt`
   - Atau buka Google Drive dan cari folder dengan ID tersebut

### 2. **Berikan Akses ke Service Account** ⚠️ PENTING!
   
   **Email Service Account Anda:**
   ```
   sagawa-gallery-service@sagawagroup-api.iam.gserviceaccount.com
   ```

   **Cara memberikan akses:**
   1. Buka folder di Google Drive (ID: `1jQUDqepzgNXsUrIAQSliAJiXYdIrBKLt`)
   2. Klik kanan pada folder → **Share** (atau **Bagikan**)
   3. Masukkan email: `sagawa-gallery-service@sagawagroup-api.iam.gserviceaccount.com`
   4. Pilih role: **Viewer** (atau **Pembaca**)
   5. Klik **Send** (atau **Kirim**)

### 3. **Upload Foto ke Folder**
   
   **Format gambar yang didukung:**
   - ✅ JPG/JPEG (`.jpg`, `.jpeg`)
   - ✅ PNG (`.png`)
   - ✅ GIF (`.gif`)
   - ✅ WEBP (`.webp`)
   - ✅ BMP (`.bmp`)
   
   **Tips upload foto:**
   - Upload langsung ke folder (jangan di dalam subfolder)
   - Gunakan nama file yang deskriptif (misal: `outlet-jakarta-1.jpg`)
   - Ukuran file maksimal yang direkomendasikan: 5MB per foto
   - Untuk performa terbaik, gunakan format JPG dengan kualitas 80-90%

### 4. **Verifikasi Permissions**
   
   Setelah memberikan akses, coba jalankan test:
   ```bash
   cd /root/web_company_profile/sagawagroup/bun-api
   bun run test-gallery.ts
   ```
   
   Output yang diharapkan:
   ```
   ✅ Enabled
   Found X images
   
   Sample images:
   1. nama-foto.jpg
      ID: xxxxx
      Type: image/jpeg
      Thumbnail: ✅
      Web Link: ✅
   ```

### 5. **Test di Frontend**
   
   Setelah foto muncul di test, jalankan:
   ```bash
   # Start backend
   cd bun-api
   bun run dev
   
   # Di terminal baru, start frontend
   cd vue-frontend
   npm run dev
   ```
   
   Buka browser: `http://localhost:4321/gallery`

## 🔍 Troubleshooting

### ❌ "No images found in the folder"
**Penyebab:**
- Folder masih kosong
- Service account belum diberi akses ke folder
- Folder ID salah

**Solusi:**
1. Pastikan folder sudah di-share dengan service account email
2. Upload minimal 1 foto ke folder
3. Tunggu 1-2 menit, lalu test ulang

### ❌ "Permission denied" atau "Access denied"
**Penyebab:**
- Service account belum diberi permission

**Solusi:**
1. Buka folder di Google Drive
2. Klik **Share** → Tambahkan email service account
3. Pilih role **Viewer** atau **Editor**

### ❌ Foto tidak muncul di carousel
**Penyebab:**
- API belum running
- Frontend belum load data
- CORS issue

**Solusi:**
1. Pastikan backend running di port 3000
2. Check browser console untuk error
3. Refresh halaman gallery

## 📊 Monitoring

### Cek Status API
```bash
curl http://localhost:3000/api/gallery/health
```

Output yang baik:
```json
{
  "success": true,
  "status": "healthy",
  "enabled": true,
  "folderId": "configured",
  "timestamp": "2025-11-18T..."
}
```

### Cek Jumlah Foto
```bash
curl http://localhost:3000/api/gallery/images
```

## 🎯 Best Practices

1. **Organisasi Folder:**
   - Gunakan folder khusus untuk gallery (jangan campur dengan file lain)
   - Nama file descriptive: `outlet-name-location-1.jpg`
   
2. **Optimasi Gambar:**
   - Compress gambar sebelum upload (gunakan tools seperti TinyPNG)
   - Resolusi recommended: 1920x1080px atau 1280x720px
   - Format: JPG untuk foto, PNG untuk gambar dengan transparansi

3. **Security:**
   - Service account key sudah di `.gitignore` ✅
   - Jangan share service account key di public
   - Folder hanya perlu permission "Viewer" untuk service account

## 🔄 Update Foto

Setelah setup awal selesai:
1. Upload foto baru langsung ke Google Drive folder
2. Foto akan otomatis muncul di website (auto-refresh atau reload halaman)
3. Tidak perlu restart server atau build ulang

## 📝 Notes

- API mengambil maksimal 100 foto terbaru (sorted by modified time desc)
- Thumbnail dan preview URL sudah di-handle otomatis oleh Google Drive
- Loading performance: ~1-2 detik untuk 50 foto

---

**Folder ID Anda:** `1jQUDqepzgNXsUrIAQSliAJiXYdIrBKLt`  
**Service Account:** `sagawa-gallery-service@sagawagroup-api.iam.gserviceaccount.com`  
**Backend Port:** `3000`  
**Frontend Port (dev):** `4321`
