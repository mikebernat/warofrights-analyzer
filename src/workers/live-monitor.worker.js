import { expose } from 'comlink'
import parsingConfig from '../config/parsing-config.json'

/**
 * Live monitoring worker for incremental log parsing
 * Maintains parser state between updates to efficiently process only new log entries
 */
class LiveMonitorParser {
  constructor() {
    this.config = parsingConfig
    this.reset()
  }

  /**
   * Reset parser state
   */
  reset() {
    this.initialized = false
    this.currentRound = null
    this.roundCounter = 0
    this.lastEventTime = null
    this.currentMap = null
    this.currentGameRules = null
    this.lastProcessedPosition = 0
    this.lineBuffer = '' // Buffer for incomplete lines
    this.allEvents = []
    this.allRounds = []
    this.allWarnings = []
    this.allPlayerSessions = []
  }

  /**
   * Extract regiment from player name using configured patterns
   */
  extractRegiment(playerName) {
    for (const pattern of this.config.regimentPatterns) {
      const regex = new RegExp(pattern.pattern, 'i')
      const match = playerName.match(regex)
      if (match) {
        const extractGroup = pattern.extractGroup || 1
        let regiment = match[extractGroup]?.trim() || match[1]?.trim()
        
        // Special handling for clan extraction patterns
        if (pattern.normalize === 'extractCB') {
          regiment = 'CB'
        } else if (pattern.normalize === 'extractCQB') {
          regiment = 'CQB'
        } else if (pattern.normalize === 'extractTKO') {
          regiment = 'TKO'
        } else if (pattern.normalize === 'extractJD') {
          regiment = 'JD'
        } else if (pattern.normalize === 'extractV') {
          regiment = 'V'
        }
        
        if (regiment) {
          regiment = this.normalizeRegiment(regiment, pattern.normalize)
        }
        
        return regiment
      }
    }
    return 'Uncategorized'
  }

  /**
   * Normalize regiment name
   */
  normalizeRegiment(regiment, normalizeType) {
    regiment = regiment.replace(/\.[A-Z](\*)?$/i, '')
    regiment = regiment.replace(/\*+$/, '')
    regiment = regiment.replace(/\s+[A-Z](\*)?$/i, '')
    
    if (normalizeType === 'removeSpaces') {
      regiment = regiment.replace(/\s+/g, '')
    }
    
    if (normalizeType === 'removeDash') {
      regiment = regiment.replace(/-/g, '')
    }
    
    if (normalizeType === 'removeDotSuffix') {
      regiment = regiment.replace(/\..+$/, '')
    }
    
    if (normalizeType === 'cleanCompanySuffix') {
      regiment = regiment.replace(/\.CAV$/i, '')
      regiment = regiment.replace(/\.Cav$/i, '')
      regiment = regiment.replace(/\.WA$/i, '')
      regiment = regiment.replace(/\.\(LB\)$/i, '')
      regiment = regiment.replace(/\(LB\)$/i, '')
      regiment = regiment.replace(/\{[A-Z]\}$/i, '')
      regiment = regiment.replace(/\{[A-Z]{2}\}$/i, '')
      regiment = regiment.replace(/\[[A-Z]\]$/i, '')
      regiment = regiment.replace(/\.[A-Z]{1,3}$/i, '')
    }
    
    if (normalizeType === 'truncateState') {
      regiment = regiment.replace(/(\d+(?:st|nd|rd|th)?)([A-Z][a-z]{2,})/i, (match, num, state) => {
        return num + state.substring(0, 2).toUpperCase()
      })
    }
    
    regiment = regiment.replace(/\s+/g, '')
    regiment = regiment.toUpperCase()
    regiment = regiment.replace(/(\d+)(ST|ND|RD|TH)/g, (match, num, ordinal) => {
      return num + ordinal.toLowerCase()
    })
    regiment = regiment.trim()
    
    return regiment
  }

  /**
   * Parse timestamp from log line
   */
  parseTimestamp(line) {
    const match = line.match(/<(\d{2}):(\d{2}):(\d{2})>/)
    if (match) {
      const hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const seconds = parseInt(match[3])
      return hours * 3600 + minutes * 60 + seconds
    }
    return null
  }

  /**
   * Process a single line of log data
   */
  processLine(line) {
    const newEvents = []
    const newWarnings = []
    const newPlayerSessions = []

    // Wait for initialization
    if (!this.initialized) {
      if (line.includes('[CWarOfRightsGame] Initialized')) {
        this.initialized = true
      }
      return { newEvents, newWarnings, newPlayerSessions }
    }

    const timestamp = this.parseTimestamp(line)
    if (!timestamp) return { newEvents, newWarnings, newPlayerSessions }

    // Track game rules
    if (line.includes('Game rules class:')) {
      const match = line.match(/Game rules class:\s*(\w+)/)
      if (match) {
        this.currentGameRules = match[1]
      }
    }

    // Track map changes
    if (line.includes('PrepareLevel')) {
      const match = line.match(/PrepareLevel\s+(\w+)/)
      if (match) {
        const newMap = match[1]
        
        if (this.currentRound && this.currentRound.map) {
          this.currentRound.endTime = this.lastEventTime || timestamp
          this.currentRound.status = 'Incomplete'
          newWarnings.push({
            type: 'incomplete',
            message: `Round ${this.currentRound.id} on ${this.currentRound.map} ended without victory (map change)`
          })
        }
        
        this.currentMap = newMap
        this.currentRound = null
      }
    }

    // Track round start
    if (line.includes('CGameRulesEventHelper::OnRoundStarted')) {
      if (this.currentRound) {
        this.currentRound.endTime = this.lastEventTime || timestamp
        this.currentRound.status = 'Incomplete'
        newWarnings.push({
          type: 'incomplete',
          message: `Round ${this.currentRound.id} ended without victory (new round started)`
        })
      }

      this.roundCounter++
      this.currentRound = {
        id: this.roundCounter,
        startTime: timestamp,
        endTime: null,
        map: this.currentMap || 'Unknown Map',
        gameRules: this.currentGameRules,
        status: 'Incomplete',
        winner: null,
        respawns: []
      }
      this.allRounds.push(this.currentRound)
    }

    // Track victory
    if (line.includes('CGameRulesEventHelper::OnVictory')) {
      const match = line.match(/TeamID:\s*(\d+)/)
      if (match && this.currentRound) {
        this.currentRound.endTime = timestamp
        this.currentRound.status = 'Complete'
        const teamId = parseInt(match[1])
        this.currentRound.winner = teamId === 0 ? 'CSA' : teamId === 1 ? 'USA' : teamId === 2 ? 'USA' : 'Unknown'
      }
    }

    // Track player joins
    if (line.includes('has joined the server')) {
      const match = line.match(/Player (.+?) has joined the server/)
      if (match) {
        const playerName = match[1]
        const session = {
          player: playerName,
          action: 'join',
          time: timestamp,
          roundId: this.currentRound ? this.currentRound.id : null
        }
        newPlayerSessions.push(session)
        this.allPlayerSessions.push(session)
      }
    }

    // Track player leaves
    if (line.includes('has left the server')) {
      const match = line.match(/Player (.+?) has left the server/)
      if (match) {
        const playerName = match[1]
        const session = {
          player: playerName,
          action: 'leave',
          time: timestamp,
          roundId: this.currentRound ? this.currentRound.id : null
        }
        newPlayerSessions.push(session)
        this.allPlayerSessions.push(session)
      }
    }

    // Track respawns
    if (line.includes('[CPlayer::ClDoRespawn]')) {
      const match = line.match(/\[CPlayer::ClDoRespawn\]\s+"([^"]+)"/)
      if (match) {
        const playerName = match[1]
        const regiment = this.extractRegiment(playerName)
        
        // Skip respawns in the first 60 seconds of a round
        if (this.currentRound && (timestamp - this.currentRound.startTime) < 60) {
          return { newEvents, newWarnings, newPlayerSessions }
        }

        // Check for idle gap (pseudo-round creation)
        if (this.lastEventTime && (timestamp - this.lastEventTime) > this.config.idleGapSeconds) {
          if (this.currentRound) {
            this.currentRound.endTime = this.lastEventTime
            this.currentRound.status = 'Incomplete'
          }

          this.roundCounter++
          this.currentRound = {
            id: this.roundCounter,
            startTime: timestamp,
            endTime: null,
            map: 'Unknown Map',
            gameRules: null,
            status: 'Pseudo',
            winner: null,
            respawns: []
          }
          this.allRounds.push(this.currentRound)
          
          newWarnings.push({
            type: 'pseudo',
            message: `Pseudo-round ${this.roundCounter} created after ${this.config.idleGapSeconds}s idle gap`
          })
        }

        // Create round if none exists
        if (!this.currentRound) {
          this.roundCounter++
          this.currentRound = {
            id: this.roundCounter,
            startTime: timestamp,
            endTime: null,
            map: this.currentMap || 'Unknown Map',
            gameRules: this.currentGameRules,
            status: 'Incomplete',
            winner: null,
            respawns: []
          }
          this.allRounds.push(this.currentRound)
        }

        const event = {
          time: timestamp,
          player: playerName,
          regiment: regiment,
          roundId: this.currentRound.id,
          map: this.currentRound.map
        }

        newEvents.push(event)
        this.allEvents.push(event)
        this.currentRound.respawns.push(event)
        this.lastEventTime = timestamp
      }
    }

    return { newEvents, newWarnings, newPlayerSessions }
  }

  /**
   * Process a chunk of new log data incrementally
   * @param {string} chunk - New log data to process
   * @returns {Object} - New events, warnings, and updated stats
   */
  processChunk(chunk) {
    // Combine with any buffered incomplete line
    const fullText = this.lineBuffer + chunk
    const lines = fullText.split('\n')
    
    // Keep the last line in buffer if it doesn't end with newline
    if (!chunk.endsWith('\n')) {
      this.lineBuffer = lines.pop() || ''
    } else {
      this.lineBuffer = ''
    }

    const newEvents = []
    const newWarnings = []
    const newPlayerSessions = []

    // Process each complete line
    for (const line of lines) {
      if (!line.trim()) continue
      
      const result = this.processLine(line)
      newEvents.push(...result.newEvents)
      newWarnings.push(...result.newWarnings)
      newPlayerSessions.push(...result.newPlayerSessions)
    }

    // Update accumulated warnings
    this.allWarnings.push(...newWarnings)

    // Calculate current stats
    const stats = {
      totalRespawns: this.allEvents.length,
      totalRounds: this.allRounds.length,
      maps: [...new Set(this.allEvents.map(e => e.map))],
      players: [...new Set(this.allEvents.map(e => e.player))].length,
      regiments: [...new Set(this.allEvents.map(e => e.regiment))].length
    }

    return {
      newEvents,
      newWarnings,
      newPlayerSessions,
      stats,
      totalEvents: this.allEvents.length,
      totalRounds: this.allRounds.length
    }
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      events: this.allEvents,
      rounds: this.allRounds,
      warnings: this.allWarnings,
      playerSessions: this.allPlayerSessions,
      stats: {
        totalRespawns: this.allEvents.length,
        totalRounds: this.allRounds.length,
        maps: [...new Set(this.allEvents.map(e => e.map))],
        players: [...new Set(this.allEvents.map(e => e.player))].length,
        regiments: [...new Set(this.allEvents.map(e => e.regiment))].length
      }
    }
  }
}

const liveMonitor = new LiveMonitorParser()
expose(liveMonitor)
