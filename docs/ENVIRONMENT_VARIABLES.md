# Environment Variables Reference

This document lists all environment variables used by the War of Rights Log Analyzer application.

## Frontend Variables

### VITE_API_URL
- **Type**: Build-time variable
- **Required**: Yes
- **Default**: `http://localhost:3001`
- **Description**: URL of the backend API server
- **Usage**: Used by the frontend to make API calls
- **Example**: `https://api.your-domain.com` or `${api.PUBLIC_URL}` (Digital Ocean)
- **Note**: This is baked into the build. Changes require a rebuild.

## Backend Variables

### Core Configuration

#### PORT
- **Type**: Runtime variable
- **Required**: No
- **Default**: `3001`
- **Description**: Port the API server listens on
- **Example**: `3001`, `8080`

#### NODE_ENV
- **Type**: Runtime variable
- **Required**: No
- **Default**: None
- **Description**: Node environment (development, production)
- **Example**: `production`

#### CORS_ORIGIN
- **Type**: Runtime variable
- **Required**: No
- **Default**: `http://localhost:5173`
- **Description**: Allowed origin for CORS requests (frontend URL)
- **Example**: `https://your-frontend.com`, `${APP_URL}` (Digital Ocean)
- **Note**: Must match the frontend URL exactly

### Storage Configuration

#### STORAGE_TYPE
- **Type**: Runtime variable
- **Required**: No
- **Default**: `filesystem`
- **Description**: Type of storage adapter to use
- **Options**: `filesystem`, `s3`
- **Example**: `s3`

#### Filesystem Storage

##### STORAGE_PATH
- **Type**: Runtime variable
- **Required**: Only if `STORAGE_TYPE=filesystem`
- **Default**: `./sharedAnalysis`
- **Description**: Path to store shared analysis files
- **Example**: `./sharedAnalysis`, `/data/shares`
- **Note**: Not recommended for cloud platforms (ephemeral storage)

#### S3/Spaces Storage

##### S3_BUCKET
- **Type**: Runtime variable (SECRET)
- **Required**: Only if `STORAGE_TYPE=s3`
- **Default**: None
- **Description**: S3 bucket or Digital Ocean Space name
- **Example**: `my-wor-analyzer-bucket`

##### S3_PREFIX
- **Type**: Runtime variable
- **Required**: No
- **Default**: `shares/`
- **Description**: Prefix/folder for stored files in the bucket
- **Example**: `shares/`, `analysis/`

##### S3_REGION
- **Type**: Runtime variable
- **Required**: Only if `STORAGE_TYPE=s3`
- **Default**: Value of `AWS_REGION` if set
- **Description**: AWS region or Digital Ocean Spaces region
- **Example**: `us-east-1`, `nyc3`, `sfo3`

##### S3_ENDPOINT
- **Type**: Runtime variable
- **Required**: Only for non-AWS S3 (like Digital Ocean Spaces)
- **Default**: None (uses AWS default)
- **Description**: Custom S3 endpoint URL
- **Example**: `https://nyc3.digitaloceanspaces.com`

##### S3_FORCE_PATH_STYLE
- **Type**: Runtime variable
- **Required**: No
- **Default**: `false`
- **Description**: Use path-style URLs for S3 (required for some S3-compatible services)
- **Options**: `true`, `false`
- **Example**: `true`

##### AWS_ACCESS_KEY_ID
- **Type**: Runtime variable (SECRET)
- **Required**: Only if `STORAGE_TYPE=s3`
- **Default**: None
- **Description**: AWS access key ID or Spaces access key
- **Example**: `AKIAIOSFODNN7EXAMPLE`

##### AWS_SECRET_ACCESS_KEY
- **Type**: Runtime variable (SECRET)
- **Required**: Only if `STORAGE_TYPE=s3`
- **Default**: None
- **Description**: AWS secret access key or Spaces secret key
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### Rate Limiting & Expiration

#### SHARE_EXPIRATION_DAYS
- **Type**: Runtime variable
- **Required**: No
- **Default**: `30`
- **Description**: Number of days before shared analyses expire
- **Example**: `30`, `7`, `90`

#### RATE_LIMIT_WINDOW_MS
- **Type**: Runtime variable
- **Required**: No
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limiting in milliseconds
- **Example**: `900000` (15 min), `3600000` (1 hour)

#### RATE_LIMIT_MAX_REQUESTS
- **Type**: Runtime variable
- **Required**: No
- **Default**: `10`
- **Description**: Maximum number of share creation requests per window
- **Example**: `10`, `20`, `5`

## Environment-Specific Configurations

### Local Development

Create a `.env` file in the root directory:

```bash
# Frontend
VITE_API_URL=http://localhost:3001

# Backend (or create server/.env)
PORT=3001
SHARE_EXPIRATION_DAYS=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
CORS_ORIGIN=http://localhost:5173
STORAGE_TYPE=filesystem
STORAGE_PATH=./sharedAnalysis
```

### Docker Compose

Environment variables are defined in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - CORS_ORIGIN=http://localhost:8080
  - VITE_API_URL=http://localhost:3001
```

### Digital Ocean App Platform

Environment variables are defined in:
1. `.do/app.yaml` (for automated deployments)
2. App Platform Dashboard > Settings > Environment Variables

Use variable references for cross-service communication:
- `${api.PUBLIC_URL}` - References the backend API URL
- `${APP_URL}` - References the frontend app URL

### Other Cloud Platforms

Most cloud platforms support environment variables through:
1. Configuration files (YAML, JSON)
2. Web dashboard/console
3. CLI tools

Refer to your platform's documentation for specifics.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Mark sensitive variables as SECRET** in cloud platforms
3. **Use different credentials** for each environment
4. **Rotate secrets regularly**
5. **Use least-privilege access** for API keys
6. **Enable encryption** for stored secrets
7. **Audit access logs** regularly

## Validation

The application validates environment variables at startup:
- Missing required variables will use defaults (with warnings)
- Invalid values may cause startup failures
- Check application logs for configuration issues

## Troubleshooting

### Variable Not Taking Effect

**Frontend (VITE_API_URL)**:
- Ensure variable is set **before** build
- Rebuild the application after changing
- Check browser console for API URL being used

**Backend**:
- Restart the server after changing
- Check server logs for loaded configuration
- Verify variable names match exactly (case-sensitive)

### CORS Errors

- Ensure `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes
- Verify protocol (http vs https)

### Storage Errors

- Verify all S3 credentials are set correctly
- Check bucket permissions
- Ensure endpoint URL is correct
- Test credentials with AWS CLI or s3cmd

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js process.env](https://nodejs.org/api/process.html#process_process_env)
- [AWS SDK Configuration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html)
- [Digital Ocean Spaces](https://docs.digitalocean.com/products/spaces/)
