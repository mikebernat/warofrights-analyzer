# Digital Ocean App Platform Deployment Checklist

Use this checklist to ensure a smooth deployment to Digital Ocean App Platform.

## Pre-Deployment

### 1. Storage Setup (Choose One)

#### Option A: Digital Ocean Spaces (Recommended)
- [ ] Create a Digital Ocean Space (bucket)
- [ ] Note the Space name
- [ ] Note the region (e.g., `nyc3`, `sfo3`)
- [ ] Generate Spaces API keys (access key + secret key)
- [ ] Note the endpoint URL (e.g., `https://nyc3.digitaloceanspaces.com`)
- [ ] (Optional) Configure CORS on the Space if needed

#### Option B: Filesystem Storage (Not Recommended)
- [ ] Understand that data will be lost on redeployment
- [ ] Only use for testing/development

### 2. Repository Setup
- [ ] Push code to GitHub repository
- [ ] Ensure `.env` files are in `.gitignore`
- [ ] Verify `package.json` files are correct
- [ ] Test build locally: `npm ci && npm run build`
- [ ] Test server locally: `cd server && npm install && npm start`

### 3. Configuration Files
- [ ] Review `.do/app.yaml` configuration
- [ ] Update GitHub repository details in `app.yaml`
- [ ] Update S3/Spaces credentials in `app.yaml` (or plan to add via dashboard)
- [ ] Adjust instance sizes if needed
- [ ] Verify region selection

## Deployment

### 4. Create App on Digital Ocean

#### Method A: Using App Spec YAML
- [ ] Install `doctl` CLI tool
- [ ] Authenticate: `doctl auth init`
- [ ] Create app: `doctl apps create --spec .do/app.yaml`
- [ ] Note the app ID from output

#### Method B: Using Dashboard
- [ ] Go to Digital Ocean App Platform
- [ ] Click "Create App"
- [ ] Connect GitHub repository
- [ ] Configure backend service (see below)
- [ ] Configure frontend static site (see below)

### 5. Backend Service Configuration

If using dashboard, configure:
- [ ] **Name**: `api`
- [ ] **Source Directory**: `server`
- [ ] **Build Command**: `npm install --production`
- [ ] **Run Command**: `node server.js`
- [ ] **HTTP Port**: `3001`
- [ ] **Health Check Path**: `/api/health`

Environment Variables:
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `CORS_ORIGIN` = `${APP_URL}` (or frontend URL after first deploy)
- [ ] `STORAGE_TYPE` = `s3` (or `filesystem`)
- [ ] `SHARE_EXPIRATION_DAYS` = `30`
- [ ] `RATE_LIMIT_WINDOW_MS` = `900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS` = `10`

If using S3/Spaces:
- [ ] `S3_BUCKET` = your bucket name (mark as SECRET)
- [ ] `S3_REGION` = your region
- [ ] `S3_ENDPOINT` = your endpoint URL
- [ ] `S3_PREFIX` = `shares/`
- [ ] `AWS_ACCESS_KEY_ID` = your access key (mark as SECRET)
- [ ] `AWS_SECRET_ACCESS_KEY` = your secret key (mark as SECRET)

### 6. Frontend Configuration

If using dashboard, configure:
- [ ] **Name**: `frontend`
- [ ] **Build Command**: `npm ci && npm run build`
- [ ] **Output Directory**: `dist`

Environment Variables:
- [ ] `VITE_API_URL` = `${APP_URL}` (if using ingress routing) or `${api.PUBLIC_URL}` (if separate domains)

### 7. Deploy
- [ ] Click "Create Resources" or "Deploy"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Note any build errors in logs

## Post-Deployment Verification

### 8. Test Backend API
- [ ] Get backend URL from App Platform dashboard
- [ ] Test health endpoint: `curl https://your-app-url/api/health`
- [ ] Verify response: `{"status":"ok","timestamp":"..."}`
- [ ] Check backend logs for any errors

### 9. Test Frontend
- [ ] Get frontend URL from App Platform dashboard
- [ ] Open frontend URL in browser
- [ ] Verify page loads correctly
- [ ] Check browser console for errors

### 10. Test Full Integration
- [ ] Upload a test log file
- [ ] Verify file parses correctly
- [ ] Select a round
- [ ] View analysis data
- [ ] Test share functionality (if applicable)
- [ ] Verify shared link works

### 11. CORS Verification
- [ ] Open browser developer tools (Network tab)
- [ ] Upload a log file
- [ ] Verify API calls succeed (no CORS errors)
- [ ] Check response headers include CORS headers

### 12. Storage Verification (S3/Spaces)
- [ ] Create a share
- [ ] Check Digital Ocean Spaces for the file
- [ ] Verify file is in correct prefix/folder
- [ ] Test retrieving the share via link

## Post-Deployment Configuration

### 13. Update CORS_ORIGIN (If Needed)
If you used a placeholder for `CORS_ORIGIN`:
- [ ] Go to App Platform dashboard
- [ ] Navigate to api service > Settings > Environment Variables
- [ ] Update `CORS_ORIGIN` to actual frontend URL
- [ ] Save and redeploy

### 14. Custom Domain (Optional)
- [ ] Add custom domain in App Platform settings
- [ ] Update DNS records as instructed
- [ ] Wait for SSL certificate provisioning
- [ ] Update `CORS_ORIGIN` to use custom domain
- [ ] Update any hardcoded URLs

### 15. Monitoring Setup
- [ ] Review App Platform metrics
- [ ] Set up alerts for:
  - [ ] High error rates
  - [ ] High response times
  - [ ] Resource usage
  - [ ] Build failures
- [ ] Configure log forwarding (optional)

### 16. Security Review
- [ ] Verify all secrets are marked as SECRET
- [ ] Review CORS configuration
- [ ] Check rate limiting is working
- [ ] Review S3/Spaces bucket permissions
- [ ] Enable 2FA on Digital Ocean account
- [ ] Review access logs
- [ ] Rotate any credentials exposed in git history

## Ongoing Maintenance

### 17. Regular Tasks
- [ ] Monitor application logs weekly
- [ ] Review error rates and performance
- [ ] Check storage usage and costs
- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly
- [ ] Review and clean up expired shares

### 18. Backup Strategy
- [ ] Document S3/Spaces bucket name and region
- [ ] Keep backup of environment variables
- [ ] Document custom configurations
- [ ] Test disaster recovery process

## Troubleshooting Reference

### Common Issues

**Build Fails**
- Check build logs in App Platform dashboard
- Verify `package.json` dependencies
- Test build locally first

**CORS Errors**
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes
- Ensure protocol matches (http vs https)
- If using ingress routing, CORS should be automatic (same domain)

**API Connection Errors**
- Verify `VITE_API_URL` is set correctly
- Check backend service is running
- Verify health check is passing
- If using ingress routing, ensure `/api` prefix is in the URL

**Storage Errors**
- Verify S3 credentials are correct
- Check bucket permissions
- Ensure endpoint URL is correct
- Test credentials with AWS CLI

**Environment Variable Not Working**
- Frontend: Rebuild required for `VITE_*` variables
- Backend: Redeploy required for runtime variables
- Verify variable names match exactly (case-sensitive)

**405 Method Not Allowed**
- Check CORS configuration
- Verify ingress routing is set up correctly
- Ensure API endpoints are accessible at `/api/*`

## Support Resources

- [ ] Bookmark [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [ ] Bookmark [Digital Ocean Spaces Docs](https://docs.digitalocean.com/products/spaces/)
- [ ] Join Digital Ocean Community
- [ ] Save support ticket link

## Completion

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team notified of new URLs
- [ ] Monitoring configured
- [ ] Backup strategy documented
- [ ] Credentials rotated if exposed
- [ ] Deployment considered successful! 🎉
