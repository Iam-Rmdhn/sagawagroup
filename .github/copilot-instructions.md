# Sagawa Group - AI Coding Agent Instructions

## Project Overview
Full-stack company profile website with mitra (partner) management system. **Astro** static frontend + **Bun** TypeScript backend + **AstraDB** (serverless Cassandra) database.

## Architecture & Data Flow

### Frontend-Backend Communication
- Frontend: `vue-frontend/` (Astro SSG, ports 4321 dev / 80 prod via Nginx)
- Backend: `bun-api/` (Bun server, ports 3000 dev / 5000 prod)
- API URL configured via `PUBLIC_API_URL` env var, injected into all Astro pages via `Layout.astro`
- **Critical**: Admin/mitra dashboards fetch data client-side; token stored in `localStorage` (`adminToken` / `mitraToken`)

### Database Pattern (AstraDB)
- **No SQL migrations**: Collections auto-created in `bun-api/src/lib/db.ts` `initializeCollections()`
- **Date handling**: Store ISO strings (`getCurrentTimestamp()` from `utils/date.ts`), NOT Date objects
- **Collections**: `users`, `mitra`, `admin_login`, `mitra_login`, `mitra_pelunasan`, `visitor`, `mitra_agreements`
- **Image storage**: Base64 strings OR file paths in `uploads/` (see `processImageData` helpers for URL normalization)

### Authentication Flow
1. Login → JWT issued by backend (`/api/auth/login` or `/api/admin/login`)
2. Token stored in `localStorage` with key `mitraToken` or `adminToken`
3. Protected routes check token on page load, redirect to `/login` if missing
4. Backend validates JWT via `Authorization: Bearer <token>` header

## Critical Developer Workflows

### Running Dev Environment
```bash
# Terminal 1 - Backend
cd bun-api
bun install
bun run dev  # Uses .env (default port 3000)

# Terminal 2 - Frontend  
cd vue-frontend
npm install
npm run dev  # Port 4321
```

### Production Build & Deploy
```bash
# One-click production deploy (includes SSL setup)
sudo ./deploy-production.sh

# Manual steps:
./production-build.sh         # Builds both frontend + backend
sudo ./deploy-nginx.sh         # Nginx config to /etc/nginx
sudo ./setup-ssl.sh            # Let's Encrypt SSL
pm2 start ecosystem.config.js --env production
```

### PM2 Process Management
- **Name**: `sagawagroup-api`
- **Config**: `ecosystem.config.js` (uses `api/start-production.sh` script wrapper)
- **Logs**: `/var/www/sagawagroup/logs/api-{error,out}.log`
- **Reload**: `pm2 reload ecosystem.config.js --env production` (zero-downtime)

### Environment Files
- **Dev**: `bun-api/.env` (uses `ENV` object from `src/env.ts` with validation)
- **Prod**: `bun-api/.env.production` (auto-created by `production-build.sh`)
- **Required vars**: `ASTRA_DB_APPLICATION_TOKEN`, `ASTRA_DB_API_ENDPOINT`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`
- **Frontend env**: `PUBLIC_API_URL` must match backend BASE_URL

## Project-Specific Conventions

### File Organization
- **Admin pages**: `vue-frontend/src/pages/admin/*.astro` (dashboard, pelunasan, users/)
- **User/Mitra pages**: `vue-frontend/src/pages/user/*.astro` (dashboard, kewajiban, profile)
- **API routes**: `bun-api/src/routes/*.route.ts` → controllers → services
- **Shared helpers**: `vue-frontend/src/lib/adminHelpers.ts` (reusable fetch/render logic)

### Component Patterns
1. **Astro script sections**: Top `---` fence for server logic, bottom `<script>` for client JS
2. **Global functions**: Attach to `window` for onclick handlers (e.g., `window.approveMitra`)
3. **Layout wrapper**: All pages import `@layouts/Layout.astro` with SEO meta + API_URL injection

### SweetAlert Integration (Recent Fix)
**Problem**: Dynamic `import('sweetalert2')` caused Vite optimize errors  
**Solution**: `loadSweetAlert()` helper in admin dashboard:
- Caches SweetAlert instance globally (`window.Swal`)
- In dev: loads CDN script first to avoid Vite errors
- In prod: imports module, falls back to CDN if needed
- **Usage**: `const Swal = await loadSweetAlert(); if (!Swal) { alert('...'); return; }`
- Applied in: `admin/dashboard.astro` `approveMitra()`, `deleteMitra()`

### API Request Patterns
**Standard fetch with timeout** (prevents infinite loading spinners):
```typescript
const response = await fetchWithTimeout(`${API_URL}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
}, 15000); // 15s timeout
```

**Error handling**:
```typescript
catch (error: unknown) {
  const errorMessage = error instanceof Error
    ? (error.name === 'AbortError' ? 'Permintaan ke server melebihi batas waktu.' : error.message)
    : 'Unknown error';
  await Swal.fire({ title: "Error", text: errorMessage, icon: "error" });
}
```

### Image URL Normalization
Images stored as:
- Base64 strings (starts with `data:image/`)
- File paths (`/uploads/filename.jpg` or relative)
- Full URLs (`https://...`)

**Processing pattern** (see `admin/dashboard.astro` `processImageData()`):
```typescript
if (imageData.startsWith('data:')) return imageData;
if (imageData.startsWith('http')) return imageData;
if (imageData.startsWith('/uploads/')) return `${API_URL}${imageData}`;
// Fallback: treat as filename
return `${API_URL}/uploads/${imageData}`;
```

### Dashboard State Management
- **Filter state**: `getCurrentActiveFilter()` checks DOM classes (`bg-gray-100` active indicator)
- **Stats update**: Animated counters with `animateNumber()` (staggered setTimeout)
- **Chart updates**: Chart.js instance `paymentChart` updated via `updateChartWithRealData()`
- **Skeleton → Content**: `hideSkeletonAndShowContent()` swaps loading states

### Business Logic Patterns
**Mitra approval workflow**:
1. Pending mitra shown in `admin/dashboard` (status = 'pending')
2. Admin clicks "Setujui" → `approveMitra()` → `/api/admin/mitra/approve` endpoint
3. Backend updates status to 'approved' + sends email with default password
4. Frontend reloads data with `loadMitraData(getCurrentActiveFilter())`

**Pelunasan (payment settlement)**:
- Mitra with `nilaiPaketUsaha: 'DP'` must submit pelunasan form
- Stored in `mitra_pelunasan` collection with proof images
- Admin approves via `/api/admin/approve-pelunasan`

**Kewajiban (obligations) page**:
- Displays pending pelunasan for Self Managed mitra
- Fallback if no pending data: shows "Tidak ada kewajiban" message
- Agreement modal auto-shows if not previously accepted (cached in `localStorage`)

## Integration Points

### Google Sheets Sync
- Mitra can link Google Sheets for financial tracking
- URL stored per-mitra in `mitra-sheets.json` file
- Endpoint: `/api/mitra/sheets-data` fetches live data
- **Update frequency**: Manual refresh or auto-sync on dashboard load

### YouTube API
- Service: `bun-api/src/services/youtube.service.ts`
- Fetches channel videos + shorts, caches for 1 hour
- Endpoint: `/api/youtube/videos`
- Frontend: `gallery.astro` displays with fallback mock data in dev

### Visitor Analytics
- Records IP + user-agent in `visitor` collection
- Endpoint: `/api/visitor/track` (called from `Layout.astro` client-side)
- Stats displayed in admin dashboard with daily/weekly/monthly aggregation

### Email Notifications
- Provider: Hostinger SMTP (`smtp.hostinger.com:587`)
- Config: `bun-api/src/utils/email.ts`
- Use cases: Mitra approval, password reset
- **Test connection**: `testEmailConnection()` before sending

## Common Pitfalls & Solutions

### ❌ Dynamic imports breaking in production
**Don't**: `await import('sweetalert2').then(Swal => Swal.default.fire(...))`  
**Do**: Use `loadSweetAlert()` helper with CDN fallback

### ❌ Dates as Date objects in AstraDB
**Don't**: `createdAt: new Date()`  
**Do**: `createdAt: getCurrentTimestamp()` (returns ISO string)

### ❌ Missing Authorization header
All protected endpoints need: `headers: { 'Authorization': \`Bearer ${token}\` }`

### ❌ Image 404s in admin dashboard
Check image URL normalization—API might return filename-only, need `${API_URL}/uploads/` prefix

### ❌ Infinite loading spinners
Use `fetchWithTimeout()` wrapper, handle `AbortError` in catch block

### ❌ PM2 not reloading after code changes
Run `pm2 reload ecosystem.config.js --env production`, NOT `pm2 restart` (causes downtime)

## Testing & Debugging

### Quick Health Checks
```bash
# Backend API
curl http://localhost:3000/api/health

# Check PM2 status
pm2 status
pm2 logs sagawagroup-api --lines 50

# Database connection
# Check console on server startup: "Connected to AstraDB successfully"
```

### Frontend Debug Patterns
- Check browser console for `[SW Cleanup]`, `[Visitor]`, `[Analytics]` prefixed logs
- Admin token: `localStorage.getItem('adminToken')`
- Mitra token: `localStorage.getItem('mitraToken')`
- Clear service worker cache: Visit `/clear-cache.html`

### Common Error Codes
- **401/403**: Token missing/invalid → redirect to login
- **500**: Check backend logs, likely AstraDB connection issue
- **404 on images**: URL normalization problem, check `processImageData()` logic

## Build Optimization

### Production Bundle
- Frontend: Astro builds to `vue-frontend/dist/` (static HTML + JS chunks)
- Backend: No build step (Bun runs TypeScript directly)
- **Asset optimization**: Tailwind purges unused CSS, Astro tree-shakes JS

### Deployment Checklist
1. Update `.env.production` with real credentials
2. Run `./production-build.sh` (builds frontend, copies to `/var/www/sagawagroup`)
3. Deploy Nginx config: `sudo ./deploy-nginx.sh`
4. Setup SSL: `sudo ./setup-ssl.sh` (auto-renewal via cron)
5. Start PM2: `pm2 start ecosystem.config.js --env production`
6. Verify: `curl https://www.sagawagroup.id/api/health`

## Additional Resources
- Production guide: `README-PRODUCTION.md`
- CI/CD setup: `README-CICD.md`
- Backup/restore: `backup.sh` / `restore.sh`
- SSL renewal test: `sudo certbot renew --dry-run`
