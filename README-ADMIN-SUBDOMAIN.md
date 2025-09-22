# Admin Subdomain Deployment Guide

Panduan lengkap untuk deploy subdomain admin untuk Sagawa Group.

## Overview

Konfigurasi ini membuat subdomain `admin.sagawagroup.id` terpisah dari domain utama `sagawagroup.id`. Subdomain admin memiliki:

- **Enhanced Security**: Rate limiting lebih ketat, header keamanan tambahan
- **Dedicated SSL**: Sertifikat SSL terpisah untuk admin.sagawagroup.id
- **Admin-Specific Features**: Timeout lebih panjang untuk operasi admin, upload limit lebih besar
- **Access Control**: Opsi untuk pembatasan IP (opsional)

## Struktur File

```
/root/sagawagroup/
├── nginx-admin-simple.conf       # Konfigurasi simple untuk HTTP testing
├── nginx-admin-final.conf        # Konfigurasi final production dengan SSL
├── deploy-admin-subdomain.sh      # Script deployment otomatis
├── setup-admin-ssl.sh            # Script setup SSL untuk admin subdomain
├── verify-admin-subdomain.sh     # Script verifikasi setup
└── README-ADMIN-SUBDOMAIN.md     # Dokumentasi ini
```

## Status Deployment ✅

**Subdomain admin sudah berhasil di-deploy!**

- ✅ Nginx configuration deployed (HTTP-only)
- ✅ Admin directory created: `/var/www/sagawagroup/admin/`
- ✅ Frontend files copied to admin directory
- ✅ Rate limiting configured
- ✅ Security headers active
- ⚠️  SSL belum di-setup (perlu DNS propagation dulu)
- ⚠️  Backend API PM2 perlu dikonfigurasi

## Langkah-Langkah Deployment

### 1. Persiapan DNS

Sebelum menjalankan deployment, pastikan DNS records sudah dikonfigurasi:

```bash
# A Record atau CNAME Record
admin.sagawagroup.id    -> IP server Anda
www.admin.sagawagroup.id -> IP server Anda
```

**Contoh DNS Configuration:**
- **A Record**: `admin` → `YOUR_SERVER_IP`
- **CNAME Record**: `www.admin` → `admin.sagawagroup.id`

### 2. Deploy Subdomain Configuration

Jalankan script deployment:

```bash
sudo ./deploy-admin-subdomain.sh
```

Script ini akan:
- ✅ Backup konfigurasi nginx yang ada
- ✅ Deploy konfigurasi nginx admin subdomain
- ✅ Enable site di nginx
- ✅ Test konfigurasi nginx
- ✅ Build dan deploy frontend
- ✅ Restart backend API
- ✅ Set permissions yang benar

### 3. Setup SSL Certificate

Setelah DNS propagation selesai (biasanya 5-15 menit), setup SSL:

```bash
sudo ./setup-admin-ssl.sh
```

Script ini akan:
- ✅ Install certbot (jika belum ada)
- ✅ Generate SSL certificate untuk admin.sagawagroup.id
- ✅ Configure automatic renewal
- ✅ Update nginx configuration dengan SSL
- ✅ Test dan reload nginx

### 4. Verifikasi Deployment

Setelah deployment selesai, test akses:

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://admin.sagawagroup.id

# Test HTTPS
curl -I https://admin.sagawagroup.id

# Test API endpoint
curl https://admin.sagawagroup.id/api/health
```

## Struktur Directory

```
/var/www/sagawagroup/
├── frontend/          # Main website (sagawagroup.id)
└── admin/            # Admin interface (admin.sagawagroup.id)
    ├── index.html
    ├── assets/
    └── ...
```

## Konfigurasi Admin Interface

### Security Features

1. **Enhanced Rate Limiting**:
   - General: 10 requests/second
   - API: 20 requests/second  
   - Login: 3 attempts/minute

2. **Security Headers**:
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy` yang ketat
   - `X-Robots-Tag: noindex, nofollow`
   - `Strict-Transport-Security`

3. **Upload Limits**:
   - Max file size: 50MB (vs 10MB untuk main site)
   - Extended timeouts untuk operasi admin

### Optional: IP Access Control

Uncomment bagian ini di `nginx-admin-subdomain.conf` untuk restrict akses berdasarkan IP:

```nginx
location / {
    allow 192.168.1.0/24;  # Allow local network
    allow 10.0.0.0/8;      # Allow private network  
    allow YOUR_OFFICE_IP;  # Allow specific IP
    deny all;              # Deny all others
    try_files $uri $uri/ /index.html;
}
```

## Backend Configuration

Pastikan backend API Anda dapat menangani header `X-Admin-Interface`:

```javascript
// Example: Detect admin interface requests
app.use((req, res, next) => {
    if (req.headers['x-admin-interface'] === 'true') {
        // This request is from admin interface
        req.isAdminInterface = true;
    }
    next();
});
```

## Frontend Build untuk Admin

Jika Anda memiliki build process terpisah untuk admin interface:

```bash
# Build admin interface
cd /root/sagawagroup/vue-frontend
npm run build:admin  # atau sesuai dengan script build Anda

# Deploy ke directory admin
cp -r ./dist-admin/* /var/www/sagawagroup/admin/
```

## Monitoring dan Logs

### Log Files

```bash
# Admin access logs
tail -f /var/log/nginx/admin_sagawagroup_access.log

# Admin error logs  
tail -f /var/log/nginx/admin_sagawagroup_error.log

# Main site logs (untuk perbandingan)
tail -f /var/log/nginx/sagawagroup_access.log
```

### SSL Certificate Monitoring

```bash
# Check certificate expiry
openssl x509 -noout -dates -in /etc/letsencrypt/live/admin.sagawagroup.id/fullchain.pem

# Test SSL configuration
ssl-cert-check -c /etc/letsencrypt/live/admin.sagawagroup.id/fullchain.pem
```

## Troubleshooting

### Common Issues

1. **DNS not propagated**:
   ```bash
   # Check DNS propagation
   dig admin.sagawagroup.id
   nslookup admin.sagawagroup.id
   ```

2. **SSL Certificate issues**:
   ```bash
   # Manual certificate generation
   certbot certonly --nginx -d admin.sagawagroup.id -d www.admin.sagawagroup.id
   ```

3. **Nginx configuration test**:
   ```bash
   # Test configuration
   nginx -t
   
   # Check specific site
   nginx -T | grep -A 20 "admin.sagawagroup.id"
   ```

4. **Port issues**:
   ```bash
   # Check if ports are open
   netstat -tulnp | grep :80
   netstat -tulnp | grep :443
   ```

### Recovery Steps

Jika terjadi masalah, restore backup:

```bash
# Restore nginx config
sudo cp /root/sagawagroup/backups/TIMESTAMP/nginx-admin-sagawagroup.conf.backup /etc/nginx/sites-available/admin-sagawagroup

# Restart nginx
sudo systemctl restart nginx
```

## Security Checklist

- [ ] DNS records configured
- [ ] SSL certificate active dan valid
- [ ] Rate limiting configured
- [ ] Security headers active
- [ ] Access logs working
- [ ] Backup system configured
- [ ] IP access control (optional) configured
- [ ] Admin authentication working
- [ ] File upload limits appropriate

## Maintenance

### Regular Tasks

1. **SSL Certificate Renewal** (otomatis via cron):
   ```bash
   # Check auto-renewal
   certbot renew --dry-run
   ```

2. **Log Rotation**:
   ```bash
   # Configure logrotate for admin logs
   sudo nano /etc/logrotate.d/nginx-admin
   ```

3. **Security Updates**:
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Update nginx
   sudo apt update nginx
   ```

## Performance Tuning

Untuk high-traffic admin interface:

```nginx
# In nginx-admin-subdomain.conf
worker_connections 1024;
keepalive_timeout 65;
client_body_buffer_size 128k;
client_header_buffer_size 3m;
large_client_header_buffers 4 256k;
```

## Support

Untuk bantuan lebih lanjut:
1. Check logs: `/var/log/nginx/admin_sagawagroup_*.log`
2. Test configuration: `nginx -t`
3. Check DNS: `dig admin.sagawagroup.id`
4. Test SSL: `openssl s_client -connect admin.sagawagroup.id:443`

---

**Created**: September 22, 2025  
**Last Updated**: September 22, 2025  
**Version**: 1.0.0