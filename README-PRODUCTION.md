# Sagawa Group - Production Deployment Guide

Panduan lengkap untuk deployment production dengan Nginx dan SSL/TLS untuk domain **www.sagawagroup.id**.

## 📁 File Deployment

### Scripts Utama
- **`deploy-production.sh`** - Script deployment production lengkap
- **`setup-ssl.sh`** - Script khusus setup SSL/TLS
- **`production-build.sh`** - Script build untuk production
- **`backup.sh`** - Script backup proyek
- **`restore.sh`** - Script restore dari backup

### Konfigurasi
- **`nginx-sagawagroup.conf`** - Konfigurasi Nginx production-ready
- **`ecosystem.config.js`** - Konfigurasi PM2 untuk process management
- **`.env`** - Environment variables (perlu disesuaikan untuk production)

## 🚀 Quick Start

### 1. Deployment Lengkap (Recommended)
```bash
# Deployment otomatis dengan SSL
sudo ./deploy-production.sh

# atau deployment tanpa SSL (setup SSL terpisah)
sudo ./deploy-production.sh --skip-ssl
```

### 2. Deployment Bertahap

#### Step 1: Build untuk Production
```bash
./production-build.sh
```

#### Step 2: Setup SSL (Opsional - bisa dijalankan terpisah)
```bash
sudo ./setup-ssl.sh
```

#### Step 3: Deploy ke Production
```bash
sudo ./deploy-production.sh
```

## 🔧 Konfigurasi Detail

### Domain & SSL
- **Domain Utama**: `sagawagroup.id`
- **Domain WWW**: `www.sagawagroup.id`
- **SSL Provider**: Let's Encrypt (gratis, otomatis renewal)
- **Email SSL**: `admin@sagawagroup.id`

### Server Configuration
- **API Port**: `8765` (internal, tidak diekspos)
- **Web Server**: Nginx (port 80, 443)
- **Process Manager**: PM2
- **Deployment Path**: `/var/www/sagawagroup/`

### Nginx Features
- ✅ HTTP/2 support
- ✅ SSL/TLS 1.2 & 1.3
- ✅ GZIP compression
- ✅ Security headers
- ✅ Rate limiting
- ✅ CORS handling
- ✅ Static file caching
- ✅ SPA routing support

## 📂 Struktur Deployment

```
/var/www/sagawagroup/
├── frontend/          # Built frontend files
│   ├── index.html
│   ├── assets/
│   └── ...
├── api/              # API application
│   ├── index.ts
│   ├── src/
│   ├── node_modules/
│   └── .env
├── uploads/          # User uploads
├── logs/            # Application logs
│   ├── api-error.log
│   ├── api-out.log
│   └── api-combined.log
└── ecosystem.config.js  # PM2 configuration
```

## 🔐 SSL/TLS Configuration

### Automatic Setup
Script akan otomatis:
1. Install Certbot
2. Generate certificate untuk kedua domain
3. Configure Nginx dengan SSL
4. Setup auto-renewal (cron + systemd timer)

### Manual SSL Commands
```bash
# Generate certificate
sudo certbot --nginx -d sagawagroup.id -d www.sagawagroup.id

# Test renewal
sudo certbot renew --dry-run

# Check certificates
sudo certbot certificates
```

### SSL Features
- **Protocols**: TLS 1.2, TLS 1.3
- **HSTS**: Enabled with preload
- **OCSP Stapling**: Enabled  
- **Perfect Forward Secrecy**: Yes
- **Auto Renewal**: Daily check at 12:00

## ⚙️ Environment Variables

### Production Environment (`.env`)
```bash
# Production Environment
NODE_ENV=production
PORT=8765
BASE_URL=https://www.sagawagroup.id

# Database Configuration
ASTRA_DB_APPLICATION_TOKEN=your_production_token
ASTRA_DB_API_ENDPOINT=your_production_endpoint

# Security Configuration  
JWT_SECRET=your_strong_jwt_secret_for_production

# Email Configuration
EMAIL_USER=admin@sagawagroup.id
EMAIL_PASS=your_secure_email_password
```

**⚠️ PENTING**: Update semua nilai production sebelum deployment!

## 🎯 Commands Reference

### Build & Deploy
```bash
# Full production deployment
sudo ./deploy-production.sh

# Build only
./production-build.sh

# Deploy with custom domain
sudo ./deploy-production.sh --domain yourdomain.com

# Deploy without SSL
sudo ./deploy-production.sh --skip-ssl
```

### SSL Management
```bash
# Setup SSL
sudo ./setup-ssl.sh

# Setup SSL for custom domain
sudo ./setup-ssl.sh -d yourdomain.com -e your@email.com

# Test SSL setup (staging certificates)
sudo ./setup-ssl.sh --test-cert
```

### Process Management
```bash
# PM2 commands
pm2 status                    # Check status
pm2 logs sagawagroup-api     # View logs
pm2 restart sagawagroup-api  # Restart API
pm2 reload sagawagroup-api   # Zero-downtime restart
pm2 stop sagawagroup-api     # Stop API
pm2 delete sagawagroup-api   # Remove from PM2

# System services
sudo systemctl status nginx   # Check Nginx
sudo systemctl reload nginx   # Reload Nginx config
sudo systemctl restart nginx  # Restart Nginx
```

### Monitoring
```bash
# Application logs
pm2 logs sagawagroup-api

# Nginx logs
sudo tail -f /var/log/nginx/sagawagroup_access.log
sudo tail -f /var/log/nginx/sagawagroup_error.log

# SSL certificate status
sudo certbot certificates

# System resources
htop
df -h
free -h
```

## 🔍 Troubleshooting

### Common Issues

#### 1. SSL Certificate Failed
```bash
# Check domain DNS
nslookup sagawagroup.id
nslookup www.sagawagroup.id

# Manual certificate generation
sudo certbot certonly --webroot -w /var/www/certbot -d sagawagroup.id -d www.sagawagroup.id
```

#### 2. API Not Starting
```bash
# Check PM2 logs
pm2 logs sagawagroup-api

# Check environment file
cat /var/www/sagawagroup/api/.env

# Manual start for debugging
cd /var/www/sagawagroup/api && bun run index.ts
```

#### 3. Nginx Configuration Error
```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T

# Reload if OK
sudo systemctl reload nginx
```

#### 4. Port Already in Use
```bash
# Check what's using port 8765
sudo lsof -i :8765

# Kill process if needed
sudo kill -9 PID
```

### Performance Optimization

#### 1. Enable HTTP/2
```bash
# Already enabled in nginx config
# Verify with:
curl -I https://www.sagawagroup.id
```

#### 2. Enable Brotli (Optional)
```bash
# Install nginx brotli module
sudo apt install nginx-module-brotli

# Uncomment brotli lines in nginx config
```

#### 3. Database Optimization
- Use connection pooling
- Enable query caching
- Monitor slow queries

## 🔄 Update & Maintenance

### Regular Updates
```bash
# 1. Backup current deployment
./backup.sh

# 2. Update code
git pull origin main

# 3. Build new version
./production-build.sh

# 4. Deploy
sudo ./deploy-production.sh

# 5. Test deployment
curl -I https://www.sagawagroup.id
```

### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js/Bun dependencies
cd /var/www/sagawagroup/api && bun update

# Restart services
pm2 restart sagawagroup-api
```

### SSL Renewal (Automatic)
```bash
# Check auto-renewal status
sudo systemctl status certbot-renewal.timer

# Manual renewal test
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

## 📊 Monitoring & Analytics

### Health Checks
- **Application**: `https://www.sagawagroup.id/health`
- **API**: `https://www.sagawagroup.id/api/health`
- **SSL**: Use SSL Labs test

### Log Locations
```bash
# Application logs
/var/www/sagawagroup/logs/

# Nginx logs  
/var/log/nginx/sagawagroup_*.log

# System logs
/var/log/syslog
journalctl -u nginx
journalctl -u certbot-renewal
```

## 🛡️ Security Features

### Nginx Security
- Rate limiting (API: 10 req/s, Auth: 5 req/m)
- Security headers (HSTS, CSP, etc.)
- XSS protection
- CSRF protection
- Hide server version

### SSL Security
- TLS 1.2+ only
- Strong cipher suites
- HSTS with preload
- OCSP stapling
- Perfect forward secrecy

### Application Security
- Environment variables protection
- Input validation
- JWT token security
- CORS configuration
- File upload restrictions

## 📈 Performance Metrics

### Expected Performance
- **First Load**: < 2 seconds
- **API Response**: < 200ms
- **SSL Handshake**: < 100ms
- **Compression**: 70-80% size reduction

### Testing Tools
```bash
# Load testing
curl -I https://www.sagawagroup.id

# SSL testing
openssl s_client -connect www.sagawagroup.id:443

# Performance testing
# Use tools like GTmetrix, PageSpeed Insights
```

---

## 🆘 Support

Jika mengalami masalah:
1. Check logs terlebih dahulu
2. Verify DNS dan domain configuration
3. Test SSL certificate
4. Check PM2 process status
5. Verify Nginx configuration

**Quick Diagnostics:**
```bash
# Run all checks
./deploy-production.sh --help
pm2 status
sudo nginx -t
sudo certbot certificates
```

---
**Dibuat untuk Sagawa Group Production Deployment**  
**Domain**: www.sagawagroup.id  
**Last Updated**: $(date)