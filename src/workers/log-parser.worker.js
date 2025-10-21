import { expose } from 'comlink'
import parsingConfig from '../config/parsing-config.json'

class LogParser {
  constructor() {
    this.config = parsingConfig
  }

  /**
   * Extract regiment from player name using configured patterns
   */
  extractRegiment(playerName) {
    for (const pattern of this.config.regimentPatterns) {
      const regex = new RegExp(pattern.pattern, 'i') // Case insensitive
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
        
        // Normalize regiment name
        if (regiment) {
          regiment = this.normalizeRegiment(regiment, pattern.normalize)
        }
        
        return regiment
      }
    }
    return 'Uncategorized'
  }

  /**
   * Normalize regiment name by removing company designators and special characters
   */
  normalizeRegiment(regiment, normalizeType) {
    // Remove trailing company letters with optional dots (e.g., ".C", ".I", ".G")
    regiment = regiment.replace(/\.[A-Z](\*)?$/i, '')
    
    // Remove trailing asterisks
    regiment = regiment.replace(/\*+$/, '')
    
    // Remove standalone company letters at the end (e.g., "10thUS C" -> "10thUS")
    regiment = regiment.replace(/\s+[A-Z](\*)?$/i, '')
    
    // Apply specific normalization based on pattern
    if (normalizeType === 'removeSpaces') {
      regiment = regiment.replace(/\s+/g, '')
    }
    
    if (normalizeType === 'removeDash') {
      regiment = regiment.replace(/-/g, '')
    }
    
    if (normalizeType === 'removeDotSuffix') {
      // Remove dot and everything after it (e.g., 1stSC.OR -> 1stSC)
      regiment = regiment.replace(/\..+$/, '')
    }
    
    if (normalizeType === 'cleanCompanySuffix') {
      // Remove company suffixes
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
      // Truncate state abbreviations longer than 2 letters
      // Match pattern like "8ThOhio" and convert to "8thOH"
      regiment = regiment.replace(/(\d+(?:st|nd|rd|th)?)([A-Z][a-z]{2,})/i, (match, num, state) => {
        return num + state.substring(0, 2).toUpperCase()
      })
    }
    
    // Normalize spacing (remove all spaces)
    regiment = regiment.replace(/\s+/g, '')
    
    // Convert entire string to uppercase for consistent comparison
    regiment = regiment.toUpperCase()
    
    // Normalize ordinals to lowercase (e.g., "30TH" -> "30th", "1ST" -> "1st")
    regiment = regiment.replace(/(\d+)(ST|ND|RD|TH)/g, (match, num, ordinal) => {
      return num + ordinal.toLowerCase()
    })
    
    // Trim any remaining whitespace
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
   * Parse a single log file
   */
  async parseLog(logContent, onProgress) {
    const lines = logContent.split('\n')
    const events = []
    const warnings = []
    const playerSessions = [] // Track join/leave events
    
    let initialized = false
    let currentRound = null
    let roundCounter = 0
    let lastEventTime = null
    let currentMap = null
    let currentGameRules = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Report progress every 1000 lines
      if (i % 1000 === 0 && onProgress) {
        onProgress({ current: i, total: lines.length })
      }

      // Wait for initialization
      if (!initialized) {
        if (line.includes('[CWarOfRightsGame] Initialized')) {
          initialized = true
        }
        continue
      }

      const timestamp = this.parseTimestamp(line)
      if (!timestamp) continue

      // Track game rules
      if (line.includes('Game rules class:')) {
        const match = line.match(/Game rules class:\s*(\w+)/)
        if (match) {
          currentGameRules = match[1]
        }
      }

      // Track map changes
      if (line.includes('PrepareLevel')) {
        const match = line.match(/PrepareLevel\s+(\w+)/)
        if (match) {
          const newMap = match[1]
          
          // Close previous round if exists (map-bounded)
          if (currentRound && currentRound.map) {
            currentRound.endTime = lastEventTime || timestamp
            currentRound.status = 'Incomplete'
            warnings.push({
              type: 'incomplete',
              message: `Round ${currentRound.id} on ${currentRound.map} ended without victory (map change)`
            })
          }
          
          currentMap = newMap
          currentRound = null
        }
      }

      // Track round start
      if (line.includes('CGameRulesEventHelper::OnRoundStarted')) {
        // Close previous round if exists
        if (currentRound) {
          currentRound.endTime = lastEventTime || timestamp
          currentRound.status = 'Incomplete'
          warnings.push({
            type: 'incomplete',
            message: `Round ${currentRound.id} ended without victory (new round started)`
          })
        }

        roundCounter++
        currentRound = {
          id: roundCounter,
          startTime: timestamp,
          endTime: null,
          map: currentMap || 'Unknown Map',
          gameRules: currentGameRules,
          status: 'Incomplete',
          winner: null,
          respawns: []
        }
      }

      // Track victory
      if (line.includes('CGameRulesEventHelper::OnVictory')) {
        const match = line.match(/TeamID:\s*(\d+)/)
        if (match && currentRound) {
          currentRound.endTime = timestamp
          currentRound.status = 'Complete'
          const teamId = parseInt(match[1])
          currentRound.winner = teamId === 0 ? 'CSA' : teamId === 1 ? 'USA' : teamId === 2 ? 'USA' : 'Unknown'
        }
      }

      // Track player joins
      if (line.includes('has joined the server')) {
        const match = line.match(/Player (.+?) has joined the server/)
        if (match) {
          const playerName = match[1]
          playerSessions.push({
            player: playerName,
            action: 'join',
            time: timestamp,
            roundId: currentRound ? currentRound.id : null
          })
        }
      }

      // Track player leaves
      if (line.includes('has left the server')) {
        const match = line.match(/Player (.+?) has left the server/)
        if (match) {
          const playerName = match[1]
          playerSessions.push({
            player: playerName,
            action: 'leave',
            time: timestamp,
            roundId: currentRound ? currentRound.id : null
          })
        }
      }

      // Track respawns
      if (line.includes('[CPlayer::ClDoRespawn]')) {
        const match = line.match(/\[CPlayer::ClDoRespawn\]\s+"([^"]+)"/)
        if (match) {
          const playerName = match[1]
          const regiment = this.extractRegiment(playerName)
          
          // Skip respawns in the first 60 seconds of a round
          if (currentRound && (timestamp - currentRound.startTime) < 60) {
            continue
          }

          // Check for idle gap (pseudo-round creation)
          if (lastEventTime && (timestamp - lastEventTime) > this.config.idleGapSeconds) {
            // Close previous round
            if (currentRound) {
              currentRound.endTime = lastEventTime
              currentRound.status = 'Incomplete'
            }

            // Create pseudo-round
            roundCounter++
            currentRound = {
              id: roundCounter,
              startTime: timestamp,
              endTime: null,
              map: 'Unknown Map',
              gameRules: null,
              status: 'Pseudo',
              winner: null,
              respawns: []
            }
            
            warnings.push({
              type: 'pseudo',
              message: `Pseudo-round ${roundCounter} created after ${this.config.idleGapSeconds}s idle gap`
            })
          }

          // Create round if none exists
          if (!currentRound) {
            roundCounter++
            currentRound = {
              id: roundCounter,
              startTime: timestamp,
              endTime: null,
              map: currentMap || 'Unknown Map',
              gameRules: currentGameRules,
              status: 'Incomplete',
              winner: null,
              respawns: []
            }
          }

          const event = {
            time: timestamp,
            player: playerName,
            regiment: regiment,
            roundId: currentRound.id,
            map: currentRound.map
          }

          events.push(event)
          currentRound.respawns.push(event)
          lastEventTime = timestamp
        }
      }
    }

    // Close final round if incomplete
    if (currentRound && currentRound.status === 'Incomplete') {
      currentRound.endTime = lastEventTime || currentRound.startTime
      warnings.push({
        type: 'incomplete',
        message: `Round ${currentRound.id} ended without victory (end of log)`
      })
    }

    // Collect all rounds
    const rounds = []
    let tempRound = null
    
    for (const event of events) {
      if (!tempRound || tempRound.id !== event.roundId) {
        if (tempRound) rounds.push(tempRound)
        tempRound = {
          id: event.roundId,
          startTime: event.time,
          endTime: event.time,
          map: event.map,
          status: 'Incomplete',
          respawns: []
        }
      }
      tempRound.respawns.push(event)
      tempRound.endTime = event.time
    }
    if (tempRound) rounds.push(tempRound)

    if (onProgress) {
      onProgress({ current: lines.length, total: lines.length })
    }

    return {
      events,
      rounds,
      warnings,
      playerSessions,
      stats: {
        totalRespawns: events.length,
        totalRounds: rounds.length,
        maps: [...new Set(events.map(e => e.map))],
        players: [...new Set(events.map(e => e.player))].length,
        regiments: [...new Set(events.map(e => e.regiment))].length
      }
    }
  }
}

const parser = new LogParser()
expose(parser)
