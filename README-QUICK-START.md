# 🚀 Quick Start Deployment - Sagawa Group

**Deploy sagawagroup.id ke production tanpa Docker dalam 5 langkah mudah!**

---

## 🍜 Tentang Sagawa Group

**Sagawa Group** adalah jaringan franchise kuliner Jepang terpercaya di Indonesia dengan 3 brand unggulan:

- ☕ **Kagawa Coffee Corner** - Premium Japanese Coffee (Investasi: Rp 50 Juta)
- 🍚 **Kagawa Ricebowl** - Authentic Japanese Rice Bowls (Investasi: Rp 75 Juta)  
- 🍜 **RM Nusantara** - Fusion Japanese-Indonesian Cuisine (Investasi: Rp 40 Juta)

---

## ⚡ 5 Langkah Deployment

### 1️⃣ Setup Environment
```bash
# Edit konfigurasi environment
sudo nano .env

# Isi dengan data production:
DOMAIN=sagawagroup.id
DATABASE_URL=https://your-astra-db-url
JWT_SECRET=sagawagroup-super-secure-jwt-secret-key-2024
EMAIL_USER=info@sagawagroup.id
EMAIL_PASS=your-app-password
CERTBOT_EMAIL=admin@sagawagroup.id
```

### 2️⃣ Deploy Production
```bash
# Deploy aplikasi tanpa Docker
sudo ./scripts/deploy-production.sh
```

### 3️⃣ Setup SSL Certificate
```bash
# Install SSL Let's Encrypt untuk sagawagroup.id
sudo ./scripts/ssl-setup.sh sagawagroup.id admin@sagawagroup.id
```

### 4️⃣ Start Services
```bash
# Start semua layanan production
sudo ./scripts/start-services.sh
```

### 5️⃣ Monitor & Maintain
```bash
# Monitor sistem real-time
./scripts/monitor.sh

# Backup otomatis
sudo ./scripts/backup.sh
```

---

## ✅ Website Live

Setelah deployment berhasil, website Sagawa Group dapat diakses di:

🌐 **https://sagawagroup.id** - Website Utama  
🔧 **https://sagawagroup.id/api** - REST API  
👥 **https://sagawagroup.id/admin** - Admin Panel  
📱 **https://sagawagroup.id/register** - Pendaftaran Mitra  

---

## 🛠️ Commands Berguna

```bash
# Cek status layanan
pm2 status
systemctl status nginx
systemctl status fail2ban

# Lihat logs
pm2 logs sagawagroup-api
tail -f /var/log/nginx/sagawagroup_access.log

# Restart layanan  
pm2 restart sagawagroup-api
sudo systemctl restart nginx

# SSL renewal manual
sudo certbot renew

# Backup manual
sudo ./scripts/backup.sh
```

---

## 🔒 Fitur Keamanan

✅ **SSL/TLS Certificate** - Let's Encrypt Auto-Renewal  
✅ **Security Headers** - HSTS, CSP, X-Frame-Options  
✅ **Rate Limiting** - API & Auth Protection  
✅ **Fail2Ban** - Intrusion Prevention  
✅ **UFW Firewall** - Network Protection  
✅ **Non-root Execution** - Container Isolation  

---

## 📊 Performance & SEO

✅ **Optimized Meta Tags** - Schema.org Markup  
✅ **Open Graph** - Social Media Integration  
✅ **Fast Loading** - Nginx Gzip & Caching  
✅ **Mobile Responsive** - PWA Ready  
✅ **Search Optimized** - SEO Best Practices  

---

## 🆘 Troubleshooting

**SSL Issues:**
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d sagawagroup.id
sudo systemctl start nginx
```

**Backend Not Running:**
```bash
cd /var/www/sagawagroup
pm2 restart ecosystem.config.js
```

**Permission Issues:**
```bash
sudo chown -R www-data:www-data /var/www/sagawagroup
sudo chmod -R 755 /var/www/sagawagroup
```

---

## 📞 Support

**Email:** admin@sagawagroup.id  
**Website:** https://sagawagroup.id  
**Business:** info@sagawagroup.id  

---

## 🎉 Success!

**Selamat! Website Sagawa Group sudah live dengan:**

🔐 **SSL/TLS Security** - Enterprise Grade  
⚡ **High Performance** - Optimized Loading  
📱 **Mobile Ready** - Responsive Design  
🛡️ **Security Hardened** - Multi-layer Protection  
🔍 **SEO Optimized** - Search Engine Ready  

**🍜 Sagawa Group - Kuliner Jepang Terbaik di Indonesia! 🍜**