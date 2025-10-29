import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { watch } from 'fs'
import { stat, open } from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.LIVE_MONITOR_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Track active file watchers
const activeWatchers = new Map()

/**
 * WebSocket connection handler
 */
wss.on('connection', (ws) => {
  console.log('Client connected')
  
  let fileWatcher = null
  let watchedFilePath = null
  let lastPosition = 0

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      switch (data.type) {
        case 'start':
          await handleStart(ws, data)
          break
        case 'stop':
          handleStop()
          break
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
      }
    } catch (error) {
      console.error('Error handling message:', error)
      ws.send(JSON.stringify({ type: 'error', message: error.message }))
    }
  })

  /**
   * Start monitoring a file
   */
  async function handleStart(ws, data) {
    const { filePath } = data
    
    if (!filePath) {
      ws.send(JSON.stringify({ type: 'error', message: 'File path is required' }))
      return
    }

    // Stop any existing watcher
    handleStop()

    try {
      // Validate file exists
      const fileStats = await stat(filePath)
      if (!fileStats.isFile()) {
        throw new Error('Path is not a file')
      }

      watchedFilePath = filePath
      lastPosition = 0

      // Send initial file content
      await sendFileContent(ws, filePath, 0)

      // Watch for file changes
      fileWatcher = watch(filePath, async (eventType) => {
        if (eventType === 'change') {
          try {
            const currentStats = await stat(filePath)
            const currentSize = currentStats.size

            if (currentSize > lastPosition) {
              // File has grown, send new content
              await sendFileContent(ws, filePath, lastPosition, currentSize)
            } else if (currentSize < lastPosition) {
              // File was truncated or replaced
              console.log('File was reset, sending full content')
              lastPosition = 0
              await sendFileContent(ws, filePath, 0)
            }
          } catch (error) {
            console.error('Error reading file changes:', error)
            ws.send(JSON.stringify({ type: 'error', message: error.message }))
          }
        }
      })

      ws.send(JSON.stringify({ 
        type: 'started', 
        filePath,
        message: 'Monitoring started successfully' 
      }))

      console.log('Started monitoring:', filePath)
    } catch (error) {
      console.error('Error starting monitor:', error)
      ws.send(JSON.stringify({ type: 'error', message: error.message }))
    }
  }

  /**
   * Send file content from a specific position
   */
  async function sendFileContent(ws, filePath, start, end = null) {
    try {
      const fileHandle = await open(filePath, 'r')
      const stats = await fileHandle.stat()
      const endPosition = end || stats.size

      if (start >= endPosition) {
        await fileHandle.close()
        return
      }

      const buffer = Buffer.allocUnsafe(endPosition - start)
      await fileHandle.read(buffer, 0, buffer.length, start)
      await fileHandle.close()

      const content = buffer.toString('utf8')
      
      ws.send(JSON.stringify({
        type: 'update',
        content,
        start,
        end: endPosition,
        size: stats.size
      }))

      lastPosition = endPosition
    } catch (error) {
      console.error('Error reading file:', error)
      ws.send(JSON.stringify({ type: 'error', message: error.message }))
    }
  }

  /**
   * Stop monitoring
   */
  function handleStop() {
    if (fileWatcher) {
      fileWatcher.close()
      fileWatcher = null
      console.log('Stopped monitoring:', watchedFilePath)
      watchedFilePath = null
      lastPosition = 0
    }
  }

  ws.on('close', () => {
    console.log('Client disconnected')
    handleStop()
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    handleStop()
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: wss.clients.size
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🔴 Live Monitor Server running on port ${PORT}`)
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
})
