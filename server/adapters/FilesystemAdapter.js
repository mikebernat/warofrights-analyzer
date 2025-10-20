import { promises as fs } from 'fs'
import path from 'path'
import StorageAdapter from './StorageAdapter.js'

/**
 * Filesystem Storage Adapter
 * 
 * Stores shares as JSON files in the local filesystem.
 * Default storage method, no external dependencies required.
 */
class FilesystemAdapter extends StorageAdapter {
  constructor(baseDir) {
    super()
    this.baseDir = baseDir
  }

  /**
   * Get the file path for a share ID
   * @private
   */
  _getFilePath(shareId) {
    return path.join(this.baseDir, `${shareId}.json`)
  }

  /**
   * Ensure the storage directory exists
   * @private
   */
  async _ensureDirectory() {
    await fs.mkdir(this.baseDir, { recursive: true })
  }

  /**
   * Save a share to filesystem
   */
  async save(shareId, data) {
    await this._ensureDirectory()
    const filePath = this._getFilePath(shareId)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * Retrieve a share from filesystem
   */
  async get(shareId) {
    const filePath = this._getFilePath(shareId)
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Share not found')
      }
      throw error
    }
  }

  /**
   * Check if a share exists
   */
  async exists(shareId) {
    const filePath = this._getFilePath(shareId)
    
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Delete a share from filesystem
   */
  async delete(shareId) {
    const filePath = this._getFilePath(shareId)
    
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // Ignore if file doesn't exist
    }
  }

  /**
   * List all shares in the filesystem
   */
  async list() {
    await this._ensureDirectory()
    
    const files = await fs.readdir(this.baseDir)
    const shares = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const shareId = file.replace('.json', '')
      const filePath = this._getFilePath(shareId)

      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const data = JSON.parse(content)
        
        shares.push({
          shareId,
          metadata: data.metadata || {},
          filePath
        })
      } catch (error) {
        console.error(`Error reading share ${shareId}:`, error.message)
      }
    }

    return shares
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this._ensureDirectory()
    
    const files = await fs.readdir(this.baseDir)
    let totalSize = 0
    let count = 0

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const filePath = path.join(this.baseDir, file)
      
      try {
        const stats = await fs.stat(filePath)
        totalSize += stats.size
        count++
      } catch (error) {
        console.error(`Error getting stats for ${file}:`, error.message)
      }
    }

    return { count, totalSize }
  }
}

export default FilesystemAdapter
