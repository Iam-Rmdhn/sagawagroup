# Admin Subdomain Setup Guide

## Overview
Setup untuk membuat subdomain admin (`admin.sagawagroup.id` dan `www.admin.sagawagroup.id`) yang akan langsung redirect ke halaman login admin.

## Fitur
- **Dedicated Admin URL**: `https://admin.sagawagroup.id` dan `https://www.admin.sagawagroup.id`
- **Auto Redirect**: Akses root subdomain langsung diarahkan ke `/admin/login`
- **Enhanced Security**: Rate limiting khusus dan security headers untuk admin
- **SSL Support**: SSL certificate terpisah untuk subdomain admin
- **API Integration**: Backend API dapat mendeteksi admin subdomain

## Prerequisites
1. Domain utama `sagawagroup.id` sudah ter-setup dengan SSL
2. Nginx sudah terinstall dan terkonfigurasi
3. Certbot untuk SSL management
4. Backend API berjalan di port 5000
5. Frontend sudah di-build dan ready untuk deploy

## Setup Steps

### 1. DNS Configuration
Tambahkan record DNS untuk subdomain admin:

**Option A: CNAME Record**
```
Type: CNAME
Name: admin
Value: sagawagroup.id
```

**Option B: A Record**
```
Type: A
Name: admin.sagawagroup.id
Value: [Your Server IP Address]
```

### 2. Deploy Configuration
Jalankan script deploy untuk menerapkan semua konfigurasi:

```bash
cd /root/sagawagroup
sudo ./deploy-admin-subdomain.sh
```

Script ini akan:
- Backup konfigurasi existing
- Deploy nginx config untuk admin subdomain
- Test dan reload nginx
- Build dan deploy frontend
- Restart backend API

### 3. Setup SSL Certificates
Setelah DNS propagation (biasanya 5-15 menit), setup SSL:

```bash
cd /root/sagawagroup
sudo ./setup-admin-ssl.sh
```

**Catatan**: Edit email address di script sebelum menjalankan:
```bash
# Edit setup-admin-ssl.sh
EMAIL="admin@sagawagroup.id"  # Replace with your email
```

### 4. Test Configuration
Setelah setup selesai, test akses:

1. **HTTP Test** (should redirect to HTTPS):
   ```
   http://admin.sagawagroup.id
   http://www.admin.sagawagroup.id
   ```

2. **HTTPS Test**:
   ```
   https://admin.sagawagroup.id        -> redirects to https://admin.sagawagroup.id/admin/login
   https://www.admin.sagawagroup.id    -> redirects to https://www.admin.sagawagroup.id/admin/login
   ```

3. **API Test**:
   ```bash
   curl -k https://admin.sagawagroup.id/api/health
   ```
   Should return: `{"status":"OK","service":"Sagawa Group API","subdomain":"admin","host":"admin.sagawagroup.id"}`

## File Structure

```
/root/sagawagroup/
├── nginx-admin-subdomain.conf     # Admin subdomain nginx config
├── deploy-admin-subdomain.sh      # Deploy script
├── setup-admin-ssl.sh             # SSL setup script
├── bun-api/
│   └── index.ts                   # Updated with subdomain detection
└── vue-frontend/
    └── src/pages/admin/login.astro # Updated with subdomain support
```

## Security Features

### Rate Limiting
- **Admin Login**: 3 requests per minute
- **Admin General**: 20 requests per minute
- **Admin API**: 20 burst requests with nodelay

### Security Headers
- `X-Frame-Options: DENY`
- `X-Robots-Tag: noindex, nofollow` (prevent search indexing)
- Enhanced CSP with `frame-ancestors 'none'`
- HSTS with preload

### Access Control
- Root path `/` langsung redirect ke `/admin/login`
- Non-admin pages di subdomain admin akan redirect ke domain utama
- Hidden dari search engines

## Configuration Details

### Nginx Configuration
- **Rate limiting zones**: Dedicated untuk admin subdomain
- **SSL**: Menggunakan certificate terpisah atau shared
- **Logging**: Log file terpisah dengan prefix admin
- **Proxying**: API calls diteruskan ke backend yang sama
- **Static files**: Served dengan caching optimal

### Backend API Changes
- **Host detection**: API dapat detect admin subdomain
- **CORS handling**: Dynamic origin untuk subdomain
- **Health check**: Menampilkan info subdomain

### Frontend Changes
- **API URL detection**: Otomatis menggunakan subdomain URL
- **Title update**: Page title mencakup "Sagawa Group"
- **Subdomain awareness**: Login page aware of subdomain context

## Troubleshooting

### Common Issues

1. **DNS Not Propagated**
   ```bash
   # Check DNS propagation
   nslookup admin.sagawagroup.id
   dig admin.sagawagroup.id
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate
   sudo certbot certificates | grep admin.sagawagroup.id
   
   # Renew if needed
   sudo certbot renew --dry-run
   ```

3. **Nginx Configuration Test**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Backend API Not Responding**
   ```bash
   # Check if API is running
   curl http://localhost:5000/api/health
   
   # Check PM2 status
   pm2 status
   pm2 logs sagawa-api
   ```

5. **Frontend Not Updated**
   ```bash
   cd /root/sagawagroup/vue-frontend
   bun run build
   sudo cp -r dist/* /var/www/sagawagroup/frontend/
   ```

### Log Files
- **Admin Access**: `/var/log/nginx/admin_sagawagroup_access.log`
- **Admin Error**: `/var/log/nginx/admin_sagawagroup_error.log`
- **Main Access**: `/var/log/nginx/sagawagroup_access.log`
- **Main Error**: `/var/log/nginx/sagawagroup_error.log`

### Verification Commands
```bash
# Test subdomain response
curl -I https://admin.sagawagroup.id

# Test redirect behavior
curl -I https://admin.sagawagroup.id/

# Test API endpoint
curl -k https://admin.sagawagroup.id/api/health

# Test SSL certificate
echo | openssl s_client -connect admin.sagawagroup.id:443 -servername admin.sagawagroup.id 2>/dev/null | openssl x509 -noout -dates
```

## Maintenance

### SSL Certificate Renewal
SSL certificates akan otomatis diperbaharui via cron job certbot. Untuk manual renewal:

```bash
sudo certbot renew --nginx
sudo systemctl reload nginx
```

### Update Configuration
Untuk update konfigurasi admin subdomain:

1. Edit `nginx-admin-subdomain.conf`
2. Run `sudo ./deploy-admin-subdomain.sh`
3. Test dengan `sudo nginx -t`
4. Reload dengan `sudo systemctl reload nginx`

### Backup Configuration
Script deploy otomatis membuat backup di:
```
/root/sagawagroup/backups/YYYYMMDD_HHMMSS/
```

Untuk manual backup:
```bash
mkdir -p /root/sagawagroup/backups/manual_$(date +%Y%m%d_%H%M%S)
cp /etc/nginx/sites-available/*sagawagroup* /root/sagawagroup/backups/manual_$(date +%Y%m%d_%H%M%S)/
```

## Support URLs

Setelah setup selesai, URL yang tersedia:

### Main Domain
- `https://sagawagroup.id` - Website utama
- `https://www.sagawagroup.id` - Website utama (www)

### Admin Subdomain
- `https://admin.sagawagroup.id` - Admin login (redirect dari root)
- `https://www.admin.sagawagroup.id` - Admin login (redirect dari root)
- `https://admin.sagawagroup.id/admin/login` - Direct admin login
- `https://admin.sagawagroup.id/admin/dashboard` - Admin dashboard
- `https://admin.sagawagroup.id/api/health` - API health check

---

**Note**: Pastikan DNS sudah di-propagasi sebelum menjalankan setup SSL. Proses propagasi DNS biasanya membutuhkan waktu 5-60 menit tergantung provider DNS.