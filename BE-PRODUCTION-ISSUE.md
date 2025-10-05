# 🔧 Backend Production Issue - SOLVED

## Masalah
Backend API **HANYA berjalan** dengan `bun dev` tapi **TIDAK berjalan** di production dengan PM2.

## Root Cause
```bash
PM2 Error: Module not found "/home/ilham/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/lib/ProcessContainerForkBun.js"
```

**Penyebab:**  
PM2 versi lama **TIDAK native support Bun runtime** sebagai interpreter!

### Mengapa `bun dev` jalan tapi PM2 tidak?
- ✅ **`bun dev`** - Anda jalankan manual dengan Bun CLI directly
- ❌ **PM2 dengan `interpreter: "bun"`** - PM2 cari file yang tidak ada

---

## Solusi Implemented

### Option 1: PM2 dengan Direct Bun Command ✅ ACTIVE

**File: `ecosystem-bun.config.js`**

```javascript
{
  name: "sagawagroup-api",
  script: "/root/.bun/bin/bun",
  args: "run /var/www/sagawagroup/api/index.ts",
  cwd: "/var/www/sagawagroup/api",
  env_production: {
    NODE_ENV: "production",
    PORT: 5000,
    PATH: "/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  }
}
```

**Keuntungan:**
- PM2 tetap bisa dipakai untuk monitoring & auto-restart
- Tidak perlu wrapper script
- Direct bun execution

### Option 2: Systemd Service (Alternative) ✅ BACKUP

**File: `sagawagroup-api.service`**

```systemd
[Service]
Type=simple
User=root
WorkingDirectory=/var/www/sagawagroup/api
Environment="NODE_ENV=production"
Environment="PORT=5000"
Environment="PATH=/root/.bun/bin:..."
ExecStart=/root/.bun/bin/bun run index.ts
Restart=always
```

**Keuntungan:**
- Native Linux service
- Auto-start on boot
- Systemd monitoring & logging
- Lebih stabil untuk production

### Option 3: API Manager Script ✅ HELPER

**File: `api-manager.sh`**

Unified management script untuk start/stop/restart BE dengan PM2 atau systemd.

```bash
./api-manager.sh start    # Start API
./api-manager.sh stop     # Stop API
./api-manager.sh restart  # Restart API
./api-manager.sh status   # Check status
./api-manager.sh logs     # View logs
./api-manager.sh health   # Health check
```

---

## Cara Deploy Backend Production

### Method 1: Manual dengan PM2 (Quick Fix)

```bash
# 1. Stop old PM2 process
pm2 delete sagawagroup-api

# 2. Copy config baru
sudo cp ecosystem-bun.config.js /var/www/sagawagroup/

# 3. Start dengan config baru
cd /var/www/sagawagroup
pm2 start ecosystem-bun.config.js --env production

# 4. Save PM2 list
pm2 save

# 5. Setup PM2 startup (agar auto-start saat reboot)
pm2 startup
# Follow the instruction dari output command di atas

# 6. Check status
pm2 status
pm2 logs sagawagroup-api
```

### Method 2: Dengan API Manager Script

```bash
# 1. Copy scripts ke server
sudo cp api-manager.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/api-manager.sh

# 2. Start API
api-manager.sh start

# 3. Check health
api-manager.sh health
```

### Method 3: Dengan Systemd (Most Stable)

```bash
# 1. Install service
sudo cp sagawagroup-api.service /etc/systemd/system/
sudo systemctl daemon-reload

# 2. Enable auto-start
sudo systemctl enable sagawagroup-api

# 3. Start service
sudo systemctl start sagawagroup-api

# 4. Check status
sudo systemctl status sagawagroup-api

# 5. View logs
sudo journalctl -u sagawagroup-api -f
```

---

## Testing Backend

### 1. Check if Port 5000 is Listening
```bash
ss -tuln | grep 5000
# atau
netstat -tuln | grep 5000
```

### 2. Test API Health Endpoint
```bash
curl http://localhost:5000/api/health
```

### 3. Test dari External
```bash
curl https://www.sagawagroup.id/api/health
```

### 4. Check Logs

**PM2:**
```bash
pm2 logs sagawagroup-api --lines 100
```

**Systemd:**
```bash
journalctl -u sagawagroup-api -n 100 --no-pager
```

**Direct log files:**
```bash
tail -f /var/log/sagawagroup-api.log
tail -f /var/log/sagawagroup-api-error.log
```

---

## Troubleshooting

### Problem: PM2 masih error "Module not found"

**Solution:**
```bash
# Hapus PM2 process lama
pm2 delete all

# Start dengan config baru
pm2 start ecosystem-bun.config.js --env production
```

### Problem: Port 5000 sudah dipakai

**Solution:**
```bash
# Cek siapa yang pakai port 5000
sudo lsof -i :5000

# Kill process yang pakai port
sudo kill -9 <PID>

# Atau gunakan port lain
# Edit .env.production: PORT=5001
```

### Problem: Bun command not found

**Solution:**
```bash
# Install Bun for root user
sudo -i
curl -fsSL https://bun.sh/install | bash

# Add to PATH permanently
echo 'export PATH="/root/.bun/bin:$PATH"' >> /root/.bashrc
source /root/.bashrc

# Verify
bun --version
```

### Problem: Database connection failed

**Solution:**
```bash
# Check .env.production file
cat /var/www/sagawagroup/api/.env.production

# Verify credentials
# Make sure ASTRA_DB_APPLICATION_TOKEN dan ASTRA_DB_API_ENDPOINT benar
```

### Problem: Permission denied

**Solution:**
```bash
# Fix ownership
sudo chown -R root:root /var/www/sagawagroup/api

# Fix permissions
sudo chmod -R 755 /var/www/sagawagroup/api
sudo chmod 600 /var/www/sagawagroup/api/.env.production
```

---

## Update Deploy Script

Update `deploy-production.sh` untuk gunakan config baru:

```bash
# Deploy backend function
deploy_backend() {
    print_status "Deploying backend API..."
    
    # Copy files
    cp -r "$PROJECT_DIR/bun-api/"* "$DEPLOY_DIR/api/"
    
    # Install dependencies
    cd "$DEPLOY_DIR/api"
    bun install
    
    # Copy ecosystem config
    cp "$PROJECT_DIR/ecosystem-bun.config.js" "$DEPLOY_DIR/"
    
    # Restart with PM2
    pm2 delete sagawagroup-api 2>/dev/null || true
    pm2 start "$DEPLOY_DIR/ecosystem-bun.config.js" --env production
    pm2 save
    
    print_success "Backend deployed successfully"
}
```

---

## Recommended Setup (Production)

### Architecture
```
┌─────────────────┐
│   Nginx :443    │ (Reverse Proxy + Static Files)
└────────┬────────┘
         │
         ├─── Frontend (Static) → /var/www/sagawagroup/frontend/
         │
         └─── Backend API (/api/*) → localhost:5000
                    │
                    ▼
         ┌──────────────────────┐
         │   PM2 / Systemd      │
         │   Bun Runtime        │
         │   Port 5000          │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   AstraDB            │
         │   (Cloud Database)   │
         └──────────────────────┘
```

### Process Manager Comparison

| Feature | PM2 | Systemd |
|---------|-----|---------|
| Auto-restart | ✅ | ✅ |
| Monitoring UI | ✅ | ❌ |
| Logs | ✅ Good | ✅ Better |
| Clustering | ✅ | ❌ |
| Memory management | ✅ | ✅ |
| Native Linux | ❌ | ✅ |
| Stability | 🟡 Good | 🟢 Better |
| Learning curve | Easy | Medium |

**Recommendation:** Use **Systemd** for production, **PM2** for development monitoring.

---

## Current Status

✅ **Root cause identified** - PM2 tidak support Bun interpreter  
✅ **Solutions created** - 3 alternative methods  
✅ **Configs updated** - ecosystem-bun.config.js  
✅ **Scripts created** - api-manager.sh, start-production.sh  
✅ **Systemd service** - sagawagroup-api.service  
✅ **Documentation** - This file!  

⏳ **Next:** Deploy dengan salah satu method di atas

---

## Quick Start Commands

```bash
# Option 1: PM2 (Quick)
pm2 delete sagawagroup-api
pm2 start ecosystem-bun.config.js --env production
pm2 save

# Option 2: Systemd (Recommended)
sudo ./api-manager.sh install-systemd
sudo systemctl start sagawagroup-api

# Option 3: Manual (Development)
cd /var/www/sagawagroup/api
PORT=5000 NODE_ENV=production bun run index.ts
```

---

**Files Created/Modified:**
- ✅ `ecosystem-bun.config.js` - PM2 config tanpa interpreter issue
- ✅ `sagawagroup-api.service` - Systemd service file
- ✅ `api-manager.sh` - Unified management script
- ✅ `bun-api/start-production.sh` - Production start script
- ✅ `BE-PRODUCTION-ISSUE.md` - This documentation

**Ready to deploy!** Choose your preferred method above. 🚀
