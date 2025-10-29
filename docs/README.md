# Documentation

Comprehensive documentation for the War of Rights Log Analyzer.

## 📚 Quick Navigation

### 🎮 User Guides

#### [LIVE_MONITORING_GUIDE.md](features/LIVE_MONITORING_GUIDE.md) ⭐ NEW
Complete guide for real-time log monitoring.
- Quick start (3 steps)
- Windows hard link setup
- Features and capabilities
- Troubleshooting and FAQ

#### [LIVE_MONITORING_QUICKSTART.md](features/LIVE_MONITORING_QUICKSTART.md)
Quick reference for live monitoring setup.

#### [WINDOWS_HARD_LINK_GUIDE.md](features/WINDOWS_HARD_LINK_GUIDE.md)
Detailed Windows hard link instructions.
- Why it's needed
- Step-by-step creation
- Troubleshooting
- Alternative locations

### 🚀 Deployment Guides

#### [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md)
Complete guide for deploying to Digital Ocean App Platform.
- Quick start (15-20 minutes)
- Environment variable configuration
- Ingress routing setup
- Troubleshooting common issues
- Security best practices

#### [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
Complete guide for Docker-based deployments.
- Production deployment with docker-compose
- Development mode with hot-reload
- Backend API configuration
- Volume management
- Multi-service orchestration

### 📖 Feature Documentation

#### [FUZZY_REGIMENT_MATCHER.md](FUZZY_REGIMENT_MATCHER.md)
Regiment name parsing and normalization.
- Pattern matching
- Fuzzy matching algorithm
- Configuration

#### [MASS_REGIMENT_UPDATE.md](MASS_REGIMENT_UPDATE.md)
Bulk regiment reassignment feature.
- Pattern-based updates
- Preview and apply
- Undo functionality

#### [PARSING_IMPROVEMENTS.md](PARSING_IMPROVEMENTS.md)
Log parsing enhancements.
- Round detection
- Pseudo-rounds
- Event filtering

### 📖 Reference Documentation

#### [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
Complete reference for all environment variables.
- Frontend variables (VITE_*)
- Backend variables (Node.js)
- Storage configuration (S3/Spaces)
- Rate limiting and expiration settings
- Platform-specific configurations

#### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
Overview of the project architecture and file organization.
- Directory structure
- Component organization
- Backend services
- Configuration files

#### [SHARING_FEATURE.md](SHARING_FEATURE.md)
Documentation for the sharing feature.
- How sharing works
- Backend API endpoints
- Frontend components
- Data structure
- Privacy considerations

#### [PLAYER_PRESENCE_TRACKING.md](PLAYER_PRESENCE_TRACKING.md)
Documentation for player presence tracking.
- Join/leave event parsing
- Presence time calculation
- Multiple join/leave handling
- Edge cases and scenarios
- Display format and color coding

## 🚀 Quick Start Guides

### For Users
1. **Live Monitoring**: [LIVE_MONITORING_GUIDE.md](features/LIVE_MONITORING_GUIDE.md) - Real-time analysis
2. **Windows Setup**: [WINDOWS_HARD_LINK_GUIDE.md](features/WINDOWS_HARD_LINK_GUIDE.md) - One-time setup

### For Developers
1. **Local Development**: See main [README.md](../README.md)
2. **Project Structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. **Feature Implementation**: [features/](features/) folder

### For Deployment
1. **Docker**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Self-hosted
2. **Digital Ocean**: [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md) - Cloud platform
3. **Environment Setup**: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)

## 🔍 Find What You Need

### Common Tasks
- **Start live monitoring**: [LIVE_MONITORING_QUICKSTART.md](features/LIVE_MONITORING_QUICKSTART.md)
- **Create Windows hard link**: [WINDOWS_HARD_LINK_GUIDE.md](features/WINDOWS_HARD_LINK_GUIDE.md)
- **Configure environment**: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
- **Set up sharing**: [SHARING_FEATURE.md](SHARING_FEATURE.md)
- **Deploy to production**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

### Troubleshooting
- **Live monitoring issues**: [LIVE_MONITORING_GUIDE.md#troubleshooting](features/LIVE_MONITORING_GUIDE.md#troubleshooting)
- **Hard link problems**: [WINDOWS_HARD_LINK_GUIDE.md#troubleshooting](features/WINDOWS_HARD_LINK_GUIDE.md#troubleshooting)
- **Deployment issues**: [DOCKER_DEPLOYMENT.md#troubleshooting](DOCKER_DEPLOYMENT.md#troubleshooting)

## 📋 Deployment Comparison

| Feature | Digital Ocean | Docker |
|---------|---------------|--------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto-scaling** | ✅ Yes | ❌ Manual |
| **Cost** | ~$10-15/month | Server costs |
| **Maintenance** | Low | Medium |
| **Best For** | Production | Self-hosted |

## 🔧 Configuration Files

- `.do/app.yaml` - Digital Ocean App Platform configuration
- `docker-compose.yml` - Production Docker setup
- `docker-compose.dev.yml` - Development Docker setup
- `.env.example` - Environment variable template
- `server/config.js` - Backend configuration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mikebernat/warofrights-analyzer/issues)
- **Digital Ocean Docs**: [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- **Docker Docs**: [Docker Documentation](https://docs.docker.com/)

## 📁 Documentation Structure

```
docs/
├── README.md (this file)
├── DOCKER_DEPLOYMENT.md             # Docker deployment
├── DIGITALOCEAN_DEPLOYMENT.md       # Cloud deployment
├── ENVIRONMENT_VARIABLES.md         # Configuration reference
├── PROJECT_STRUCTURE.md             # Code organization
├── SHARING_FEATURE.md               # Sharing functionality
├── FUZZY_REGIMENT_MATCHER.md        # Regiment parsing
├── MASS_REGIMENT_UPDATE.md          # Bulk updates
├── PARSING_IMPROVEMENTS.md          # Parser enhancements
└── features/                        # Feature documentation
    ├── LIVE_MONITORING_GUIDE.md          # Complete live monitoring guide
    ├── LIVE_MONITORING_QUICKSTART.md     # Quick reference
    ├── WINDOWS_HARD_LINK_GUIDE.md        # Windows setup details
    ├── PLAYER_PRESENCE_TRACKING.md       # Presence calculation
    ├── LIVE_MONITORING_IMPLEMENTATION.md # Technical implementation
    ├── REFACTOR_LIVE_MONITORING_UI.md    # UI architecture
    ├── FEATURE_AUTO_SELECT_ROUND.md      # Auto-selection logic
    └── FEATURE_DISABLE_SHARE_LIVE.md     # Share button behavior
```

## 🔄 Keeping Documentation Updated

When making changes:
1. Update relevant user-facing docs
2. Add technical details to `features/` folder
3. Update troubleshooting sections
4. Keep quick start guides current
