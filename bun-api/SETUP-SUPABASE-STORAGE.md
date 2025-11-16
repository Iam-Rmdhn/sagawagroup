# 🚀 Panduan Setup Supabase Storage - Lengkap

## ❌ Error yang Anda Alami

```
InvalidAccessKeyId: The Access Key Id you provided does not exist in our records.
```

**Penyebab:** Access Key atau Service Role Key tidak valid/salah.

## ✅ Solusi: Setup Ulang Supabase Storage

### Step 1: Login ke Supabase Dashboard

1. Buka: https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project: **rnrxmpmvoqxcdpazikwe**

### Step 2: Cek/Buat Storage Bucket

1. Di sidebar kiri, klik **Storage**
2. Lihat apakah bucket `mitraPhotos` sudah ada
3. Jika belum ada:
   - Klik **New bucket**
   - Name: `mitraPhotos`
   - ✅ Centang **Public bucket** (agar file bisa diakses publik)
   - Klik **Create bucket**

### Step 3: Dapatkan API Keys yang BENAR

1. Di sidebar kiri, klik **Project Settings** (icon ⚙️)
2. Klik **API**
3. Scroll ke bawah, Anda akan melihat:

   **Project API keys:**

   - `anon` `public` key - Copy key ini (panjang, dimulai dengan `eyJ...`)
   - `service_role` `secret` key - Copy key ini (panjang, dimulai dengan `eyJ...`)

### Step 4: Update Environment Variables

Edit file berikut dan ganti dengan keys yang BARU:

**File: `/root/web_company_profile/sagawagroup/bun-api/.env`**

```bash
SUPABASE_STORAGE_ACCESS_KEY=<paste_anon_key_disini>
SUPABASE_STORAGE_SECRET_KEY=<paste_service_role_key_disini>
```

**File: `/root/web_company_profile/sagawagroup/bun-api/.env.development`**

```bash
SUPABASE_STORAGE_ACCESS_KEY=<paste_anon_key_disini>
SUPABASE_STORAGE_SECRET_KEY=<paste_service_role_key_disini>
```

**File: `/root/web_company_profile/sagawagroup/bun-api/.env.production`**

```bash
SUPABASE_STORAGE_ACCESS_KEY=<paste_anon_key_disini>
SUPABASE_STORAGE_SECRET_KEY=<paste_service_role_key_disini>
```

### Step 5: Verifikasi Konfigurasi Lainnya

Pastikan nilai berikut sudah benar di semua file `.env`:

```bash
SUPABASE_STORAGE_ENABLED=true
SUPABASE_STORAGE_BUCKET=mitraPhotos
SUPABASE_STORAGE_REGION=ap-southeast-1
```

**Untuk Endpoint & Public URL:**

- Ganti `rnrxmpmvoqxcdpazikwe` dengan **Supabase Project Reference ID** Anda
- Cek di: **Project Settings** > **General** > **Reference ID**

```bash
SUPABASE_STORAGE_ENDPOINT=https://[YOUR_PROJECT_REF].supabase.co/storage/v1/s3
SUPABASE_STORAGE_PUBLIC_URL=https://[YOUR_PROJECT_REF].supabase.co/storage/v1/object/public/mitraPhotos
```

### Step 6: Setup Bucket Policies (PENTING!)

Jika bucket sudah public tapi masih error, tambahkan policies:

1. Di Supabase Dashboard, buka **Storage** > Pilih bucket `mitraPhotos`
2. Klik tab **Policies**
3. Klik **New Policy**
4. Pilih **For full customization**
5. Policy name: `Allow public read and service upload`
6. Allowed operation: Pilih **SELECT** dan **INSERT**
7. Target roles: `anon`, `authenticated`, `service_role`
8. Policy definition:

```sql
-- Policy 1: Allow public read
CREATE POLICY "Public Access - Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'mitraPhotos' );

-- Policy 2: Allow service role to upload
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mitraPhotos'
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
);

-- Policy 3: Allow update
CREATE POLICY "Service Role Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'mitraPhotos' )
WITH CHECK ( bucket_id = 'mitraPhotos' );

-- Policy 4: Allow delete
CREATE POLICY "Service Role Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'mitraPhotos' );
```

### Step 7: Restart Backend Server

Setelah update environment variables:

**Development:**

```bash
cd /root/web_company_profile/sagawagroup/bun-api
bun index.ts
```

**Production:**

```bash
pm2 restart sagawagroup-api
# atau
cd /root/web_company_profile/sagawagroup
./deploy-production.sh
```

### Step 8: Test Upload

Coba upload foto mitra dari form. Cek log:

```bash
# Development
cd /root/web_company_profile/sagawagroup/bun-api
bun index.ts 2>&1 | grep "IMAGE UPLOAD"

# Production
pm2 logs sagawagroup-api | grep "IMAGE UPLOAD"
```

**Log yang benar:**

```
[IMAGE UPLOAD] Supabase storage enabled: yes
[IMAGE UPLOAD] Uploading file to Supabase bucket folder: documents
[IMAGE UPLOAD] Supabase upload complete: https://rnrxmpmvoqxcdpazikwe.supabase.co/...
```

## 🔍 Troubleshooting

### Error: "InvalidAccessKeyId"

- ❌ **Penyebab:** Keys salah atau expired
- ✅ **Solusi:** Copy ulang keys dari Dashboard > API > Project API keys

### Error: "Access denied" atau "403 Forbidden"

- ❌ **Penyebab:** Bucket policies tidak mengizinkan upload
- ✅ **Solusi:** Setup policies seperti di Step 6

### Error: "Bucket not found"

- ❌ **Penyebab:** Nama bucket salah atau belum dibuat
- ✅ **Solusi:** Pastikan bucket `mitraPhotos` ada di Storage

### File tidak muncul di Supabase

- ❌ **Penyebab:** Upload gagal atau URL salah
- ✅ **Solusi:**
  - Cek log backend untuk error
  - Verifikasi bucket name
  - Pastikan bucket public

### Masih pakai local storage (uploads/)

- ❌ **Penyebab:** `SUPABASE_STORAGE_ENABLED=false`
- ✅ **Solusi:** Set `SUPABASE_STORAGE_ENABLED=true`

## 📋 Checklist Lengkap

- [ ] Login ke Supabase Dashboard
- [ ] Bucket `mitraPhotos` sudah dibuat
- [ ] Bucket di-set sebagai **Public**
- [ ] Copy `anon key` dari Dashboard
- [ ] Copy `service_role key` dari Dashboard
- [ ] Update `.env` dengan keys yang baru
- [ ] Update `.env.development` dengan keys yang baru
- [ ] Update `.env.production` dengan keys yang baru
- [ ] Verifikasi `SUPABASE_STORAGE_ENABLED=true`
- [ ] Verifikasi `SUPABASE_STORAGE_BUCKET=mitraPhotos`
- [ ] Setup bucket policies (opsional tapi recommended)
- [ ] Restart backend server
- [ ] Test upload foto dari form
- [ ] Cek log untuk konfirmasi upload sukses
- [ ] Verifikasi file muncul di Supabase Storage

## 🎯 Hasil Akhir

Setelah setup berhasil:

1. **Foto mitra upload** → Masuk ke Supabase Storage (folder: `mitra/documents/`)
2. **Bukti transfer** → Masuk ke Supabase Storage (folder: `mitra/bukti-transfer/`)
3. **URL foto** → Disimpan di AstraDB
4. **Data mitra** → Disimpan di AstraDB

File struktur di Supabase:

```
mitraPhotos/
├── mitra/
│   ├── documents/
│   │   └── 1763298412603-uuid-KTP.jpg
│   └── bukti-transfer/
│       └── 1763298412603-uuid-transfer.jpg
```

## 📞 Bantuan

Jika masih error, kirim screenshot:

1. Error message lengkap dari terminal
2. Supabase Dashboard > Storage (screenshot bucket list)
3. Supabase Dashboard > Settings > API (screenshot keys - HIDE secret key!)

---

**✅ Setup selesai! Foto mitra sekarang akan diupload ke Supabase Storage.**
