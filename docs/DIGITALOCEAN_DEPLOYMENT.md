# Digital Ocean App Platform Deployment Guide

This guide explains how to deploy the War of Rights Log Analyzer to Digital Ocean's App Platform.

## Overview

The application consists of two components:
1. **Backend API** (Node.js Express server)
2. **Frontend** (Vue.js static site)

Both components are deployed together using ingress routing:
- `/api/*` routes to the backend service
- `/*` routes to the frontend static site
- Single domain for both (e.g., `your-app.ondigitalocean.app`)

## Quick Start (15-20 minutes)

### Step 1: Create Storage
1. Go to **Digital Ocean Spaces** → **Create a Space**
2. Choose a region (e.g., `nyc3`)
3. Name your Space (e.g., `wor-analyzer-storage`)
4. Go to **API** → **Spaces Keys** → **Generate New Key**
5. **Save immediately**: Access Key ID and Secret Access Key
6. Note your endpoint: `https://{region}.digitaloceanspaces.com`

### Step 2: Update Configuration
Edit `.do/app.yaml`:
- Update `github.repo` with your repository (e.g., `username/repo-name`)
- Update S3 credentials with your Spaces info

### Step 3: Deploy
```bash
# Install doctl
brew install doctl  # macOS
# or snap install doctl  # Linux

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

### Step 4: Test
Once deployed, test the health endpoint:
```bash
curl https://your-app-url.ondigitalocean.app/api/health
```

## Prerequisites

- Digital Ocean account
- GitHub repository with your code
- Digital Ocean Spaces bucket (for S3-compatible storage)
- 15-20 minutes

## Environment Variables

### Backend API Variables

These must be configured in the Digital Ocean App Platform dashboard:

#### Required Variables
- `PORT` - Port for the API server (default: `3001`)
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Frontend URL (use `${APP_URL}` to auto-reference the frontend)

#### Storage Configuration

**Option 1: S3/Spaces Storage (Recommended for production)**
- `STORAGE_TYPE` - Set to `s3`
- `S3_BUCKET` - Your Digital Ocean Spaces bucket name
- `S3_REGION` - Your Spaces region (e.g., `nyc3`, `sfo3`)
- `S3_ENDPOINT` - Spaces endpoint (e.g., `https://nyc3.digitaloceanspaces.com`)
- `AWS_ACCESS_KEY_ID` - Spaces access key
- `AWS_SECRET_ACCESS_KEY` - Spaces secret key (mark as SECRET)
- `S3_PREFIX` - Optional prefix for files (default: `shares/`)

**Option 2: Filesystem Storage (Not recommended for App Platform)**
- `STORAGE_TYPE` - Set to `filesystem`
- `STORAGE_PATH` - Path to store files (default: `./sharedAnalysis`)
- ⚠️ **Warning**: Filesystem storage is ephemeral on App Platform. Data will be lost on redeployment.

#### Rate Limiting & Expiration
- `SHARE_EXPIRATION_DAYS` - Days before shares expire (default: `30`)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: `900000` = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: `10`)

### Frontend Variables

- `VITE_API_URL` - Backend API URL (use `${api.PUBLIC_URL}` to auto-reference the backend)

## Deployment Methods

### Method 1: Using App Spec YAML (Recommended)

1. **Create Digital Ocean Spaces Bucket** (if using S3 storage):
   - Go to Digital Ocean Spaces
   - Create a new Space
   - Generate API keys (Spaces access key and secret)
   - Note the endpoint URL (e.g., `https://nyc3.digitaloceanspaces.com`)

2. **Update the App Spec**:
   - Edit `.do/app.yaml`
   - Update the `github` section with your repository details
   - Update S3/Spaces credentials (or remove if using filesystem)
   - Adjust instance sizes and regions as needed

3. **Deploy via doctl CLI**:
   ```bash
   # Install doctl if not already installed
   brew install doctl  # macOS
   # or snap install doctl  # Linux
   
   # Authenticate
   doctl auth init
   
   # Create the app
   doctl apps create --spec .do/app.yaml
   
   # Or update existing app
   doctl apps update YOUR_APP_ID --spec .do/app.yaml
   ```

4. **Deploy via Dashboard**:
   - Go to Digital Ocean App Platform
   - Click "Create App"
   - Choose "Import from YAML"
   - Paste contents of `.do/app.yaml`
   - Review and create

### Method 2: Using the Dashboard

1. **Create New App**:
   - Go to Digital Ocean App Platform
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure Backend Service**:
   - **Name**: `api`
   - **Source Directory**: `server`
   - **Build Command**: `npm install --production`
   - **Run Command**: `node server.js`
   - **HTTP Port**: `3001`
   - **Environment Variables**: Add all backend variables listed above
   - **Health Check**: `/api/health`

3. **Configure Frontend Static Site**:
   - **Name**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: 
     - `VITE_API_URL`: `${api.PUBLIC_URL}` (references the backend service)

4. **Review and Deploy**

## Important Notes

### CORS Configuration
The backend needs to know the frontend URL for CORS. Use the environment variable reference:
```yaml
CORS_ORIGIN: "${APP_URL}"
```

Or in the dashboard, set `CORS_ORIGIN` to the frontend URL after first deployment.

### API URL Configuration
The frontend needs to know the backend URL. Use the environment variable reference:
```yaml
VITE_API_URL: "${api.PUBLIC_URL}"
```

This automatically resolves to the backend service's public URL.

### Storage Recommendations

**For Production**: Use Digital Ocean Spaces (S3-compatible storage)
- Persistent across deployments
- Scalable
- Reliable
- Easy to manage

**For Testing**: Filesystem storage works but is ephemeral
- Data lost on redeployment
- Not suitable for production
- Useful for quick testing

### Build-Time vs Runtime Variables

**Important**: `VITE_API_URL` is a **build-time** variable. It gets baked into the frontend bundle during build.

If you need to change the API URL after deployment:
1. Update the environment variable
2. Trigger a rebuild of the frontend

## Post-Deployment

1. **Verify Health Check**:
   ```bash
   curl https://your-api-url.ondigitalocean.app/api/health
   ```

2. **Test CORS**:
   - Open the frontend URL
   - Upload a log file
   - Verify the API calls work

3. **Monitor Logs**:
   - Check App Platform logs for any errors
   - Monitor API response times

## Troubleshooting

### App Spec Validation Errors

**Error: `services.github.repo` is required**
- Add `repo: username/repo-name` to both the `api` service and `frontend` static site in `.do/app.yaml`

**Error: rule matching path prefix "/" already in use**
- Ensure you have the `ingress` section configured with proper routing
- The `/api` prefix should route to the `api` component
- The `/` prefix should route to the `frontend` component

### 405 Method Not Allowed (Cannot POST /share)

This occurs when the backend routes don't match the ingress routing:
- **Problem**: Ingress strips the `/api` prefix before forwarding to backend
- **Solution**: Backend routes should be `/share`, `/health` (not `/api/share`, `/api/health`)
- Update `server/server.js` to remove `/api` prefix from all routes
- Update health check in `.do/app.yaml` to `http_path: /health`

### 404 Not Found on Share Links

This happens when Vue Router routes aren't handled correctly:
- **Solution**: Add `catchall_document: index.html` to the frontend static site in `.do/app.yaml`
- This tells Digital Ocean to serve `index.html` for all non-file routes
- Vue Router will then handle the client-side routing

### CORS Errors
- Verify `CORS_ORIGIN` is set to `${APP_URL}` in `.do/app.yaml`
- With ingress routing, both frontend and backend are on the same domain (CORS should be automatic)
- Check browser console for specific CORS error messages

### API Connection Errors
- Verify `VITE_API_URL` is set to `${APP_URL}` (not `${api.PUBLIC_URL}` when using ingress)
- Check that the backend service is running in the Digital Ocean dashboard
- Verify health check is passing: `curl https://your-app.ondigitalocean.app/api/health`
- Check backend logs for errors

### Storage Errors (S3/Spaces)
- Verify bucket name is correct
- Check access keys have proper permissions
- Ensure endpoint URL is correct: `https://{region}.digitaloceanspaces.com` (without bucket name)
- Add `S3_REGION` environment variable (e.g., `nyc3`)
- Verify bucket CORS settings if needed

### Build Failures
- Check build logs in App Platform dashboard
- Verify `package.json` files are correct in both root and `server/` directories
- Ensure Node.js version compatibility (Node 18+ required)
- Check that `source_dir: server` is set for the backend service

## Cost Optimization

- **Basic XXS instances** are suitable for low-traffic applications
- Scale up as needed based on usage
- Monitor bandwidth and storage costs
- Set up alerts for unexpected usage

## Security Best Practices

1. **Mark sensitive variables as SECRET** in the dashboard
2. **Rotate API keys** regularly
3. **Enable HTTPS** (automatic on App Platform)
4. **Review rate limits** based on expected traffic
5. **Set appropriate CORS origins** (don't use wildcards in production)
6. **Monitor access logs** for suspicious activity

## Updating the Application

### Via GitHub (Automatic)
- Push changes to your main branch
- App Platform automatically rebuilds and deploys

### Via doctl
```bash
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

### Via Dashboard
- Go to your app settings
- Update environment variables or configuration
- Click "Save" to trigger redeployment

## Additional Resources

- [Digital Ocean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Digital Ocean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
