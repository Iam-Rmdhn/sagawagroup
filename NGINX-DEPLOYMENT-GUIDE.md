# 📘 Panduan Deploy Nginx untuk SPA (Single Page Application)

## 🎯 Fitur Konfigurasi

✅ **Cache Strategy Optimal:**
- HTML: **No Cache** (selalu fresh, no hard refresh needed)
- CSS/JS: **30 hari** cache
- Images: **30 hari** cache  
- Fonts: **1 tahun** cache
- Service Worker: **No Cache**

✅ **SPA Routing:** Semua route diarahkan ke `index.html`  
✅ **Gzip Compression:** Kompresi otomatis untuk file transfer cepat  
✅ **Security Headers:** Proteksi XSS, Clickjacking, MIME sniffing  
✅ **SSL/HTTPS:** Force HTTPS dengan HSTS  

---

## 🚀 Cara Install & Deploy

### 1. Copy File Konfigurasi

```bash
# Copy template ke sites-available
sudo cp nginx-spa-template.conf /etc/nginx/sites-available/myproject

# Atau langsung edit
sudo nano /etc/nginx/sites-available/myproject
```

### 2. Edit Konfigurasi Sesuai Project Anda

Buka file dan ubah bagian berikut:

```nginx
# Ganti domain Anda
server_name yourdomain.com www.yourdomain.com;

# Ganti path SSL certificate
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Ganti path ke folder build/dist project
root /var/www/myproject/dist;

# Ganti path log files
access_log /var/log/nginx/myproject_access.log;
error_log /var/log/nginx/myproject_error.log warn;
```

**Contoh untuk project Vue/React/Angular:**
- Vue (Vite): `root /var/www/myproject/dist;`
- React (CRA): `root /var/www/myproject/build;`
- Angular: `root /var/www/myproject/dist/project-name;`
- Astro: `root /var/www/myproject/dist;`

### 3. Test Konfigurasi Nginx

```bash
# Test syntax nginx config
sudo nginx -t

# Output yang benar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Enable Site (Symlink ke sites-enabled)

```bash
# Buat symlink
sudo ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled/

# Verify symlink
ls -la /etc/nginx/sites-enabled/
```

### 5. Restart Nginx

```bash
# Reload nginx (zero downtime)
sudo systemctl reload nginx

# Atau restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## 📁 Setup SSL Certificate (Let's Encrypt)

Jika belum punya SSL certificate, install dulu dengan Certbot:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot akan otomatis:
1. Generate SSL certificate
2. Update nginx config
3. Setup auto-renewal via cron

---

## 🧪 Testing Cache Strategy

### Test HTML No-Cache

```bash
curl -I https://yourdomain.com/index.html

# Expected Headers:
# Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
# Pragma: no-cache
```

### Test CSS/JS Cache (30 hari)

```bash
curl -I https://yourdomain.com/assets/app.js

# Expected Headers:
# Cache-Control: public, max-age=2592000, immutable
# Expires: (30 hari dari sekarang)
```

### Test Images Cache (30 hari)

```bash
curl -I https://yourdomain.com/images/logo.png

# Expected Headers:
# Cache-Control: public, max-age=2592000
```

### Test Fonts Cache (1 tahun)

```bash
curl -I https://yourdomain.com/fonts/roboto.woff2

# Expected Headers:
# Cache-Control: public, max-age=31536000, immutable
# Access-Control-Allow-Origin: *
```

---

## 🔍 Troubleshooting

### Error: "nginx: [emerg] could not build server_names_hash"

```bash
# Edit nginx.conf
sudo nano /etc/nginx/nginx.conf

# Tambahkan di http block:
http {
    server_names_hash_bucket_size 64;
    ...
}
```

### Error: Permission denied untuk log files

```bash
# Buat folder log jika belum ada
sudo mkdir -p /var/log/nginx

# Set permissions
sudo chown -R www-data:www-data /var/log/nginx
sudo chmod 755 /var/log/nginx
```

### Error: 403 Forbidden

```bash
# Check permission folder web
sudo chown -R www-data:www-data /var/www/myproject

# Check index.html exists
ls -la /var/www/myproject/dist/index.html

# Check nginx user
ps aux | grep nginx
```

### Error: 502 Bad Gateway (jika pakai API proxy)

```bash
# Check backend API running
sudo netstat -tulpn | grep 5000

# Check firewall
sudo ufw status

# Check nginx error log
sudo tail -f /var/log/nginx/myproject_error.log
```

---

## 📊 Monitoring & Logs

### View Access Logs (Real-time)

```bash
sudo tail -f /var/log/nginx/myproject_access.log
```

### View Error Logs (Real-time)

```bash
sudo tail -f /var/log/nginx/myproject_error.log
```

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Check Nginx Configuration

```bash
sudo nginx -T  # Show full configuration
```

---

## 🔄 Deploy Workflow (Update Website)

Setiap kali deploy versi baru:

```bash
# 1. Build project locally atau di CI/CD
npm run build

# 2. Upload ke server (via rsync, scp, atau git)
rsync -avz --delete dist/ user@server:/var/www/myproject/dist/

# 3. Clear cache jika perlu (optional)
# Karena HTML no-cache, user akan otomatis dapat versi terbaru

# 4. Reload nginx (optional, biasanya tidak perlu)
sudo systemctl reload nginx
```

**Catatan:** Dengan konfigurasi `no-cache` untuk HTML, user TIDAK perlu hard refresh (Ctrl+F5). Browser akan otomatis ambil `index.html` terbaru, yang kemudian load CSS/JS baru (dengan nama file ber-hash berbeda).

---

## 🎨 Optimasi Tambahan (Optional)

### Enable Brotli Compression (lebih baik dari Gzip)

```bash
# Install Brotli module
sudo apt install nginx-module-brotli -y

# Edit nginx.conf, tambahkan di http block:
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;

# Tambahkan di server block:
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
```

### Enable HTTP/2 Push (Preload resources)

```nginx
location = /index.html {
    http2_push /assets/app.js;
    http2_push /assets/app.css;
    http2_push /fonts/roboto.woff2;
}
```

### Add Rate Limiting

```nginx
# Di top level nginx.conf (http block)
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

# Di location block
location / {
    limit_req zone=general burst=20 nodelay;
    try_files $uri $uri/ /index.html;
}
```

---

## 📚 Penjelasan Cache Headers

| Header | Fungsi |
|--------|--------|
| `Cache-Control: no-store` | Browser tidak boleh simpan cache sama sekali |
| `Cache-Control: no-cache` | Browser boleh simpan cache tapi harus revalidate tiap kali |
| `Cache-Control: public` | Cache bisa disimpan di browser dan CDN |
| `Cache-Control: private` | Cache hanya di browser, tidak di CDN |
| `Cache-Control: max-age=2592000` | Cache valid untuk 30 hari (2592000 detik) |
| `Cache-Control: immutable` | File tidak akan berubah, browser tidak perlu revalidate |
| `Expires: -1` | Set expired di masa lalu (force fresh) |
| `Pragma: no-cache` | Legacy header untuk HTTP/1.0 |
| `Vary: Accept-Encoding` | Cache terpisah untuk gzip vs non-gzip |

---

## ✅ Checklist Deployment

- [ ] Edit domain di config (`server_name`)
- [ ] Edit path SSL certificate
- [ ] Edit path root folder project
- [ ] Edit path log files
- [ ] Test nginx config (`sudo nginx -t`)
- [ ] Create symlink ke sites-enabled
- [ ] Reload nginx
- [ ] Test SSL certificate (https://www.ssllabs.com/ssltest/)
- [ ] Test cache headers (`curl -I`)
- [ ] Test SPA routing (buka route langsung di browser)
- [ ] Check access & error logs

---

## 🆘 Support

Jika ada masalah:
1. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
2. Check nginx config: `sudo nginx -t`
3. Check nginx status: `sudo systemctl status nginx`
4. Check file permissions: `ls -la /var/www/myproject/dist/`

---

**Happy Deploying! 🚀**
