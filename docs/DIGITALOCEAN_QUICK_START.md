# Digital Ocean App Platform - Quick Start

This is a condensed guide to get your War of Rights Log Analyzer deployed to Digital Ocean App Platform as quickly as possible.

## Prerequisites

- Digital Ocean account
- GitHub repository with your code
- 15-20 minutes

## Step 1: Create Storage (5 minutes)

1. Go to **Digital Ocean Spaces**
2. Click **Create a Space**
3. Choose a region (e.g., `nyc3`)
4. Name your Space (e.g., `wor-analyzer-storage`)
5. Click **Create Space**
6. Go to **API** → **Spaces Keys**
7. Click **Generate New Key**
8. **Save these immediately** (you can't view the secret again):
   - Access Key ID
   - Secret Access Key
9. Note your endpoint: `https://{region}.digitaloceanspaces.com`

## Step 2: Update Configuration (2 minutes)

Edit `.do/app.yaml`:

```yaml
# Update line 5 with your GitHub info
github:
  repo: your-username/your-repo-name
  branch: main

# Update lines 32-43 with your Spaces info
- key: S3_BUCKET
  value: "wor-analyzer-storage"  # Your Space name
  type: SECRET
- key: S3_REGION
  value: "nyc3"  # Your region
- key: AWS_ACCESS_KEY_ID
  value: "your-access-key-here"  # From Step 1
  type: SECRET
- key: AWS_SECRET_ACCESS_KEY
  value: "your-secret-key-here"  # From Step 1
  type: SECRET
```

## Step 3: Deploy (2 minutes)

### Option A: Using CLI (Recommended)

```bash
# Install doctl
brew install doctl  # macOS
# or: snap install doctl  # Linux

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml

# Note the app ID from the output
```

### Option B: Using Dashboard

1. Go to **App Platform** → **Create App**
2. Click **Import from YAML**
3. Paste contents of `.do/app.yaml`
4. Click **Next** → **Create Resources**

## Step 4: Wait for Build (5-10 minutes)

- Watch the build logs in the dashboard
- Both frontend and backend will build
- First build takes longer (installing dependencies)

## Step 5: Test (2 minutes)

Once deployed, you'll see two URLs in the dashboard:

### Test Backend
```bash
curl https://your-api-url.ondigitalocean.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-19T..."}
```

### Test Frontend
1. Open the frontend URL in your browser
2. Upload a test log file
3. Verify it parses and displays data

## Step 6: Fix CORS (if needed)

If you see CORS errors in the browser console:

1. Go to **App Platform** → Your App → **api** service
2. Click **Settings** → **Environment Variables**
3. Find `CORS_ORIGIN`
4. Update to your actual frontend URL (copy from dashboard)
5. Click **Save** (triggers redeploy)

## Done! 🎉

Your app is now live at:
- **Frontend**: `https://your-app-name.ondigitalocean.app`
- **Backend**: `https://api-your-app-name.ondigitalocean.app`

## Next Steps

- [ ] Add a custom domain (optional)
- [ ] Set up monitoring alerts
- [ ] Review the [full deployment guide](DIGITALOCEAN_DEPLOYMENT.md)
- [ ] Check the [deployment checklist](DEPLOYMENT_CHECKLIST.md)

## Troubleshooting

### Build Fails
- Check build logs in dashboard
- Verify `package.json` files are correct
- Ensure Node.js version compatibility

### CORS Errors
- Update `CORS_ORIGIN` to match frontend URL exactly
- No trailing slashes
- Include protocol (https://)

### Can't Connect to API
- Verify `VITE_API_URL` is set to `${api.PUBLIC_URL}`
- Check backend health endpoint
- Review backend logs

### Storage Errors
- Verify Spaces credentials are correct
- Check bucket name matches exactly
- Ensure endpoint URL is correct for your region

## Cost Estimate

**Basic Setup** (low traffic):
- Frontend (Static Site): $0-5/month
- Backend (Basic XXS): $5/month
- Spaces Storage: $5/month (250GB included)
- **Total**: ~$10-15/month

Scale up as needed based on traffic.

## Support

Need help?
- [Full Deployment Guide](DIGITALOCEAN_DEPLOYMENT.md)
- [Environment Variables Reference](ENVIRONMENT_VARIABLES.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Digital Ocean Community](https://www.digitalocean.com/community)
