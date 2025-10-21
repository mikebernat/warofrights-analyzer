# Integration Steps for Sharing Feature

## Current Status

✅ Backend server created
✅ Share modal component created
✅ URL state management composable created
✅ HomeView component created (contains all existing functionality)
✅ ShareView component created (for viewing shared analyses)
✅ Router configuration created
✅ Main.js updated with router

## Required Manual Steps

### Step 1: Replace App.vue

The current `App.vue` contains all the application logic inline. We need to replace it with the router-based version.

**Action:**
```bash
# Backup current App.vue
mv src/App.vue src/App.old.vue

# Use the new router-based App.vue
mv src/App.new.vue src/App.vue
```

**What this does:**
- Simplifies App.vue to just the app bar and router-view
- Moves all content to HomeView.vue
- Enables routing between Home and Share views

### Step 2: Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
```

### Step 3: Configure Environment

```bash
# Create .env file
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001
```

Create `server/.env`:
```env
PORT=3001
SHARE_EXPIRATION_DAYS=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 5: Test the Feature

1. **Upload a log file**
   - Go to http://localhost:5173
   - Upload a War of Rights log file
   - Select a round

2. **Create a share**
   - Click the "Share" button in the top right
   - Review the privacy notice
   - Click "Create Share Link"
   - Copy the generated URL

3. **View the share**
   - Open the share URL in a new tab/window
   - Verify the analysis loads correctly
   - Test filters (time range, player search)
   - Verify URL parameters update

4. **Test URL parameters**
   - Adjust time slider → URL should update
   - Enter search filter → URL should update
   - Copy URL and open in new tab → Filters should persist

## File Structure

```
src/
├── App.vue (NEW - simplified with router)
├── App.old.vue (BACKUP - original file)
├── main.js (UPDATED - includes router)
├── router/
│   └── index.js (NEW - route configuration)
├── views/
│   ├── HomeView.vue (NEW - main application)
│   └── ShareView.vue (NEW - shared analysis viewer)
├── components/
│   └── ShareModal.vue (NEW - share dialog)
├── composables/
│   └── useUrlState.js (NEW - URL state management)
└── services/
    └── api.js (NEW - API client)

server/
├── server.js (NEW - Express API)
├── config.js (NEW - configuration)
├── cleanup-shares.js (NEW - cleanup script)
├── cron-cleanup.sh (NEW - cron wrapper)
├── package.json (NEW - dependencies)
└── README.md (NEW - documentation)

sharedAnalysis/
└── .gitkeep (NEW - directory placeholder)
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts without errors
- [ ] Can upload and parse log files
- [ ] Can select a round
- [ ] Share button appears and is enabled
- [ ] Share modal opens and shows data preview
- [ ] Can create share link
- [ ] Share link can be copied
- [ ] Share URL loads in new tab
- [ ] Shared analysis displays correctly
- [ ] Filters work in shared view
- [ ] URL parameters update when filters change
- [ ] URL parameters persist on page reload

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version (need 18+)
- Check server/package.json dependencies installed

### Frontend can't connect to backend
- Verify VITE_API_URL in .env
- Check CORS_ORIGIN in server/.env
- Verify backend is running

### Share creation fails
- Check browser console for errors
- Verify backend logs
- Check rate limiting (wait 15 minutes or restart server)
- Verify sharedAnalysis/ directory exists and is writable

### Share loading fails
- Verify share ID format
- Check if share expired (30 days)
- Verify file exists in sharedAnalysis/
- Check backend logs

### URL parameters not working
- Verify router is installed: `npm list vue-router`
- Check browser console for errors
- Verify useUrlState composable is being called

## Next Steps

After verifying everything works:

1. **Update Docker configuration** (Phase 3)
   - Add backend service to docker-compose.yml
   - Configure volumes for sharedAnalysis
   - Set up networking

2. **Add tests**
   - Unit tests for components
   - API endpoint tests
   - E2E tests for sharing flow

3. **Performance optimization**
   - Add compression
   - Optimize bundle size
   - Add caching headers

4. **Enhanced features**
   - Share management UI
   - Analytics/tracking
   - Password-protected shares
   - Custom expiration dates
