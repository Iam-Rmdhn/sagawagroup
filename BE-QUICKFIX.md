# 🚀 Quick Fix - Backend Production

## Problem
Backend **tidak jalan** di production dengan PM2, hanya jalan dengan `bun dev`.

## Root Cause
PM2 tidak support Bun sebagai interpreter → Error: "Module not found ProcessContainerForkBun.js"

## Quick Solution (Choose ONE)

### Option 1: PM2 dengan Config Baru ⚡ FASTEST

```bash
# 1. Delete PM2 process yang error
pm2 delete all

# 2. Start dengan config baru
cd /home/ilham/sagawagroup
pm2 start ecosystem-bun.config.js --env production

# 3. Save PM2
pm2 save

# 4. Setup auto-start
pm2 startup
# Copy paste command dari output, lalu run

# 5. Check status
pm2 status
pm2 logs sagawagroup-api
```

### Option 2: Full Deploy dengan Script Baru 🔄 RECOMMENDED

```bash
# Deploy everything (FE + BE) dengan fix baru
sudo ./deploy-production.sh
```

### Option 3: Systemd Service 🛡️ MOST STABLE

```bash
# 1. Install service
sudo cp sagawagroup-api.service /etc/systemd/system/
sudo systemctl daemon-reload

# 2. Enable & start
sudo systemctl enable sagawagroup-api
sudo systemctl start sagawagroup-api

# 3. Check status
sudo systemctl status sagawagroup-api
```

---

## Test Backend

```bash
# 1. Check if running
pm2 status

# 2. Check logs
pm2 logs sagawagroup-api

# 3. Test API
curl http://localhost:5000/api/health

# 4. Check port
ss -tuln | grep 5000
```

---

## Files Created

- ✅ `ecosystem-bun.config.js` - PM2 config yang benar untuk Bun
- ✅ `sagawagroup-api.service` - Systemd service (alternative)
- ✅ `api-manager.sh` - Management script
- ✅ `BE-PRODUCTION-ISSUE.md` - Full documentation

---

## Next Steps After Fix

1. ✅ Backend sudah jalan dengan PM2 atau systemd
2. ✅ Test API: `curl http://localhost:5000/api/health`
3. ✅ Update Nginx jika belum proxy ke port 5000
4. ✅ Test dari browser: `https://www.sagawagroup.id/api/health`
5. ✅ Deploy frontend dengan cache busting (sudah selesai)

---

**Need detailed explanation?** Read: `BE-PRODUCTION-ISSUE.md`

**Ready to deploy?** Choose option above! 🚀
