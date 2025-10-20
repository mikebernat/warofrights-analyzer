# Docker Deployment Guide

## Overview

The application consists of two services:
- **Frontend** (Nginx + Vue.js) - Port 8080
- **Backend API** (Node.js + Express) - Port 3001

Both services are containerized and orchestrated with Docker Compose.

## Quick Start

### Production Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

### Development Mode

```bash
# Start with hot-reload
docker-compose -f docker-compose.dev.yml up

# Or in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Docker Host                     │
│                                                  │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │    Frontend      │      │   Backend API   │ │
│  │  (Nginx:80)      │◄────►│   (Node:3001)   │ │
│  │  Port 8080       │      │   Port 3001     │ │
│  └──────────────────┘      └─────────────────┘ │
│                                    │            │
│                             ┌──────▼──────┐    │
│                             │   Volume    │    │
│                             │ shared-     │    │
│                             │ analysis    │    │
│                             └─────────────┘    │
└─────────────────────────────────────────────────┘
```

## Services

### Frontend (wor-log-analyzer)

**Image:** Custom (built from Dockerfile)
**Base:** nginx:stable-alpine
**Port:** 8080:80
**Purpose:** Serves the Vue.js application

**Build Process:**
1. Node.js 18 Alpine builds the Vue app
2. Nginx Alpine serves the static files
3. Custom nginx.conf for SPA routing

### Backend (wor-api)

**Image:** Custom (built from server/Dockerfile)
**Base:** node:18-alpine
**Port:** 3001:3001
**Purpose:** Handles share creation/retrieval

**Features:**
- Express API server
- Rate limiting
- CORS protection
- File-based storage
- Health checks

## Volumes

### shared-analysis

**Type:** Named volume
**Purpose:** Persistent storage for shared analyses
**Location:** Docker-managed (usually `/var/lib/docker/volumes/`)

**Backup:**
```bash
# Backup volume
docker run --rm -v wor-log-analyzer_shared-analysis:/data -v $(pwd):/backup alpine tar czf /backup/shared-analysis-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v wor-log-analyzer_shared-analysis:/data -v $(pwd):/backup alpine tar xzf /backup/shared-analysis-backup.tar.gz -C /data
```

## Networks

### wor-network (Production)

**Type:** Bridge network
**Purpose:** Allows frontend and backend to communicate

### wor-network-dev (Development)

**Type:** Bridge network
**Purpose:** Development environment networking

## Configuration

### Environment Variables

#### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)
- `NODE_ENV` - Environment mode (production/development)

#### Backend
- `PORT` - Server port (default: 3001)
- `SHARE_EXPIRATION_DAYS` - Days until shares expire (default: 30)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 10)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:8080)

### Custom Configuration

Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  wor-api:
    environment:
      - SHARE_EXPIRATION_DAYS=60
      - RATE_LIMIT_MAX_REQUESTS=20
    ports:
      - "3002:3001"  # Custom port

  wor-log-analyzer:
    ports:
      - "8081:80"  # Custom port
```

## Commands

### Build

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build wor-api
docker-compose build wor-log-analyzer

# Build with no cache
docker-compose build --no-cache
```

### Start/Stop

```bash
# Start services
docker-compose up -d

# Start specific service
docker-compose up -d wor-api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs -f wor-api

# Last 100 lines
docker-compose logs --tail=100
```

### Maintenance

```bash
# Restart services
docker-compose restart

# Restart specific service
docker-compose restart wor-api

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec wor-api sh
docker-compose exec wor-log-analyzer sh

# View resource usage
docker stats
```

## Health Checks

### Backend Health Check

```bash
# From host
curl http://localhost:3001/api/health

# From Docker
docker-compose exec wor-api wget -qO- http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T22:00:00.000Z"
}
```

### Frontend Health Check

```bash
# From host
curl -I http://localhost:8080

# Should return 200 OK
```

## Cleanup

### Manual Cleanup of Expired Shares

```bash
# Run cleanup script
docker-compose exec wor-api npm run cleanup
```

### Automated Cleanup (Cron)

**Option 1: Host Cron**
```bash
# Add to host crontab
0 2 * * * docker-compose -f /path/to/docker-compose.yml exec -T wor-api npm run cleanup >> /var/log/wor-cleanup.log 2>&1
```

**Option 2: Container Cron**
Create a custom Dockerfile with cron:

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache dcron
# ... rest of setup
# Add cron job
RUN echo "0 2 * * * cd /app && npm run cleanup" | crontab -
CMD crond && node server.js
```

## Troubleshooting

### Frontend can't connect to backend

**Symptoms:** Share creation fails, API errors in console

**Solutions:**
1. Check backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs wor-api`
3. Verify CORS_ORIGIN matches frontend URL
4. Check network connectivity: `docker-compose exec wor-log-analyzer ping wor-api`

### Backend won't start

**Symptoms:** Container exits immediately

**Solutions:**
1. Check logs: `docker-compose logs wor-api`
2. Verify port 3001 is available: `netstat -an | grep 3001`
3. Check environment variables: `docker-compose config`
4. Rebuild: `docker-compose build --no-cache wor-api`

### Volume permission issues

**Symptoms:** Can't write to sharedAnalysis directory

**Solutions:**
```bash
# Fix permissions
docker-compose exec wor-api chown -R node:node /app/sharedAnalysis
docker-compose exec wor-api chmod -R 755 /app/sharedAnalysis
```

### Out of disk space

**Symptoms:** Build fails, container won't start

**Solutions:**
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Check disk usage
docker system df
```

## Production Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### Steps

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd WarOfRights-LogAnalyzer
   ```

2. **Configure environment**
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   # Edit docker-compose.override.yml with your settings
   ```

3. **Build and start**
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment**
   ```bash
   docker-compose ps
   docker-compose logs
   curl http://localhost:3001/api/health
   ```

5. **Setup cleanup cron**
   ```bash
   # Add to crontab
   0 2 * * * cd /path/to/app && docker-compose exec -T wor-api npm run cleanup
   ```

### Reverse Proxy (Optional)

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS (Optional)

Use Let's Encrypt with Certbot:
```bash
certbot --nginx -d yourdomain.com
```

## Monitoring

### Logs

```bash
# Continuous monitoring
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > logs.txt
```

### Metrics

```bash
# Resource usage
docker stats

# Disk usage
docker system df
docker volume ls
```

### Alerts

Set up monitoring with:
- Prometheus + Grafana
- Docker health checks
- Log aggregation (ELK stack)

## Backup & Recovery

### Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup shared analysis volume
docker run --rm \
  -v wor-log-analyzer_shared-analysis:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/shared-analysis-$DATE.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR/shared-analysis-$DATE.tar.gz"
```

### Restore

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file>"
  exit 1
fi

docker run --rm \
  -v wor-log-analyzer_shared-analysis:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/$BACKUP_FILE -C /data

echo "Restore completed from: $BACKUP_FILE"
```

## Security

### Best Practices

1. **Use secrets for sensitive data**
   ```yaml
   services:
     wor-api:
       secrets:
         - api_key
   secrets:
     api_key:
       file: ./secrets/api_key.txt
   ```

2. **Limit container resources**
   ```yaml
   services:
     wor-api:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

3. **Run as non-root user**
   ```dockerfile
   USER node
   ```

4. **Keep images updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Review this documentation
4. Check GitHub issues
