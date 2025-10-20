import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import StorageAdapter from './StorageAdapter.js'

/**
 * S3 Storage Adapter
 * 
 * Stores shares in AWS S3 (or S3-compatible storage like MinIO, DigitalOcean Spaces).
 * Requires AWS SDK and proper credentials configuration.
 */
class S3Adapter extends StorageAdapter {
  constructor(config) {
    super()
    
    this.bucket = config.bucket
    this.prefix = config.prefix || 'shares/'
    this.region = config.region || 'us-east-1'
    
    // Initialize S3 client
    this.client = new S3Client({
      region: this.region,
      credentials: config.credentials ? {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey
      } : undefined,
      endpoint: config.endpoint, // For S3-compatible services
      forcePathStyle: config.forcePathStyle || false // Required for MinIO
    })
  }

  /**
   * Get the S3 key for a share ID
   * @private
   */
  _getKey(shareId) {
    return `${this.prefix}${shareId}.json`
  }

  /**
   * Convert stream to string
   * @private
   */
  async _streamToString(stream) {
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf-8')
  }

  /**
   * Save a share to S3
   */
  async save(shareId, data) {
    const key = this._getKey(shareId)
    const body = JSON.stringify(data, null, 2)

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      Metadata: {
        shareId,
        createdAt: data.metadata?.createdAt || new Date().toISOString(),
        expiresAt: data.metadata?.expiresAt || ''
      }
    })

    await this.client.send(command)
  }

  /**
   * Retrieve a share from S3
   */
  async get(shareId) {
    const key = this._getKey(shareId)

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      })

      const response = await this.client.send(command)
      const content = await this._streamToString(response.Body)
      return JSON.parse(content)
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new Error('Share not found')
      }
      throw error
    }
  }

  /**
   * Check if a share exists in S3
   */
  async exists(shareId) {
    const key = this._getKey(shareId)

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      })

      await this.client.send(command)
      return true
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Delete a share from S3
   */
  async delete(shareId) {
    const key = this._getKey(shareId)

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })

      await this.client.send(command)
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        // Ignore if object doesn't exist
        return
      }
      throw error
    }
  }

  /**
   * List all shares in S3
   */
  async list() {
    const shares = []
    let continuationToken = undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
        ContinuationToken: continuationToken
      })

      const response = await this.client.send(command)

      if (response.Contents) {
        for (const object of response.Contents) {
          const key = object.Key
          if (!key.endsWith('.json')) continue

          const shareId = key
            .replace(this.prefix, '')
            .replace('.json', '')

          try {
            // Get metadata from object
            const headCommand = new HeadObjectCommand({
              Bucket: this.bucket,
              Key: key
            })
            const headResponse = await this.client.send(headCommand)

            shares.push({
              shareId,
              metadata: {
                createdAt: headResponse.Metadata?.createdat || '',
                expiresAt: headResponse.Metadata?.expiresat || '',
                size: object.Size,
                lastModified: object.LastModified
              },
              key
            })
          } catch (error) {
            console.error(`Error getting metadata for ${shareId}:`, error.message)
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return shares
  }

  /**
   * Get storage statistics from S3
   */
  async getStats() {
    let totalSize = 0
    let count = 0
    let continuationToken = undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
        ContinuationToken: continuationToken
      })

      const response = await this.client.send(command)

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key.endsWith('.json')) {
            totalSize += object.Size || 0
            count++
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return { count, totalSize }
  }
}

export default S3Adapter
