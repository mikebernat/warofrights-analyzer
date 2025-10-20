# WOR Log Analyzer - Backend Server

Express.js backend for sharing analysis data.

## Setup

```bash
cd server
npm install
```

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

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

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
