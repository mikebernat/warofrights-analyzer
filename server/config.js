export default {
  port: process.env.PORT || 3001,
  shareExpirationDays: parseInt(process.env.SHARE_EXPIRATION_DAYS) || 30,
  sharedAnalysisPath: '../sharedAnalysis',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10 // 10 shares per window
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'filesystem', // 'filesystem' or 's3'
    // Filesystem options
    path: process.env.STORAGE_PATH,
    // S3 options
    bucket: process.env.S3_BUCKET,
    prefix: process.env.S3_PREFIX || 'shares/',
    region: process.env.S3_REGION || process.env.AWS_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}
