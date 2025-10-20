/**
 * Storage Adapter Interface
 * 
 * Defines the contract that all storage adapters must implement.
 * This allows for pluggable storage backends (filesystem, S3, etc.)
 */
class StorageAdapter {
  /**
   * Save a share to storage
   * @param {string} shareId - Unique identifier for the share
   * @param {Object} data - The share data to store
   * @returns {Promise<void>}
   */
  async save(shareId, data) {
    throw new Error('save() must be implemented by subclass')
  }

  /**
   * Retrieve a share from storage
   * @param {string} shareId - Unique identifier for the share
   * @returns {Promise<Object>} The share data
   * @throws {Error} If share not found
   */
  async get(shareId) {
    throw new Error('get() must be implemented by subclass')
  }

  /**
   * Check if a share exists
   * @param {string} shareId - Unique identifier for the share
   * @returns {Promise<boolean>}
   */
  async exists(shareId) {
    throw new Error('exists() must be implemented by subclass')
  }

  /**
   * Delete a share from storage
   * @param {string} shareId - Unique identifier for the share
   * @returns {Promise<void>}
   */
  async delete(shareId) {
    throw new Error('delete() must be implemented by subclass')
  }

  /**
   * List all shares (for cleanup operations)
   * @returns {Promise<Array<{shareId: string, metadata: Object}>>}
   */
  async list() {
    throw new Error('list() must be implemented by subclass')
  }

  /**
   * Get storage statistics
   * @returns {Promise<{count: number, totalSize: number}>}
   */
  async getStats() {
    throw new Error('getStats() must be implemented by subclass')
  }
}

export default StorageAdapter
