# Supabase Storage Setup Guide

## Overview

Sistem upload untuk KTP dan bukti transfer sekarang menggunakan Supabase Storage untuk menyimpan file gambar, bukan di AstraDB.

## Konfigurasi yang Sudah Diterapkan

### Environment Variables

File `.env`, `.env.development`, dan `.env.production` sudah dikonfigurasi dengan:

```bash
SUPABASE_STORAGE_ENABLED=true
SUPABASE_STORAGE_ENDPOINT=https://rnrxmpmvoqxcdpazikwe.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=ap-southeast-1
SUPABASE_STORAGE_PUBLIC_URL=https://rnrxmpmvoqxcdpazikwe.storage.supabase.co/storage/v1/object/public/mitraPhotos
SUPABASE_STORAGE_BUCKET=mitraPhotos
```

## Langkah Setup

### 1. Dapatkan API Keys dari Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **Settings** > **API**
4. Copy keys berikut:
   - **anon/public key** - untuk `SUPABASE_STORAGE_ACCESS_KEY`
   - **service_role key** - untuk `SUPABASE_STORAGE_SECRET_KEY`

### 2. Buat Storage Bucket

1. Di Supabase Dashboard, buka **Storage**
2. Klik **Create a new bucket**
3. Nama bucket: `mitraPhotos`
4. **Public bucket**: ✅ Centang (agar file bisa diakses publik)
5. Klik **Create bucket**

### 3. Setup Bucket Policies (Opsional)

Untuk keamanan lebih baik, Anda bisa mengatur policies:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'mitraPhotos' );

-- Allow authenticated insert
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'mitraPhotos' AND auth.role() = 'authenticated' );
```

### 4. Update Environment Variables

Edit file `.env.production` dan masukkan keys Anda:

```bash
SUPABASE_STORAGE_ACCESS_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
SUPABASE_STORAGE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key
```

### 5. Restart API Server

```bash
# Development
bun run dev

# Production
pm2 restart sagawagroup-api
```

## Struktur Penyimpanan

File akan disimpan dengan struktur:

```
mitraPhotos/
├── mitra/
│   ├── documents/
│   │   └── 1731744000000-uuid-KTP-filename.jpg
│   └── bukti-transfer/
│       └── 1731744000000-uuid-transfer-filename.jpg
```

## Model Data

Field di database AstraDB hanya menyimpan URL, bukan data binary:

```typescript
interface Mitra {
  // Legacy field
  fotoKTP: string; // URL Supabase: "https://...storage.supabase.co/.../ktp.jpg"

  // New fields
  upload_ktp?: string; // URL Supabase
  upload_tf?: string; // URL Supabase (bukti transfer)

  // Other fields...
}
```

## Cara Kerja Upload

1. **Frontend** mengirim file via FormData
2. **Backend** menerima file dan upload ke Supabase Storage
3. **Supabase** mengembalikan public URL
4. **Backend** menyimpan URL tersebut ke AstraDB
5. **Frontend** bisa langsung akses gambar via URL publik

## Keuntungan

✅ **Efisien**: Database tidak perlu menyimpan data binary besar  
✅ **Scalable**: Supabase Storage dapat menangani banyak file  
✅ **CDN**: File disajikan via CDN Supabase yang cepat  
✅ **Backup**: Supabase otomatis backup storage  
✅ **Biaya**: Storage terpisah dari database

## Fallback ke Local Storage

Jika Supabase tidak aktif (`SUPABASE_STORAGE_ENABLED=false`), sistem otomatis fallback ke local storage di folder `uploads/`.

## Testing

Test upload dengan:

```bash
curl -X POST http://localhost:3000/api/mitra/register \
  -F "namaMitra=Test User" \
  -F "documents=@/path/to/ktp.jpg" \
  -F "buktiTransfer=@/path/to/transfer.jpg" \
  # ... other fields
```

Check log untuk melihat:

```
[IMAGE UPLOAD] Supabase storage enabled: yes
[IMAGE UPLOAD] Uploading file to Supabase bucket folder: documents
[IMAGE UPLOAD] Supabase upload complete: https://...
```

## Troubleshooting

### Error: "Supabase storage is not configured"

- Pastikan `SUPABASE_STORAGE_ENABLED=true`
- Pastikan semua environment variables sudah diisi

### Error: "Access denied" atau "401 Unauthorized"

- Periksa API keys (anon/service_role key)
- Pastikan bucket policy mengizinkan upload

### File tidak muncul

- Periksa bucket name: harus `mitraPhotos`
- Pastikan bucket di-set sebagai **public**
- Cek URL di response: `upload_ktp` dan `upload_tf`

## Support

Untuk bantuan lebih lanjut, hubungi tim development atau lihat:

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [AWS S3 SDK Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
