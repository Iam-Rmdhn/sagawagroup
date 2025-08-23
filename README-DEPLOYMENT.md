# 🚀 Production Deployment Guide - Sagawa Group

**Sagawa Group** - Premium Japanese Culinary Franchise Network  
Website: **sagawagroup.id**

Panduan lengkap untuk deploy website Sagawa Group ke production dengan keamanan SSL/TLS tingkat enterprise.

## 🍜 Tentang Sagawa Group

**Sagawa Group** adalah jaringan franchise kuliner Jepang terkemuka yang menghadirkan cita rasa autentik Jepang ke Indonesia. Kami memiliki beberapa brand unggulan:

### 🏪 Brand Portfolio:
- **☕ Kagawa Coffee Corner (KCC)** - Premium Japanese Coffee Experience
- **🍚 Kagawa Ricebowl (KRB)** - Authentic Japanese Rice Bowls  
- **🍜 RM Nusantara** - Fusion Japanese-Indonesian Cuisine

### 💼 Investment Opportunities:
- **Kagawa Coffee Corner**: Mulai dari Rp 50 Juta
- **Kagawa Ricebowl**: Mulai dari Rp 75 Juta  
- **RM Nusantara**: Mulai dari Rp 40 Juta

Bergabunglah dengan jaringan franchise kuliner Jepang terpercaya dan raih kesuksesan bersama **Sagawa Group**!

## 📋 Prerequisites

- VPS/Server dengan Ubuntu 20.04+ atau Debian 11+
- Domain sagawagroup.id sudah pointing ke IP server
- Minimal 2GB RAM, 20GB storage
- Port 80 dan 443 terbuka
- Akses root/sudo

## ⚡ Quick Start - Production Deployment

### 1. Setup Environment Variables

```bash
# Copy dan edit file environment
cp .env.example .env
nano .env

# Isi dengan data spesifik Sagawa Group:
DATABASE_URL=https://your-astra-db-url
JWT_SECRET=sagawagroup-super-secure-jwt-secret-key-2024-minimum-32-chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=info@sagawagroup.id
EMAIL_PASS=your-app-password
CERTBOT_EMAIL=admin@sagawagroup.id
DOMAIN=sagawagroup.id
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Setup SSL Certificate

```bash
# Setup SSL dengan Let's Encrypt untuk sagawagroup.id
sudo certbot --nginx -d sagawagroup.id -m admin@sagawagroup.id --agree-tos --non-interactive
```

### 4. Start All Services

```bash
# Start semua layanan production
sudo ./scripts/start-services.sh
```

## 🔧 Manual Deployment Steps

Jika ingin deploy manual step by step:

### 1. Build Frontend

```bash
# Navigate to frontend directory
cd vue-frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd ../bun-api

# Install dependencies
bun install

# Start backend service
pm2 start bun --name "sagawa-api" -- run start
```

### 3. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/sagawagroup.id
sudo ln -s /etc/nginx/sites-available/sagawagroup.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup Security (Opsional)

```bash
# Jalankan security hardening
sudo ./scripts/security-setup.sh
```

## 🔒 Security Features

### SSL/TLS Encryption
- ✅ Let's Encrypt certificates
- ✅ Auto-renewal setup
- ✅ HTTP to HTTPS redirect
- ✅ Strong cipher suites
- ✅ HSTS headers

### Security Headers
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Content-Security-Policy
- ✅ Strict-Transport-Security

### Rate Limiting
- ✅ API rate limiting (10 req/s)
- ✅ Auth endpoints (1 req/s)
- ✅ DDoS protection

### Application Security
- ✅ Non-root users
- ✅ Process isolation
- ✅ Resource limits
- ✅ Security scanning

### System Security
- ✅ UFW firewall
- ✅ Fail2Ban protection
- ✅ Auto security updates
- ✅ Log monitoring

## 🛠️ Management Commands

### Service Management
```bash
# Start services
sudo systemctl start nginx
pm2 start sagawa-api

# Stop services
sudo systemctl stop nginx
pm2 stop sagawa-api

# Restart services
sudo systemctl restart nginx
pm2 restart sagawa-api

# View logs
sudo tail -f /var/log/nginx/access.log
pm2 logs sagawa-api

# Monitor services
pm2 status
sudo systemctl status nginx
```

### SSL Management
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Backup & Restore
```bash
# Create backup
./scripts/backup.sh

# Restore from backup
# Follow instructions in backup-info.txt file
```

### Monitoring
```bash
# Check security logs
tail -f /var/log/sagawagroup/security-check.log

# Check Fail2Ban status
sudo fail2ban-client status

# Check firewall status
sudo ufw status

# Check system resources
htop
pm2 monit
```

## 📊 Service Architecture

```
Internet → Nginx (Port 443/80) → Frontend (Port 3000)
                                ↓
                                → Backend (Port 4000) → Database
```

### Services:
- **Frontend**: Vue.js served by Nginx
- **Backend**: Bun API server with PM2
- **Nginx**: Reverse proxy with SSL termination
- **Certbot**: SSL certificate management

## 🚨 Troubleshooting

### SSL Issues
```bash
# Check domain DNS
nslookup sagawagroup.id

# Test HTTP challenge
curl -I http://sagawagroup.id/.well-known/acme-challenge/test

# Manually request certificate
sudo certbot certonly --nginx -d sagawagroup.id -m admin@sagawagroup.id --agree-tos --non-interactive
```

### Service Issues
```bash
# Check service logs
pm2 logs sagawa-api
sudo journalctl -u nginx

# Restart services
pm2 restart sagawa-api
sudo systemctl restart nginx

# Check service status
pm2 status
sudo systemctl status nginx
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check process stats
pm2 monit

# Check nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📝 Maintenance

### Daily Tasks
- Monitor security logs
- Check SSL certificate expiry
- Monitor system resources
- Review access logs

### Weekly Tasks
- Update system packages
- Backup application data
- Review security alerts
- Check application updates

### Monthly Tasks
- Security audit
- Performance optimization
- Database maintenance
- Certificate renewal check

## 🔄 Auto-Renewal & Monitoring

### Cron Jobs Configured:
```bash
# SSL certificate renewal (daily at 12:00)
0 12 * * * /var/www/sagawagroup/scripts/ssl-renew.sh

# Security checks (daily at 02:00)
0 2 * * * /usr/local/bin/security-check.sh

# Backup (weekly on Sunday at 03:00)
0 3 * * 0 /var/www/sagawagroup/scripts/backup.sh
```

## 📞 Support

Untuk bantuan deployment atau troubleshooting:

1. **Check Logs**: Selalu cek logs terlebih dahulu
2. **Documentation**: Baca dokumentasi Node.js, Bun, dan Nginx
3. **Community**: Stack Overflow atau relevant forums
4. **Security**: Pastikan selalu update security patches

## 🎉 Success!

Setelah deployment berhasil, website akan dapat diakses di:
- **HTTP**: http://sagawagroup.id (redirect to HTTPS)
- **HTTPS**: https://sagawagroup.id
- **API**: https://sagawagroup.id/api

**Selamat! Website sagawagroup.id sudah live di production dengan keamanan tingkat enterprise!** 🚀✨