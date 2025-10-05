# 🐛 Deploy Production Error Fix

## Error Message
```
[INFO] Installing API dependencies with Bun...
error: Bun could not find a package.json file to install from
note: Run "bun init" to initialize a project
[ERROR] API dependency installation failed
```

## Root Causes Found

### 1. Snap Bun Confinement Issue ❌
- Bun installed via snap (`/snap/bin/bun`)
- Snap confinement prevents access to `/var/www/` directory
- Even though `package.json` exists, snap bun cannot read it

### 2. PM2 Environment Variables ❌
- PM2 tidak otomatis load `.env.production`
- `NODE_ENV` tidak ter-set
- API crash karena required env vars tidak ada

## Solutions Implemented

### Fix 1: Install Native Bun for Root ✅

```bash
# Install bun natively (not via snap)
sudo bash -c "curl -fsSL https://bun.sh/install | bash"

# Now bun is at: /root/.bun/bin/bun
# Can access /var/www/ without restrictions
```

**Deploy script updated to:**
1. Check for `/root/.bun/bin/bun` first (priority)
2. Avoid snap bun due to confinement issues
3. Auto-install if not found

### Fix 2: Improved File Copy & Verification ✅

```bash
# Added verification after rsync
if [ ! -f "$DEPLOY_DIR/api/package.json" ]; then
    print_error "package.json not found after copy!"
    cp "$PROJECT_DIR/bun-api/package.json" "$DEPLOY_DIR/api/"
fi

# List files for debugging
ls -lh "$DEPLOY_DIR/api/" | grep -E "package.json|index.ts|.env"
```

### Fix 3: PM2 with Proper Environment ✅

```bash
# Set environment variables before PM2 start
export NODE_ENV=production
export PORT=5000

# Start with working directory
pm2 start "$BUN_PATH" \
    --name sagawagroup-api \
    --cwd "$DEPLOY_DIR/api" \
    -- run index.ts
```

**ecosystem-bun.config.js updated:**
```javascript
env: {
  NODE_ENV: "production",
  PORT: 5000
},
```

---

## Verification Tests

### Test 1: Bun Installation ✅
```bash
sudo /root/.bun/bin/bun --version
# Output: 1.2.23
```

### Test 2: Bun Install Works ✅
```bash
cd /var/www/sagawagroup/api
sudo /root/.bun/bin/bun install
# Output: 104 packages installed [20.78s]
```

### Test 3: PM2 Start Success ✅
```bash
sudo pm2 start /root/.bun/bin/bun \
    --name sagawagroup-api \
    --cwd /var/www/sagawagroup/api \
    -- run index.ts

# Output: status: online ✅
```

### Test 4: API Health Check ✅
```bash
curl http://localhost:5000/api/health
# Output: {"status":"OK","environment":"production"}
```

---

## Deploy Script Changes

### deploy-production.sh Updates:

1. **Better Bun Detection:**
```bash
# Priority order:
1. /root/.bun/bin/bun (native install)
2. System bun (non-snap)
3. Auto-install if not found
4. Avoid snap bun
```

2. **File Verification:**
```bash
# Verify critical files after copy
- package.json
- index.ts
- .env.production
```

3. **Environment Setup:**
```bash
export NODE_ENV=production
export PORT=5000
```

4. **PM2 with CWD:**
```bash
pm2 start "$BUN_PATH" \
    --name sagawagroup-api \
    --cwd "$DEPLOY_DIR/api" \
    -- run index.ts
```

---

## Files Modified

- ✅ `deploy-production.sh`
  - Better bun detection logic
  - File verification after copy
  - Environment variable setup
  - PM2 start with proper CWD

- ✅ `ecosystem-bun.config.js`
  - Added `env` section
  - Updated PATH to include multiple bun locations

---

## Common Issues & Solutions

### Issue: "Bun could not find package.json"
**Cause:** Snap bun confinement or wrong working directory  
**Solution:** Use native bun (`/root/.bun/bin/bun`) and set proper `--cwd`

### Issue: "Required environment variable JWT_SECRET is not set"
**Cause:** PM2 not loading .env.production  
**Solution:** Set `NODE_ENV=production` before PM2 start

### Issue: "Script not found: /root/.bun/bin/bun"
**Cause:** Running PM2 as user, not root  
**Solution:** Use `sudo pm2` for production deployment

### Issue: Permission denied
**Cause:** Wrong file ownership  
**Solution:** `sudo chown -R root:root /var/www/sagawagroup/api`

---

## Deployment Commands

### Full Deploy (Recommended):
```bash
sudo ./deploy-production.sh
```

### Manual Deploy (If Script Fails):
```bash
# 1. Install native bun for root
sudo bash -c "curl -fsSL https://bun.sh/install | bash"

# 2. Copy files
sudo rsync -av --exclude=node_modules /home/ilham/sagawagroup/bun-api/ /var/www/sagawagroup/api/

# 3. Install dependencies
cd /var/www/sagawagroup/api
sudo /root/.bun/bin/bun install

# 4. Start with PM2
sudo NODE_ENV=production PORT=5000 pm2 start /root/.bun/bin/bun \
    --name sagawagroup-api \
    --cwd /var/www/sagawagroup/api \
    -- run index.ts

# 5. Save PM2
sudo pm2 save

# 6. Test
curl http://localhost:5000/api/health
```

---

## Status

✅ **Bun Issue:** Fixed - Native bun installed for root  
✅ **Package.json:** Fixed - File verification added  
✅ **Environment:** Fixed - NODE_ENV properly set  
✅ **PM2 Start:** Fixed - Using correct CWD  
✅ **API Health:** Working - Returns 200 OK  

**Backend Production is now ready to deploy!** 🚀

---

**Date:** 2025-10-05  
**Status:** ✅ Resolved  
**API Status:** 🟢 Online
