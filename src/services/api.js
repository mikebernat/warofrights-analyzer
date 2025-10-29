import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const shareAPI = {
  /**
   * Create a new shared analysis
   * @param {Object} analysis - The analysis data to share
   * @returns {Promise<{shareId: string, expiresAt: string}>}
   */
  async createShare(analysis) {
    const response = await api.post('/share', { analysis })
    return response.data
  },

  /**
   * Retrieve a shared analysis by ID
   * @param {string} shareId - The share ID
   * @returns {Promise<Object>} The shared analysis data
   */
  async getShare(shareId) {
    const response = await api.get(`/share/${shareId}`)
    return response.data
  },

  /**
   * Check API health
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  }
}

export default api
