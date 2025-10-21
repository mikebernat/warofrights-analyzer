import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createHash } from 'crypto'
import config from './config.js'
import StorageFactory from './adapters/StorageFactory.js'

const app = express()

// Initialize storage adapter
const storage = StorageFactory.create(config.storage)
console.log(`📦 Using ${config.storage.type} storage adapter`)

// Middleware
app.use(cors(config.cors))
app.use(express.json({ limit: '50mb' }))

// Rate limiter for share creation
const shareRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many share requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Helper function to generate share ID
function generateShareId(data) {
  const hash = createHash('sha1')
    .update(JSON.stringify(data))
    .digest('hex')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${hash}_${timestamp}`
}

// POST /share - Create a new shared analysis
app.post('/share', shareRateLimiter, async (req, res) => {
  try {
    const { analysis } = req.body

    if (!analysis) {
      return res.status(400).json({ error: 'Analysis data is required' })
    }

    // Validate required fields
    if (!analysis.roundInfo || !analysis.events) {
      return res.status(400).json({ error: 'Invalid analysis data structure' })
    }

    // Generate share ID
    const shareId = generateShareId(analysis)

    // Add metadata
    const shareData = {
      ...analysis,
      metadata: {
        shareId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + config.shareExpirationDays * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // Save using storage adapter
    await storage.save(shareId, shareData)

    res.json({
      success: true,
      shareId,
      expiresAt: shareData.metadata.expiresAt
    })
  } catch (error) {
    console.error('Error creating share:', error)
    res.status(500).json({ error: 'Failed to create share' })
  }
})

// GET /share/:shareId - Retrieve a shared analysis
app.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params
    
    // Validate shareId format (prevent directory traversal)
    // Format: {40-char-hex-hash}_{timestamp}
    // Example: abc123...def_{2025-10-19T23-06-30-123Z}
    if (!/^[a-f0-9]{40}_[\d-TZ]+$/.test(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID format' })
    }

    // Check if share exists
    const exists = await storage.exists(shareId)
    if (!exists) {
      return res.status(404).json({ error: 'Share not found or expired' })
    }

    // Retrieve share data
    const shareData = await storage.get(shareId)

    // Check if expired
    const expiresAt = new Date(shareData.metadata.expiresAt)
    if (expiresAt < new Date()) {
      // Delete expired share
      await storage.delete(shareId).catch(() => {})
      return res.status(410).json({ error: 'Share has expired' })
    }

    res.json({
      success: true,
      data: shareData
    })
  } catch (error) {
    console.error('Error retrieving share:', error)
    
    if (error.message === 'Share not found') {
      return res.status(404).json({ error: 'Share not found or expired' })
    }
    
    res.status(500).json({ error: 'Failed to retrieve share' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`)
  console.log(`📦 Storage: ${config.storage.type}`)
  console.log(`⏰ Share expiration: ${config.shareExpirationDays} days`)
  console.log(`🛡️  Rate limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 60000} minutes`)
})
