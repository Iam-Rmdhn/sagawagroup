# Panduan Lengkap Deployment Sagawa Group

Dokumentasi ini menjelaskan langkah-langkah komprehensif untuk melakukan deployment penuh dari aplikasi Sagawa Group menggunakan Nginx sebagai reverse proxy dengan SSL otomatis.

## 📋 Daftar Isi

1. [Prasyarat Sistem](#prasyarat-sistem)
2. [Struktur Deployment](#struktur-deployment)
3. [Langkah-Langkah Deployment Utama](#langkah-langkah-deployment-utama)
4. [Setup SSL dengan Let's Encrypt](#setup-ssl-dengan-lets-encrypt)
5. [Deployment Subdomain Admin](#deployment-subdomain-admin)
6. [CI/CD Setup](#cicd-setup)
7. [Monitoring dan Health Check](#monitoring-dan-health-check)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Prasyarat Sistem

Sebelum memulai deployment, pastikan server Anda telah memenuhi prasyarat berikut:

- Sistem operasi: Ubuntu 20.04 LTS atau lebih baru
- Akses root atau sudo
- Port 80 dan 443 terbuka
- Domain telah ditunjuk ke IP server (A Record)
- Domain admin.sagawagroup.id juga ditunjuk ke IP server (A Record atau CNAME)

## Struktur Deployment

```
/var/www/sagawagroup/
├── frontend/          # File-file frontend (HTML, CSS, JS)
├── api/              # Backend API
├── uploads/          # File-file upload dari pengguna
├── logs/             # Log aplikasi
└── ecosystem.config.cjs  # Konfigurasi PM2
```

## Langkah-Langkah Deployment Utama

### 1. Persiapan Server

```bash
# Perbarui sistem
sudo apt update && sudo apt upgrade -y

# Install dependensi sistem
sudo apt install -y curl git build-essential
```

### 2. Install Runtime dan Tools

```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash
export PATH="/root/.bun/bin:$PATH"
source ~/.bashrc

# Install PM2
npm install -g pm2

# Install Nginx (akan diinstal otomatis saat deployment)
```

### 3. Clone Repository

```bash
cd /root
git clone https://github.com/tsubametaa/sagawagroup.git
cd sagawagroup
```

### 4. Jalankan Deployment Production

```bash
# Berikan hak akses eksekusi pada skrip deployment
chmod +x deploy-production.sh

# Jalankan deployment (akan otomatis menginstal semua dependensi)
sudo ./deploy-production.sh
```

Perintah ini akan:
- Membuat backup deployment lama (jika ada)
- Install Nginx dan dependensi lainnya
- Build frontend
- Deploy API
- Setting up PM2 untuk manajemen proses
- Setup Nginx configuration
- Setup SSL certificate (jika domain valid)
- Start semua layanan

## Setup SSL dengan Let's Encrypt

### 1. Pastikan Domain Valid

Pastikan DNS record sudah aktif:

```bash
nslookup sagawagroup.id
nslookup www.sagawagroup.id
```

### 2. Jalankan Setup SSL

```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

### 3. Verifikasi SSL

```bash
# Lihat sertifikat
sudo certbot certificates

# Cek status auto-renewal
sudo systemctl status certbot-renewal.timer
```

### 4. SSL Renewal

SSL certificate akan diperbarui secara otomatis setiap hari melalui cron job dan systemd timer.

## Deployment Subdomain Admin

### 1. Deploy Konfigurasi Subdomain

```bash
chmod +x deploy-admin-subdomain.sh
sudo ./deploy-admin-subdomain.sh
```

### 2. Setup SSL untuk Subdomain Admin

Pastikan DNS untuk admin.sagawagroup.id sudah aktif:

```bash
nslookup admin.sagawagroup.id
nslookup www.admin.sagawagroup.id
```

Kemudian jalankan setup SSL:

```bash
# Buat skrip setup SSL untuk admin jika belum ada
sudo cat > /root/sagawagroup/setup-admin-ssl.sh << 'EOF'
#!/bin/bash

DOMAIN="admin.sagawagroup.id"
WWW_DOMAIN="www.admin.sagawagroup.id"
EMAIL="admin@sagawagroup.id"
WEBROOT="/var/www/certbot"

# Install certbot jika belum ada
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Setup SSL
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

if [ $? -eq 0 ]; then
    echo "SSL certificate for admin subdomain obtained successfully!"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 13 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "SSL auto-renewal configured for admin subdomain"
else
    echo "Failed to obtain SSL certificate for admin subdomain"
fi
EOF

chmod +x /root/sagawagroup/setup-admin-ssl.sh
sudo /root/sagawagroup/setup-admin-ssl.sh
```

## CI/CD Setup

### 1. Konfigurasi GitHub Secrets (untuk deployment otomatis)

Dalam pengaturan GitHub repository, tambahkan GitHub Secrets berikut:

- `HOST`: IP address server
- `USERNAME`: Username SSH (biasanya 'root')
- `SSH_KEY`: Private SSH key untuk akses server
- `PORT`: SSH port (biasanya 22)
- `DOMAIN`: Domain name (sagawagroup.id)
- `EMAIL`: Email admin (admin@sagawagroup.id)
- `JWT_SECRET`: Secret key untuk JWT
- `ASTRA_DB_APPLICATION_TOKEN`: Token database
- `ASTRA_DB_API_ENDPOINT`: Endpoint database

### 2. SSH Key Setup

```bash
# Di server, buat SSH key untuk GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# Tambahkan public key ke authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Set permission yang benar
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/github_actions.pub
```

### 3. Workflow Configuration

File workflow otomatis akan ditrigger saat push ke branch `main` dan akan:

1. Jalankan testing dan build
2. Deploy ke server via SSH
3. Jalankan health check

## Monitoring dan Health Check

### 1. Jalankan Health Check Manual

```bash
chmod +x health-check.sh
./health-check.sh
```

Skrip ini akan memeriksa:
- Status PM2 processes
- API health endpoint
- Status Nginx
- Aksesibilitas website
- Validitas SSL certificate
- Penggunaan disk space
- Penggunaan memory

### 2. Monitoring Layanan

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Log API
pm2 logs sagawagroup-api

# Log Nginx
sudo tail -f /var/log/nginx/sagawagroup_access.log
sudo tail -f /var/log/nginx/sagawagroup_error.log
```

### 3. Monitoring SSL Certificate

```bash
# Cek status sertifikat
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### 1. Nginx Configuration Error

```bash
# Test konfigurasi
sudo nginx -t

# Jika error, lihat konfigurasi
sudo nginx -T

# Reload jika tidak ada error
sudo systemctl reload nginx
```

### 2. API Tidak Berjalan

```bash
# Cek status PM2
pm2 status

# Lihat log API
pm2 logs sagawagroup-api

# Restart manual jika perlu
pm2 restart sagawagroup-api
```

### 3. SSL Certificate Issues

```bash
# Cek status SSL
sudo certbot certificates

# Manual SSL setup jika otomatis gagal
sudo certbot --nginx -d sagawagroup.id -d www.sagawagroup.id
```

### 4. Port Already in Use

```bash
# Cek proses di port 5000
sudo lsof -i :5000

# Hentikan jika perlu
sudo kill -9 PID
```

### 5. Build Frontend Gagal

```bash
# Masuk ke direktori frontend
cd /root/sagawagroup/vue-frontend

# Install dependensi dan build manual
bun install
bun run build
```

## Maintenance

### 1. Update Aplikasi

```bash
# 1. Backup deployment saat ini
./backup.sh

# 2. Update dari repository
git pull origin main

# 3. Build ulang
./production-build.sh

# 4. Deploy
sudo ./deploy-production.sh

# 5. Test deployment
curl -I https://www.sagawagroup.id
```

### 2. Update Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update node modules
cd /var/www/sagawagroup/api
bun update

# Restart layanan
pm2 restart sagawagroup-api
```

### 3. Backup dan Restore

```bash
# Jalankan backup
./backup.sh

# Restore dari backup
./restore.sh
```

### 4. Security Updates

```bash
# Update sistem secara rutin
sudo apt update && sudo apt upgrade

# Periksa vulnerability di dependencies
cd /var/www/sagawagroup/api
bun audit
```

## Penutup

Deployment aplikasi Sagawa Group telah siap sepenuhnya dengan:

- Nginx sebagai reverse proxy dengan SSL otomatis
- PM2 untuk manajemen proses
- SSL certificate dari Let's Encrypt dengan auto-renewal
- Monitoring dan health check
- Backup dan recovery system
- CI/CD pipeline untuk deployment otomatis
- Security configuration yang komprehensif

Ikuti dokumentasi ini secara hati-hati untuk memastikan deployment berjalan lancar dan aman.