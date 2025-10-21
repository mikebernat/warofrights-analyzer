# Docker Quick Reference Guide

> **Note:** For comprehensive deployment instructions including the backend API, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

## Development vs Production

### When to use Development Mode
- ✅ Actively developing/coding
- ✅ Need hot-reload for instant feedback
- ✅ Debugging with source maps
- ✅ Testing changes quickly

### When to use Production Mode
- ✅ Deploying to a server
- ✅ Testing production build
- ✅ Sharing with others
- ✅ Performance testing

## Quick Commands

### Development Mode (Hot-Reload)

```bash
# Start (with logs visible)
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down

# Rebuild (if dependencies changed)
docker-compose -f docker-compose.dev.yml up --build
```

**Access:** http://localhost:5173

### Production Mode

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up --build -d
```

**Access:** http://localhost:8080

## Switching Between Modes

```bash
# Stop production
docker-compose down

# Start development
docker-compose -f docker-compose.dev.yml up
```

Or vice versa:

```bash
# Stop development
docker-compose -f docker-compose.dev.yml down

# Start production
docker-compose up -d
```

## Troubleshooting

### Changes not appearing in Development Mode?

1. Make sure you're using `docker-compose.dev.yml`
2. Check that the container is running: `docker ps`
3. View logs: `docker-compose -f docker-compose.dev.yml logs -f`
4. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Port already in use?

```bash
# Check what's using the port
# Windows (PowerShell)
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :5173

# Change port in docker-compose.dev.yml
ports:
  - "3000:5173"  # Use port 3000 instead
```

### Need to rebuild after package.json changes?

```bash
# Development
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose down
docker-compose up --build -d
```

### Clean everything and start fresh

```bash
# Stop all containers
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Remove images
docker rmi wor-log-analyzer
docker rmi wor-log-analyzer-dev

# Rebuild
docker-compose up --build -d
```

## File Structure

```
.
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── docker-compose.yml      # Production config
├── docker-compose.dev.yml  # Development config
├── nginx.conf              # Nginx config (production only)
└── .dockerignore           # Files to exclude from build
```

## Tips

1. **Use development mode for coding** - Changes appear instantly
2. **Use production mode for testing** - Tests the actual deployment
3. **Keep both configs** - Easy to switch between modes
4. **Volume mounting** - Development mode mounts your local files, so changes are immediate
5. **No volume in production** - Production builds and copies files into the image
