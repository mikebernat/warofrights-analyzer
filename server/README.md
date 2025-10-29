# WOR Log Analyzer - Backend Server

Express.js backend for sharing analysis data and live log monitoring.

## Setup

```bash
cd server
npm install
```

## Services

This server package includes two separate services:

1. **Share API Server** (`server.js`) - For sharing analysis data
2. **Live Monitor Server** (`live-monitor-server.js`) - For real-time log monitoring via WebSocket

## Configuration

Create a `.env` file in the server directory:

```env
PORT=3001
SHARE_EXPIRATION_DAYS=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
CORS_ORIGIN=http://localhost:5173
```

## Running

### Share API Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### Live Monitor Server

**Development:**
```bash
npm run live-monitor:dev
```

**Production:**
```bash
npm run live-monitor
```

**Environment Variables:**
- `LIVE_MONITOR_PORT` - Port for WebSocket server (default: 3001)

## API Endpoints

### POST /api/share
Create a new shared analysis.

**Request:**
```json
{
  "analysis": {
    "events": [...],
    "roundInfo": {...},
    "teamAssignments": {...},
    "manualReassignments": [...],
    "parsingConfig": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "shareId": "abc123def456_2025-10-19T22-30-00-000Z",
  "expiresAt": "2025-11-18T22:30:00.000Z"
}
```

### GET /api/share/:shareId
Retrieve a shared analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "roundInfo": {...},
    "metadata": {
      "shareId": "...",
      "createdAt": "...",
      "expiresAt": "..."
    }
  }
}
```

### GET /api/health
Health check endpoint.

## Live Monitor WebSocket API

The Live Monitor Server provides a WebSocket endpoint for real-time log file monitoring.

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001')
```

### Start Monitoring
```javascript
ws.send(JSON.stringify({
  type: 'start',
  filePath: 'C:\\Path\\To\\War of Rights\\WarOfRights\\Saved\\Logs\\game.log'
}))
```

### Receive Updates
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'started':
      console.log('Monitoring started:', data.filePath)
      break
    case 'update':
      console.log('New content:', data.content)
      console.log('File size:', data.size)
      break
    case 'error':
      console.error('Error:', data.message)
      break
  }
}
```

### Stop Monitoring
```javascript
ws.send(JSON.stringify({ type: 'stop' }))
```

### Message Types

**Client → Server:**
- `start` - Start monitoring a file
- `stop` - Stop monitoring
- `ping` - Keep-alive ping

**Server → Client:**
- `started` - Monitoring started successfully
- `update` - New file content available
- `error` - Error occurred
- `pong` - Response to ping

For more details, see [Live Monitoring Documentation](../docs/LIVE_MONITORING.md).

## Cleanup

### Manual Cleanup
```bash
npm run cleanup
```

### Automated Cleanup (Cron)

Add to crontab to run daily at 2 AM:
```bash
crontab -e
```

Add this line:
```
0 2 * * * /path/to/server/cron-cleanup.sh
```

Or use the provided script:
```bash
chmod +x cron-cleanup.sh
./cron-cleanup.sh
```

## Rate Limiting

- Default: 10 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`

## File Storage

Shared analyses are stored in `../sharedAnalysis/` as JSON files.

File naming: `{sha1hash}_{timestamp}.json`

Example: `a1b2c3d4e5f6..._{2025-10-19T22-30-00-000Z}.json`

## Security

- Share IDs are validated to prevent directory traversal
- CORS is configured to only allow specified origins
- Rate limiting prevents abuse
- Files automatically expire after configured days
