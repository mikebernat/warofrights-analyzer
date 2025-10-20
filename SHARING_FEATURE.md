# Sharing Feature Implementation

## Overview

The sharing feature allows users to generate shareable links to their analysis data. This enables collaboration and discussion around specific rounds without requiring recipients to have the original log file.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄────► │ Express API  │ ◄────► │ File System │
│  (Vue App)  │         │  (Node.js)   │         │   (JSON)    │
└─────────────┘         └──────────────┘         └─────────────┘
```

## Components Created

### Backend (server/)

1. **server.js** - Express API server
   - POST /api/share - Create shared analysis
   - GET /api/share/:shareId - Retrieve shared analysis
   - GET /api/health - Health check
   - Rate limiting (10 requests per 15 minutes)
   - CORS configuration
   - Input validation

2. **config.js** - Configuration management
   - Port settings
   - Expiration days
   - Rate limiting
   - CORS origins

3. **cleanup-shares.js** - Cleanup script
   - Scans for expired shares
   - Deletes old files
   - Logs cleanup activity

4. **cron-cleanup.sh** - Cron job wrapper
   - Runs cleanup script
   - Logs to file
   - Manages log rotation

5. **package.json** - Dependencies
   - express
   - cors
   - express-rate-limit

### Frontend (src/)

1. **components/ShareModal.vue** - Share dialog
   - Privacy notice
   - Data preview
   - Share link generation
   - Copy to clipboard
   - Multi-step workflow

2. **services/api.js** - API client
   - Axios configuration
   - Share creation
   - Share retrieval
   - Error handling

3. **router/index.js** - Vue Router setup
   - Home route (/)
   - Share route (/share/:shareId)

### Configuration

1. **.env.example** - Environment template
2. **.gitignore** - Ignore share files
3. **sharedAnalysis/.gitkeep** - Directory placeholder

## Data Structure

### Shared Analysis Format

```json
{
  "events": [
    {
      "time": 1234,
      "player": "PlayerName",
      "regiment": "69thNY",
      "roundId": 1,
      "map": "Antietam"
    }
  ],
  "roundInfo": {
    "id": 1,
    "map": "Antietam",
    "startTime": 0,
    "endTime": 3600,
    "winner": "USA",
    "complete": true
  },
  "teamAssignments": {
    "69thNY": "USA",
    "1stTX": "CSA"
  },
  "manualReassignments": [
    {
      "playerName": "Player1",
      "originalRegiment": "Uncategorized",
      "newRegiment": "69thNY",
      "timestamp": "2025-10-19T22:00:00Z"
    }
  ],
  "parsingConfig": { /* current parsing rules */ },
  "metadata": {
    "shareId": "abc123..._2025-10-19T22-00-00-000Z",
    "createdAt": "2025-10-19T22:00:00Z",
    "expiresAt": "2025-11-18T22:00:00Z"
  }
}
```

## Security Features

1. **Rate Limiting**
   - Prevents abuse
   - Configurable limits
   - Per-IP tracking

2. **Input Validation**
   - Share ID format validation
   - Prevents directory traversal
   - JSON structure validation

3. **CORS Protection**
   - Whitelist origins
   - Credentials support
   - Configurable

4. **Automatic Expiration**
   - 30-day default
   - Automatic cleanup
   - Prevents data accumulation

## Privacy Considerations

### What IS Shared
- Player names
- Regiment assignments
- Respawn timestamps
- Round information
- Team assignments
- Manual reassignments

### What is NOT Shared
- Original log file
- IP addresses
- System information
- Data from other rounds
- Browser cache/localStorage
- User preferences

## Usage Flow

### Creating a Share

1. User uploads log file
2. User selects a round
3. User clicks "Share" button
4. Modal shows privacy notice and data preview
5. User confirms
6. Frontend sends analysis to backend
7. Backend generates share ID and saves file
8. Frontend receives share URL
9. User copies and shares URL

### Viewing a Share

1. Recipient clicks share URL
2. Frontend extracts share ID from URL
3. Frontend requests data from backend
4. Backend validates and retrieves file
5. Backend checks expiration
6. Frontend loads shared analysis
7. User views data (read-only mode)
8. User can apply filters via URL parameters

## URL Parameters (Future)

Planned URL parameter support:

```
/share/abc123?timeStart=0&timeEnd=1800&filter=69thNY&round=1
```

Parameters:
- `timeStart` - Start time filter (seconds)
- `timeEnd` - End time filter (seconds)
- `filter` - Player/regiment search filter
- `round` - Round ID (for multi-round shares)

## Installation

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Start Services

```bash
# Backend
cd server
npm start

# Frontend (separate terminal)
npm run dev
```

### 4. Setup Cron Job (Optional)

```bash
# Make script executable
chmod +x server/cron-cleanup.sh

# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /path/to/server/cron-cleanup.sh
```

## Testing

### Manual Testing

1. **Create Share**
   ```bash
   curl -X POST http://localhost:3001/api/share \
     -H "Content-Type: application/json" \
     -d '{"analysis": {...}}'
   ```

2. **Retrieve Share**
   ```bash
   curl http://localhost:3001/api/share/abc123_2025-10-19T22-00-00-000Z
   ```

3. **Health Check**
   ```bash
   curl http://localhost:3001/api/health
   ```

### Rate Limit Testing

```bash
# Should succeed 10 times, then fail
for i in {1..12}; do
  curl -X POST http://localhost:3001/api/share \
    -H "Content-Type: application/json" \
    -d '{"analysis": {...}}'
done
```

## Deployment

### Docker (Recommended)

Docker configuration updates needed:
- Add backend service to docker-compose.yml
- Mount sharedAnalysis volume
- Configure environment variables
- Set up networking between frontend and backend

### Manual Deployment

1. Build frontend: `npm run build`
2. Serve dist/ with nginx
3. Run backend with PM2 or systemd
4. Configure reverse proxy
5. Set up SSL certificates
6. Configure firewall rules

## Monitoring

### Logs

- Backend logs: stdout/stderr
- Cleanup logs: `logs/cleanup.log`
- Access logs: (configure in nginx/apache)

### Metrics to Track

- Share creation rate
- Share retrieval rate
- Storage usage
- Error rates
- Expiration cleanup stats

## Troubleshooting

### Share Creation Fails

1. Check backend is running
2. Verify CORS configuration
3. Check rate limits
4. Verify file permissions on sharedAnalysis/

### Share Retrieval Fails

1. Verify share ID format
2. Check if share expired
3. Verify file exists
4. Check backend logs

### Rate Limit Issues

1. Adjust `RATE_LIMIT_MAX_REQUESTS`
2. Adjust `RATE_LIMIT_WINDOW_MS`
3. Consider IP whitelisting for trusted users

## Future Enhancements

1. **URL State Management**
   - Sync filters to URL
   - Browser history support
   - Shareable filtered views

2. **Share Management**
   - List user's shares
   - Delete shares manually
   - Extend expiration

3. **Analytics**
   - Track share views
   - Popular shares
   - Usage statistics

4. **Enhanced Privacy**
   - Optional player name anonymization
   - Selective data sharing
   - Password-protected shares

5. **Performance**
   - Compression
   - CDN integration
   - Database instead of flat files

## Support

For issues or questions:
1. Check server logs
2. Verify configuration
3. Review this documentation
4. Check GitHub issues
