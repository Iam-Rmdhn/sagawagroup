# Integrasi Supabase Storage untuk Foto Mitra

## Overview

Sistem sekarang mendukung penyimpanan foto/dokumen mitra menggunakan **Supabase Storage** sebagai pengganti local storage. Foto akan otomatis diupload ke bucket Supabase dan URL publik disimpan di database.

## Perubahan yang Dilakukan

### 1. Backend API (Bun)

#### File: `bun-api/src/controllers/mitra.controller.ts`

**Perubahan:**

- Upload foto KTP dan Bukti Transfer sekarang menggunakan Supabase Storage (jika enabled)
- Field baru ditambahkan di database:
  - `upload_ktp`: Menyimpan full URL Supabase Storage untuk foto KTP
  - `upload_tf`: Menyimpan full URL Supabase Storage untuk bukti transfer
- Field legacy tetap ada untuk backward compatibility:
  - `fotoKTP`: Menyimpan relative path untuk compatibility
  - `buktiTransfer`: Menyimpan relative path untuk compatibility

**Logika Upload:**

```typescript
// Jika Supabase enabled:
mitraData.upload_ktp = savedKTP.absoluteUrl; // Full Supabase URL
mitraData.fotoKTP = normalizedPath; // Relative path (legacy)

// Jika Supabase disabled (local storage):
mitraData.upload_ktp = normalizedPath; // Relative path
mitraData.fotoKTP = normalizedPath; // Relative path
```

#### File: `bun-api/src/controllers/pelunasan.controller.ts`

**Perubahan:**

- Upload bukti transfer pelunasan juga menggunakan Supabase Storage
- Field baru `upload_tf` ditambahkan
- Validasi file type (JPG/PNG only) dan size (max 5MB)

#### File: `bun-api/src/models/mitra.model.ts`

**Field baru:**

```typescript
export interface Mitra {
  // ... existing fields
  upload_ktp?: string; // URL to KTP image in Supabase Storage
  upload_tf?: string; // URL to bukti transfer in Supabase Storage
  // ... existing fields
}
```

#### File: `bun-api/src/models/mitra-pelunasan.model.ts`

**Field baru:**

```typescript
export interface MitraPelunasan {
  // ... existing fields
  upload_tf?: string; // Supabase Storage URL or local path
  // ... existing fields
}
```

### 2. Frontend (Astro/Vue)

#### File: `vue-frontend/src/pages/admin/dashboard.astro`

**Perubahan:**

- Function `processImageData()` diupdate untuk mendeteksi dan handle Supabase Storage URLs
- Prioritas field: `upload_ktp` > `fotoKTP` (legacy fallback)
- Prioritas field: `upload_tf` > `buktiTransfer` (legacy fallback)

**Logika Display:**

```typescript
// Priority: Use Supabase URLs first
const ktpImage = mitra.upload_ktp || mitra.fotoKTP;
const tfImage = mitra.upload_tf || mitra.buktiTransfer;

// Process akan detect jika URL adalah Supabase (https://...)
// dan return as-is tanpa modifikasi
```

## Cara Kerja Sistem

### Upload Flow

```
1. User submit form dengan file foto
   ↓
2. Backend check apakah Supabase enabled
   ↓
   YES → Upload ke Supabase Storage
   |     - Path: mitra/documents/timestamp-uuid-filename.jpg
   |     - Dapat public URL: https://xxx.supabase.co/storage/.../file.jpg
   |     - Simpan di upload_ktp / upload_tf
   |
   NO → Upload ke local storage
        - Path: ./uploads/timestamp-filename.jpg
        - Relative path: /uploads/timestamp-filename.jpg
        - Simpan di upload_ktp / upload_tf
   ↓
3. Save ke database dengan field lengkap:
   - upload_ktp / upload_tf (Supabase URL atau local path)
   - fotoKTP / buktiTransfer (legacy relative path)
```

### Display Flow

```
1. Frontend fetch data mitra dari API
   ↓
2. Check field upload_ktp dan upload_tf dulu (priority)
   ↓
3. Jika kosong, fallback ke fotoKTP / buktiTransfer (legacy)
   ↓
4. Process URL:
   - Jika dimulai dengan https:// → Supabase URL, return as-is
   - Jika dimulai dengan /uploads/ → Local path, build full URL
   - Jika data:image → Base64, return as-is
   ↓
5. Display di modal detail
```

## Environment Variables

Pastikan `.env` file memiliki konfigurasi Supabase Storage:

```env
# Supabase Storage Configuration
SUPABASE_STORAGE_ENABLED=true
SUPABASE_STORAGE_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_STORAGE_SECRET_KEY=your-service-role-key
SUPABASE_STORAGE_PUBLIC_URL=https://your-project.supabase.co/storage/v1/object/public/your-bucket-name
```

## Bucket Structure di Supabase

```
your-bucket-name/
├── mitra/
│   ├── documents/          # Foto KTP
│   │   ├── 1234567890-uuid-ktp.jpg
│   │   └── ...
│   ├── bukti-transfer/     # Bukti transfer initial
│   │   ├── 1234567890-uuid-tf.jpg
│   │   └── ...
│   └── pelunasan/          # Bukti transfer pelunasan
│       ├── 1234567890-uuid-pelunasan.jpg
│       └── ...
```

## Backward Compatibility

Sistem tetap mendukung data lama:

- Data mitra lama yang hanya punya field `fotoKTP` dan `buktiTransfer` akan tetap bisa ditampilkan
- Frontend akan fallback ke field legacy jika field baru kosong
- Local storage masih didukung jika Supabase disabled

## Testing

### Test Upload Baru

1. Daftarkan mitra baru dengan foto
2. Check di Supabase Storage Dashboard apakah file terupload
3. Check database apakah field `upload_ktp` dan `upload_tf` terisi dengan URL Supabase
4. Buka detail mitra di admin dashboard
5. Pastikan foto tampil dengan benar

### Test Backward Compatibility

1. Ambil data mitra lama (sebelum integrasi Supabase)
2. Buka detail mitra
3. Pastikan foto tetap tampil dari local storage

## Troubleshooting

### Foto tidak tampil di detail mitra

1. Check console browser untuk melihat URL yang di-generate
2. Check apakah field `upload_ktp` / `upload_tf` ada di response API
3. Verify Supabase bucket policy adalah public
4. Test URL Supabase langsung di browser

### Upload gagal ke Supabase

1. Check environment variables
2. Verify Supabase credentials
3. Check bucket permissions
4. Review backend logs untuk error details

### Legacy data tidak tampil

1. Check apakah field `fotoKTP` dan `buktiTransfer` masih ada di database
2. Verify file fisik ada di folder `./uploads/`
3. Check nginx/server configuration untuk serve static files

## Migration Script (Optional)

Jika ingin migrate data lama ke Supabase:

```typescript
// TODO: Create migration script to:
// 1. Read all mitra with only fotoKTP/buktiTransfer
// 2. Upload files from ./uploads/ to Supabase
// 3. Update database dengan URL Supabase
// 4. Simpan di field upload_ktp / upload_tf
```

## Security Notes

- Supabase bucket harus dikonfigurasi dengan proper RLS policies
- Service role key harus disimpan dengan aman (tidak expose ke frontend)
- File validation dilakukan di backend (type, size)
- Public URL dari Supabase tidak mengandung sensitive data

## References

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Implementation file: `bun-api/src/utils/supabaseStorage.ts`
- Setup guide: `bun-api/SUPABASE-STORAGE-SETUP.md`
