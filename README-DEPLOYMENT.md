# 🚀 Production Deployment Guide - Sagawa Group

**Sagawa Group** - Premium Japanese Culinary Franchise Network  
Website: **sagawagroup.id**

Panduan lengkap untuk deploy website Sagawa Group ke production tanpa Docker dengan keamanan SSL/TLS tingkat enterprise.

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

## ⚡ Quick Start - Production tanpa Docker

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

### 2. Run Production Deployment (No Docker)

```bash
# Jalankan deployment production tanpa Docker
sudo ./scripts/deploy-production.sh
```

### 3. Setup SSL Certificate

```bash
# Setup SSL dengan Let's Encrypt untuk sagawagroup.id
sudo ./scripts/ssl-setup.sh sagawagroup.id admin@sagawagroup.id
```

### 4. Start All Services

```bash
# Start semua layanan production
sudo ./scripts/start-services.sh
```

## 🔧 Manual Deployment Steps

Jika ingin deploy manual step by step:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group
```

### 2. Build and Start Services

```bash
# Build containers
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Setup Security (Opsional)

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

### Container Security
- ✅ Non-root users
- ✅ Container isolation
- ✅ Resource limits
- ✅ Security scanning

### System Security
- ✅ UFW firewall
- ✅ Fail2Ban protection
- ✅ Auto security updates
- ✅ Log monitoring

## 🛠️ Management Commands

### Container Management
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Management
```bash
# Renew certificates
./scripts/ssl-renew.sh

# Check certificate status
openssl x509 -in ssl/certbot/conf/live/sagawagroup.id/cert.pem -text -noout
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
docker stats
```

## 📊 Service Architecture

```
Internet → Nginx (Port 443/80) → Frontend (Port 3000)
                                ↓
                                → Backend (Port 4000) → Database
```

### Services:
- **Frontend**: Astro/Vue.js served by Nginx
- **Backend**: Bun API server
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
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your@email.com --agree-tos -d sagawagroup.id
```

### Container Issues
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs [service_name]

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check Docker stats
docker stats

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
- Check container updates

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
2. **Documentation**: Baca dokumentasi Docker dan Nginx
3. **Community**: Stack Overflow atau Docker forums
4. **Security**: Pastikan selalu update security patches

## 🎉 Success!

Setelah deployment berhasil, website akan dapat diakses di:
- **HTTP**: http://sagawagroup.id (redirect to HTTPS)
- **HTTPS**: https://sagawagroup.id
- **API**: https://sagawagroup.id/api

**Selamat! Website sagawagroup.id sudah live di production dengan keamanan tingkat enterprise!** 🚀✨