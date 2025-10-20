import config from './config.js'
import StorageFactory from './adapters/StorageFactory.js'

async function cleanupExpiredShares() {
  console.log('🧹 Starting cleanup of expired shares...')
  console.log(`📦 Storage type: ${config.storage.type}`)
  
  try {
    // Initialize storage adapter
    const storage = StorageFactory.create(config.storage)
    
    // Get all shares
    const shares = await storage.list()
    const now = new Date()
    
    let deletedCount = 0
    let errorCount = 0
    let totalSize = 0

    console.log(`📁 Found ${shares.length} shares to check`)

    for (const share of shares) {
      try {
        if (share.metadata && share.metadata.expiresAt) {
          const expiresAt = new Date(share.metadata.expiresAt)
          
          if (expiresAt < now) {
            // Track size if available
            if (share.metadata.size) {
              totalSize += share.metadata.size
            }
            
            // Delete expired share
            await storage.delete(share.shareId)
            deletedCount++
            console.log(`  ❌ Deleted expired: ${share.shareId} (expired ${expiresAt.toISOString()})`)
          } else {
            console.log(`  ✅ Valid: ${share.shareId} (expires ${expiresAt.toISOString()})`)
          }
        } else {
          console.log(`  ⚠️  Skipping: ${share.shareId} (no expiration metadata)`)
        }
      } catch (error) {
        errorCount++
        console.error(`  ⚠️  Error processing ${share.shareId}:`, error.message)
      }
    }

    console.log('\n📊 Cleanup Summary:')
    console.log(`  Total shares processed: ${shares.length}`)
    console.log(`  Deleted: ${deletedCount}`)
    console.log(`  Errors: ${errorCount}`)
    console.log(`  Space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log('✅ Cleanup complete!')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run cleanup
cleanupExpiredShares()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
