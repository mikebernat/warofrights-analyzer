# Documentation

This folder contains comprehensive documentation for deploying and understanding the War of Rights Log Analyzer.

## 📚 Documentation Index

### Deployment Guides

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

### Reference Documentation

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

## 🚀 Quick Links

### Getting Started
1. **Local Development**: See main [README.md](../README.md)
2. **Docker Deployment**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
3. **Cloud Deployment**: [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md)

### Common Tasks
- **Configure environment variables**: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
- **Set up sharing feature**: [SHARING_FEATURE.md](SHARING_FEATURE.md)
- **Understand project structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

### Troubleshooting
- **Digital Ocean issues**: See [DIGITALOCEAN_DEPLOYMENT.md#troubleshooting](DIGITALOCEAN_DEPLOYMENT.md#troubleshooting)
- **Docker issues**: See [DOCKER_DEPLOYMENT.md#troubleshooting](DOCKER_DEPLOYMENT.md#troubleshooting)
- **Environment variables**: See [ENVIRONMENT_VARIABLES.md#troubleshooting](ENVIRONMENT_VARIABLES.md#troubleshooting)

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

## 🔄 Keeping Documentation Updated

When making changes to the application:
1. Update relevant documentation files
2. Test all deployment methods
3. Update troubleshooting sections with new issues
4. Keep environment variable references current
