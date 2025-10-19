# War of Rights Log Analyzer

A single-page web application for analyzing War of Rights game logs. Built with Vue 3 + Vuetify, the app parses local .log files and visualizes player respawn activity over time.

## Features

- **Client-Side Parsing**: All parsing occurs in your browser using Web Workers - no server uploads
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
- **Warnings Panel**: Displays incomplete rounds and pseudo-rounds
- **CSV Export**: Export raw respawn data (Time, Player, Regiment, RoundId, Map)
- **LocalStorage Caching**: Keeps most recent log cached for quick access

## Installation

### Option 1: Docker

#### Production Mode (Recommended for deployment)

**Using Docker Compose:**
```bash
docker-compose up -d
```

The application will be available at `http://localhost:8080`

**Using Docker directly:**
```bash
# Build the image
docker build -t wor-log-analyzer .

# Run the container
docker run -d -p 8080:80 --name wor-log-analyzer wor-log-analyzer
```

**Stop the container:**
```bash
docker-compose down
# or
docker stop wor-log-analyzer
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

## Usage

1. Click "Select War of Rights log file" and choose a .log file
2. Wait for parsing to complete (progress bar shown)
3. Use the time slider to filter by time range
4. Use the search box to filter by player or regiment name
5. View analytics in the various charts
6. Export data to CSV if needed

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
