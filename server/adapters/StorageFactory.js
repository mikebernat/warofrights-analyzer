import path from 'path'
import { fileURLToPath } from 'url'
import FilesystemAdapter from './FilesystemAdapter.js'
import S3Adapter from './S3Adapter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Storage Factory
 * 
 * Creates the appropriate storage adapter based on configuration.
 * Implements the Factory pattern for storage backend selection.
 */
class StorageFactory {
  /**
   * Create a storage adapter based on configuration
   * @param {Object} config - Storage configuration
   * @returns {StorageAdapter}
   */
  static create(config) {
    const storageType = config.type || 'filesystem'

    switch (storageType.toLowerCase()) {
      case 'filesystem':
      case 'fs':
        return StorageFactory.createFilesystemAdapter(config)

      case 's3':
      case 'aws':
        return StorageFactory.createS3Adapter(config)

      default:
        throw new Error(`Unknown storage type: ${storageType}`)
    }
  }

  /**
   * Create a filesystem storage adapter
   * @private
   */
  static createFilesystemAdapter(config) {
    const baseDir = config.path || path.join(__dirname, '../../sharedAnalysis')
    return new FilesystemAdapter(baseDir)
  }

  /**
   * Create an S3 storage adapter
   * @private
   */
  static createS3Adapter(config) {
    if (!config.bucket) {
      throw new Error('S3 storage requires a bucket name')
    }

    const s3Config = {
      bucket: config.bucket,
      prefix: config.prefix || 'shares/',
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      endpoint: config.endpoint || process.env.S3_ENDPOINT,
      forcePathStyle: config.forcePathStyle || false
    }

    // Add credentials if provided
    if (config.accessKeyId && config.secretAccessKey) {
      s3Config.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }

    return new S3Adapter(s3Config)
  }

  /**
   * Create adapter from environment variables
   * @returns {StorageAdapter}
   */
  static createFromEnv() {
    const storageType = process.env.STORAGE_TYPE || 'filesystem'

    const config = {
      type: storageType
    }

    if (storageType === 's3') {
      config.bucket = process.env.S3_BUCKET
      config.prefix = process.env.S3_PREFIX
      config.region = process.env.S3_REGION || process.env.AWS_REGION
      config.endpoint = process.env.S3_ENDPOINT
      config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true'
      config.accessKeyId = process.env.AWS_ACCESS_KEY_ID
      config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    } else {
      config.path = process.env.STORAGE_PATH
    }

    return StorageFactory.create(config)
  }
}

export default StorageFactory
