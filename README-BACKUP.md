# Sagawa Group Project - Backup & Restore System

Sistem backup dan restore yang comprehensive untuk proyek Sagawa Group.

## 📁 Files yang Disediakan

1. **`backup.sh`** - Script untuk membuat backup
2. **`restore.sh`** - Script untuk restore dari backup
3. **`README-BACKUP.md`** - Dokumentasi ini

## 🔧 Cara Menggunakan

### Membuat Backup

```bash
# Backup sederhana dengan pengaturan default
./backup.sh

# Backup ke direktori khusus
./backup.sh -d /path/to/custom/backup/dir

# Lihat help
./backup.sh --help
```

### Restore dari Backup

```bash
# Restore interaktif (pilih backup dari daftar)
./restore.sh

# Lihat daftar backup yang tersedia
./restore.sh -l

# Restore otomatis backup terbaru
./restore.sh --latest

# Restore ke direktori khusus
./restore.sh -t /path/to/restore/location

# Restore tanpa install dependencies
./restore.sh --skip-deps

# Force restore (timpa direktori yang sudah ada)
./restore.sh --force

# Lihat help
./restore.sh --help
```

## 📦 Yang Di-backup

### ✅ Disertakan dalam Backup:
- **Source Code**: Semua file .ts, .astro, .js, .json
- **Konfigurasi**: Package.json, tsconfig.json, astro.config.mjs
- **Environment**: File .env (credentials)
- **Assets**: Gambar dan file statis
- **Dependencies Info**: Package.json dan lock files
- **System Info**: Informasi sistem dan versi tools

### ❌ Dikecualikan dari Backup:
- `node_modules/` (akan diinstall ulang saat restore)
- `dist/` dan build artifacts (akan dibuild ulang)
- `uploads/` folder (untuk keamanan, berisi file upload user)

## 🗂️ Struktur Backup

```
sagawagroup_backup_YYYYMMDD_HHMMSS/
├── credentials/
│   └── .env                    # Environment variables
├── dependencies/
│   ├── bun-api-package.json   # API dependencies
│   ├── vue-frontend-package.json
│   └── *.lock files           # Lock files
├── system-info/
│   └── backup-info.txt        # System information
├── bun-api/                   # API source code
└── vue-frontend/              # Frontend source code
```

## 🎯 Fitur Backup

- **Automatic Compression**: Backup otomatis di-compress dengan gzip
- **Colored Output**: Output berwarna untuk kemudahan monitoring
- **Cleanup**: Otomatis hapus backup lama (keep 5 backup terbaru)
- **Size Reporting**: Menampilkan ukuran backup
- **Error Handling**: Penanganan error yang robust

## 🎯 Fitur Restore

- **Interactive Selection**: Pilih backup dari daftar interaktif
- **Auto Latest**: Pilih otomatis backup terbaru
- **Dependency Installation**: Otomatis install dependencies
- **Force Restore**: Opsi untuk timpa direktori existing
- **Restoration Report**: Generate laporan restore
- **System Info**: Tampilkan info sistem dari backup

## 📊 Lokasi Default

- **Backup Directory**: `/root/backups/`
- **Restore Directory**: `/root/sagawagroup-restored/`
- **Source Project**: `/root/sagawagroup/`

## ⚡ Quick Start

```bash
# Buat script executable (sudah dilakukan)
chmod +x backup.sh restore.sh

# Backup proyek
./backup.sh

# Restore proyek (interactive)
./restore.sh
```

## 🛠️ Setelah Restore

1. **Review Environment Variables**:
   ```bash
   vi .env  # Sesuaikan credentials jika diperlukan
   ```

2. **Install Dependencies** (jika di-skip):
   ```bash
   cd bun-api && bun install
   cd ../vue-frontend && bun install
   ```

3. **Start Development Servers**:
   ```bash
   # Terminal 1: API
   cd bun-api && bun run dev
   
   # Terminal 2: Frontend  
   cd vue-frontend && bun run dev
   ```

## 🔍 Troubleshooting

### Backup Gagal
- Periksa permission direktori backup
- Pastikan ada space disk yang cukup
- Periksa source directory exists

### Restore Gagal
- Periksa file backup tidak corrupt
- Pastikan target directory accessible
- Periksa ada Bun/NPM untuk install dependencies

### Dependencies Error
- Install manual: `cd [directory] && bun install`
- Gunakan `--skip-deps` flag saat restore

## 📈 Best Practices

1. **Regular Backup**: Jalankan backup sebelum perubahan besar
2. **Test Restore**: Sesekali test restore untuk memastikan backup valid  
3. **Monitor Space**: Periksa space disk untuk backup directory
4. **Secure Credentials**: Review .env file setelah restore
5. **Version Control**: Backup complement git, bukan pengganti

## 🔐 Keamanan

- File `.env` di-backup untuk kemudahan, tapi **review credentials** setelah restore
- Folder `uploads/` sengaja dikecualikan untuk keamanan
- Backup file di-compress dan disimpan lokal saja

---

**Note**: Script ini dibuat khusus untuk Sagawa Group project structure. Sesuaikan path dan konfigurasi jika diperlukan untuk project lain.