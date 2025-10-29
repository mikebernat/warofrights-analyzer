# War of Rights Log Analyzer

A single-page web application for analyzing War of Rights game logs. Built with Vue 3 + Vuetify, the app parses local .log files and visualizes player respawn activity over time.

## Features

- **Client-Side Parsing**: All parsing occurs in your browser using Web Workers - no server uploads
- **Live Monitoring**: Real-time monitoring of active game.log files during gameplay (Chrome/Edge 86+)
  - Incremental parsing of new log entries
  - Live statistics and event feed
  - Configurable poll interval
  - See [LIVE_MONITORING_GUIDE.md](docs/features/LIVE_MONITORING_GUIDE.md) for details
- **Time-Based Filtering**: Second-level precision time slider to filter data
- **Search & Filter**: Free-form text search for players and regiments
- **Multiple Visualizations**:
  - Total respawns KPI card
  - Respawns over time (line chart)
  - Top 10 regiments (horizontal bar chart)
  - Top 10 players (horizontal bar chart)
  - Top 5 regiments over time (multi-line chart)
- **Round Detection**: Automatically detects rounds from OnRoundStarted/OnVictory events
- **Pseudo-Round Creation**: Groups activity after 5-minute idle gaps
- **CSV Export**: Export raw respawn data (Time, Player, Regiment, RoundId, Map)
- **LocalStorage Caching**: Keeps most recent log cached for quick access
- **Share Analysis**: Generate shareable links to analysis (requires backend server)
  - Share specific rounds with others
  - URL-based filter parameters (time range, player/regiment filters)
  - Automatic expiration after 30 days
  - Privacy-focused: only parsed data is shared, not original logs

## Installation

### Option 1: Docker (Recommended)

> **Full Stack Deployment:** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for comprehensive instructions including backend API.

#### Production Mode (Full Stack)

**Start all services (Frontend + Backend API):**
```bash
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

**Features:**
- ✅ Frontend served by Nginx
- ✅ Backend API for sharing
- ✅ Persistent storage for shared analyses
- ✅ Automatic restarts
- ✅ Health checks

**Stop services:**
```bash
docker-compose down
```

#### Development Mode (with hot-reload)

For development with automatic file watching and hot-reload:

```bash
# Start development server
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

The development server will be available at `http://localhost:5173`

**Note:** Changes to your source files will automatically trigger hot-reload in development mode.

### Option 2: Local Development

**Install dependencies:**
```bash
npm install
```

**Run development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

## Backend Server (Optional - for Sharing)

The sharing feature requires a Node.js backend server.

**Setup:**
```bash
cd server
npm install
cp .env.example .env  # Configure as needed
npm start
```

**Configuration:**
- `PORT`: Server port (default: 3001)
- `SHARE_EXPIRATION_DAYS`: Days until shares expire (default: 30)
- `RATE_LIMIT_MAX_REQUESTS`: Max shares per window (default: 10)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in ms (default: 15 minutes)

**Cleanup Cron Job:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/server/cron-cleanup.sh
```

## Deployment

### Docker (Recommended for Self-Hosting)
See **[docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)** for complete Docker deployment guide.

### Digital Ocean App Platform
See **[docs/DIGITALOCEAN_DEPLOYMENT.md](docs/DIGITALOCEAN_DEPLOYMENT.md)** for cloud deployment guide.

### Documentation
See **[docs/README.md](docs/README.md)** for complete documentation index.

## Usage

1. Click "Select War of Rights log file" and choose a .log file
2. Wait for parsing to complete (progress bar shown)
3. Select a round to analyze
4. Use the time slider to filter by time range
5. Use the search box to filter by player or regiment name
6. View analytics in the various charts
7. Export data to CSV if needed
8. Click "Share" to generate a shareable link (requires backend server)

## Log File Location

War of Rights log files are typically located at:
```
C:\Program Files (x86)\Steam\steamapps\common\War of Rights\
```

Look for files named like: `Game Build(XX) DD MMM YY (HH MM SS).log`

## Technical Stack

- **Framework**: Vue 3 + Vite
- **UI**: Vuetify 3
- **State Management**: Pinia
- **Charts**: ECharts (vue-echarts)
- **Parsing**: Web Worker with Comlink
- **Icons**: Material Design Icons
- **Deployment**: Docker + Nginx (Alpine Linux)

## Docker Details

### Production Build (`Dockerfile`)

The application uses a multi-stage Docker build:

1. **Build Stage**: Node.js 18 Alpine image compiles the Vue application
2. **Production Stage**: Nginx Alpine serves the static files

**Features:**
- Optimized production build with gzip compression
- Security headers configured
- SPA routing support (Vue Router)
- Static asset caching (1 year)
- Small image size (~50MB total)

**Port Configuration:**
- Default: `8080:80` (host:container)
- Modify in `docker-compose.yml` to change the host port

### Development Build (`Dockerfile.dev`)

For development with hot-reload:

**Features:**
- Volume mounting for live code updates
- Vite dev server with HMR (Hot Module Replacement)
- No rebuild required for code changes
- Source maps for debugging

**Port Configuration:**
- Default: `5173:5173` (host:container)
- Modify in `docker-compose.dev.yml` to change the host port

**How it works:**
- Your local source code is mounted into the container
- Vite watches for file changes and triggers hot-reload
- Changes appear instantly in the browser (no manual refresh needed)

## Parsing Logic

### Round Segmentation

1. **Explicit Rounds**: OnRoundStarted → OnVictory (Complete)
2. **Map-Bounded**: PrepareLevel → next PrepareLevel or EOF (Incomplete)
3. **Activity-Cluster**: Groups respawns after 5-minute idle gaps (Pseudo, Unknown Map)

### Regiment Extraction

Regiments are extracted from player names using patterns:
1. Leftmost `[]` or `{}` token (e.g., `[10thUS.I]`, `{30thOH}`)
2. Clan+bracket combos (e.g., `JD-[38th Va]`)
3. Unit token before rank (e.g., `1stVACav`)
4. Otherwise: "Uncategorized"

### Key Events Parsed

- `[CWarOfRightsGame] Initialized` - Start of valid log data
- `Game rules class: ...` - Game mode metadata
- `PrepareLevel MAP` - Map changes
- `CGameRulesEventHelper::OnRoundStarted` - Round start
- `CGameRulesEventHelper::OnVictory TeamID: X` - Round end with winner
- `[CPlayer::ClDoRespawn] "PlayerName"` - Player respawn events

## Privacy

All log parsing is performed locally in your browser. No data is uploaded to any server. Your logs remain completely private.

## Configuration

Edit `src/config/parsing-config.json` to customize:
- Idle gap duration (default: 300 seconds)
- Regiment extraction patterns
- Rank patterns
- Top N defaults for charts

## License

MIT
