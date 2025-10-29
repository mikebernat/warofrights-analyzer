import { defineStore } from 'pinia'
import { wrap, proxy } from 'comlink'
import parsingConfig from '../config/parsing-config.json'

// Store worker outside of reactive state to prevent circular reference issues
let liveMonitorWorker = null
let liveMonitorParser = null

export const useLogStore = defineStore('log', {
  state: () => ({
    // Raw data
    events: [],
    rounds: [],
    warnings: [],
    stats: null,
    playerSessions: [], // Track player join/leave events
    chatMessages: [], // Track team chat messages
    
    // UI state
    loading: false,
    progress: 0,
    fileName: null,
    
    // Filters
    timeRange: [0, 86400], // Default to full day in seconds
    filterText: '',
    selectedRoundId: null, // null means all rounds
    
    // Team assignments per round
    regimentTeams: {}, // { roundId: { regimentName: 'USA' | 'CSA' } }
    
    // Manual reassignments tracking
    manualReassignments: [], // Array of { playerName, originalRegiment, newRegiment, timestamp, playerNamePattern }
    
    // Cached data
    lastParsedLog: null,
    
    // Live monitoring state
    isLiveMonitoring: false
  }),

  getters: {
    // Get filtered events based on time range, filter text, and selected round
    filteredEvents: (state) => {
      let filtered = state.events

      // Filter by selected round if one is selected
      if (state.selectedRoundId !== null) {
        filtered = filtered.filter(event => event.roundId === state.selectedRoundId)
      }

      // Filter by time range
      filtered = filtered.filter(event => {
        return event.time >= state.timeRange[0] && event.time <= state.timeRange[1]
      })

      // Filter by search text
      if (state.filterText) {
        const searchText = state.filterText.toLowerCase()
        filtered = filtered.filter(event => {
          return event.player.toLowerCase().includes(searchText) ||
                 event.regiment.toLowerCase().includes(searchText)
        })
      }

      return filtered
    },

    // Get time bounds from actual data (filtered by selected round)
    timeBounds: (state) => {
      let events = state.events
      
      // Filter by selected round if one is selected
      if (state.selectedRoundId !== null) {
        events = events.filter(event => event.roundId === state.selectedRoundId)
      }
      
      if (events.length === 0) {
        return [0, 86400]
      }
      const times = events.map(e => e.time)
      return [Math.min(...times), Math.max(...times)]
    },

    // Get the start time offset for relative time display
    timeOffset: (state) => {
      let events = state.events
      
      // Filter by selected round if one is selected
      if (state.selectedRoundId !== null) {
        events = events.filter(event => event.roundId === state.selectedRoundId)
      }
      
      if (events.length === 0) {
        return 0
      }
      const times = events.map(e => e.time)
      return Math.min(...times)
    },

    // Get respawns over time (for line chart) - uses filteredEvents
    respawnsOverTime() {
      return this.filteredEvents
    },

    // Get top regiments by respawn count
    topRegiments() {
      const regimentCounts = {}
      this.filteredEvents.forEach(event => {
        regimentCounts[event.regiment] = (regimentCounts[event.regiment] || 0) + 1
      })

      return Object.entries(regimentCounts)
        .map(([regiment, count]) => ({ regiment, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },

    // Get top players by respawn count
    topPlayers() {
      const playerData = {}
      this.filteredEvents.forEach(event => {
        if (!playerData[event.player]) {
          playerData[event.player] = {
            player: event.player,
            regiment: event.regiment,
            count: 0
          }
        }
        playerData[event.player].count++
      })

      return Object.values(playerData)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },

    // Get regiment respawns over time (for multi-line chart)
    regimentTimeline() {
      const toProcess = this.filteredEvents

      // Get all regiments sorted by respawn count
      const regimentCounts = {}
      toProcess.forEach(event => {
        regimentCounts[event.regiment] = (regimentCounts[event.regiment] || 0) + 1
      })

      const sortedRegiments = Object.entries(regimentCounts)
        .sort((a, b) => b[1] - a[1])

      // Mark top 5 regiments
      const top5Regiments = sortedRegiments.slice(0, 5).map(([regiment]) => regiment)

      // Build timeline for all regiments
      return sortedRegiments.map(([regiment], index) => {
        const regimentEvents = toProcess
          .filter(e => e.regiment === regiment)
          .sort((a, b) => a.time - b.time)

        return {
          regiment,
          data: regimentEvents.map(e => ({ time: e.time, count: 1 })),
          isTop5: top5Regiments.includes(regiment)
        }
      })
    },

    // Get total respawn count (filtered)
    totalRespawns() {
      return this.filteredEvents.length
    },

    // Get filtered stats based on current filters
    filteredStats() {
      const events = this.filteredEvents
      const uniquePlayers = new Set(events.map(e => e.player))
      const uniqueRegiments = new Set(events.map(e => e.regiment))
      const uniqueMaps = new Set(events.map(e => e.map))
      const uniqueRounds = new Set(events.map(e => e.roundId))
      
      return {
        players: uniquePlayers.size,
        regiments: uniqueRegiments.size,
        totalRounds: uniqueRounds.size,
        maps: Array.from(uniqueMaps)
      }
    }
  },

  actions: {
    async parseLogFile(file) {
      this.loading = true
      this.progress = 0
      this.fileName = file.name

      try {
        const content = await file.text()
        
        // Create worker
        const Worker = await import('../workers/log-parser.worker.js?worker')
        const worker = new Worker.default()
        const parser = wrap(worker)

        // Parse with progress callback wrapped in proxy for Web Worker communication
        const result = await parser.parseLog(content, proxy((progressData) => {
          this.progress = Math.round((progressData.current / progressData.total) * 100)
        }))

        // Update state
        this.events = result.events
        this.rounds = result.rounds
        this.warnings = result.warnings
        this.stats = result.stats
        this.playerSessions = result.playerSessions || []
        this.chatMessages = result.chatMessages || []

        // Set initial time range to data bounds
        if (result.events.length > 0) {
          const times = result.events.map(e => e.time)
          this.timeRange = [Math.min(...times), Math.max(...times)]
        }

        // Cache to localStorage
        this.cacheToLocalStorage({
          events: result.events,
          rounds: result.rounds,
          warnings: result.warnings,
          stats: result.stats,
          playerSessions: result.playerSessions,
          fileName: file.name,
          timestamp: Date.now()
        })

        worker.terminate()
      } catch (error) {
        console.error('Error parsing log:', error)
        throw error
      } finally {
        this.loading = false
        this.progress = 0
      }
    },

    setTimeRange(range) {
      this.timeRange = range
    },

    setFilterText(text) {
      this.filterText = text
    },

    setSelectedRound(roundId) {
      this.selectedRoundId = roundId
      
      // Update time range to match the selected round's bounds
      if (roundId !== null) {
        const roundEvents = this.events.filter(e => e.roundId === roundId)
        if (roundEvents.length > 0) {
          const times = roundEvents.map(e => e.time)
          this.timeRange = [Math.min(...times), Math.max(...times)]
        }
      } else {
        // Reset to full data bounds when no round is selected
        if (this.events.length > 0) {
          const times = this.events.map(e => e.time)
          this.timeRange = [Math.min(...times), Math.max(...times)]
        }
      }
    },

    cacheToLocalStorage(data) {
      try {
        localStorage.setItem('wor-log-cache', JSON.stringify(data))
      } catch (error) {
        console.error('Error caching to localStorage:', error)
      }
    },

    loadFromCache() {
      try {
        const cached = localStorage.getItem('wor-log-cache')
        if (cached) {
          const data = JSON.parse(cached)
          this.events = data.events
          this.rounds = data.rounds
          this.warnings = data.warnings
          this.stats = data.stats
          this.playerSessions = data.playerSessions || []
          this.fileName = data.fileName
          this.lastParsedLog = data.timestamp
          this.regimentTeams = data.regimentTeams || {}
          this.manualReassignments = data.manualReassignments || []

          // Set initial time range
          if (data.events.length > 0) {
            const times = data.events.map(e => e.time)
            this.timeRange = [Math.min(...times), Math.max(...times)]
          }

          return true
        }
      } catch (error) {
        console.error('Error loading from cache:', error)
      }
      return false
    },

    clearCache() {
      localStorage.removeItem('wor-log-cache')
      this.events = []
      this.rounds = []
      this.warnings = []
      this.stats = null
      this.playerSessions = []
      this.fileName = null
      this.lastParsedLog = null
      this.timeRange = [0, 86400]
      this.filterText = ''
      this.selectedRoundId = null
      this.regimentTeams = {}
      this.manualReassignments = []
    },

    exportCSV() {
      // Combine respawn events and player session events
      const allEvents = []
      
      // Add respawn events
      this.events.forEach(event => {
        allEvents.push({
          time: event.time,
          player: event.player,
          regiment: event.regiment,
          roundId: event.roundId,
          map: event.map,
          event: 'respawn'
        })
      })
      
      // Add player session events (joins/leaves)
      if (this.playerSessions) {
        this.playerSessions.forEach(session => {
          // Try to find regiment from respawn events for this player
          const playerRespawn = this.events.find(e => e.player === session.player)
          const regiment = playerRespawn ? playerRespawn.regiment : 'Unknown'
          const round = this.rounds.find(r => r.id === session.roundId)
          allEvents.push({
            time: session.time,
            player: session.player,
            regiment: regiment,
            roundId: session.roundId || 'N/A',
            map: round ? round.map : 'Unknown',
            event: session.action === 'join' ? 'joined' : 'disconnected'
          })
        })
      }
      
      // Sort by time
      allEvents.sort((a, b) => a.time - b.time)
      
      // Filter by selected round
      let filteredEvents = allEvents
      if (this.selectedRoundId !== null) {
        filteredEvents = allEvents.filter(event => event.roundId === this.selectedRoundId)
      }
      
      // Filter by time range
      const [startTime, endTime] = this.timeRange
      filteredEvents = filteredEvents.filter(event => 
        event.time >= startTime && event.time <= endTime
      )
      
      // Filter by search term
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase()
        filteredEvents = filteredEvents.filter(event =>
          event.player.toLowerCase().includes(searchLower) ||
          event.regiment.toLowerCase().includes(searchLower)
        )
      }
      
      // Create CSV
      const headers = ['Time', 'Player', 'Regiment', 'RoundID', 'Map', 'Event']
      const rows = filteredEvents.map(event => [
        this.formatTime(event.time),
        event.player,
        event.regiment,
        event.roundId,
        event.map,
        event.event
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Include round and filter info in filename
      let filename = 'wor-log-export'
      if (this.selectedRoundId !== null) {
        filename += `-round${this.selectedRoundId}`
      }
      filename += `-${Date.now()}.csv`
      
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },

    formatTime(seconds, relative = true) {
      // Convert to relative time if requested
      const adjustedSeconds = relative ? seconds - this.timeOffset : seconds
      
      const hours = Math.floor(adjustedSeconds / 3600)
      const minutes = Math.floor((adjustedSeconds % 3600) / 60)
      const secs = adjustedSeconds % 60
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    },

    /**
     * Calculate player presence time for a specific round
     * @param {string} playerName - Name of the player
     * @param {number} roundId - ID of the round (null for all rounds)
     * @returns {Object} - { totalSeconds, percentage, formattedTime }
     */
    getPlayerPresenceTime(playerName, roundId = null) {
      // Get round bounds
      let roundStart, roundEnd
      
      if (roundId !== null) {
        const round = this.rounds.find(r => r.id === roundId)
        if (!round) return { totalSeconds: 0, percentage: 0, formattedTime: '00:00:00' }
        roundStart = round.startTime
        roundEnd = round.endTime
      } else {
        // Use overall time bounds
        if (this.events.length === 0) return { totalSeconds: 0, percentage: 0, formattedTime: '00:00:00' }
        const times = this.events.map(e => e.time)
        roundStart = Math.min(...times)
        roundEnd = Math.max(...times)
      }
      
      const roundDuration = roundEnd - roundStart
      if (roundDuration === 0) return { totalSeconds: 0, percentage: 0, formattedTime: '00:00:00' }
      
      // Get player's join/leave events for this round
      const playerEvents = this.playerSessions
        .filter(s => s.player === playerName && (roundId === null || s.roundId === roundId))
        .sort((a, b) => a.time - b.time)
      
      // Check if player has any respawns in this round (means they were present before round start)
      const hasRespawns = this.events.some(e => 
        e.player === playerName && (roundId === null || e.roundId === roundId)
      )
      
      let totalPresenceTime = 0
      let currentJoinTime = null
      
      // If player has respawns but no join event, assume they were present at round start
      if (hasRespawns && playerEvents.length === 0) {
        totalPresenceTime = roundDuration
      } else if (hasRespawns && playerEvents.length > 0 && playerEvents[0].action === 'leave') {
        // Player was present at start, first event is a leave
        currentJoinTime = roundStart
      }
      
      // Process join/leave events
      for (const event of playerEvents) {
        if (event.action === 'join') {
          currentJoinTime = Math.max(event.time, roundStart)
        } else if (event.action === 'leave' && currentJoinTime !== null) {
          const leaveTime = Math.min(event.time, roundEnd)
          totalPresenceTime += leaveTime - currentJoinTime
          currentJoinTime = null
        }
      }
      
      // If player joined but never left, count until round end
      if (currentJoinTime !== null) {
        totalPresenceTime += roundEnd - currentJoinTime
      }
      
      const percentage = Math.round((totalPresenceTime / roundDuration) * 100)
      const hours = Math.floor(totalPresenceTime / 3600)
      const minutes = Math.floor((totalPresenceTime % 3600) / 60)
      const seconds = totalPresenceTime % 60
      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      
      return {
        totalSeconds: totalPresenceTime,
        percentage,
        formattedTime
      }
    },

    applyRegimentReassignments(reassignments) {
      // reassignments is an object: { playerName: newRegiment }
      
      // First, track the reassignments before modifying events
      Object.entries(reassignments).forEach(([playerName, newRegiment]) => {
        // Find the player's current regiment from their first event
        const playerEvent = this.events.find(e => e.player === playerName)
        if (playerEvent) {
          const originalRegiment = playerEvent.regiment
          
          // Track manual reassignment if it's a change
          if (originalRegiment !== newRegiment) {
            // Check if this reassignment already exists
            const existingIndex = this.manualReassignments.findIndex(
              r => r.playerName === playerName
            )
            
            if (existingIndex >= 0) {
              // Update existing reassignment
              this.manualReassignments[existingIndex] = {
                playerName,
                originalRegiment: this.manualReassignments[existingIndex].originalRegiment, // Keep original
                newRegiment,
                timestamp: new Date().toISOString(),
                playerNamePattern: this.analyzePlayerNamePattern(playerName)
              }
            } else {
              // Add new reassignment
              this.manualReassignments.push({
                playerName,
                originalRegiment,
                newRegiment,
                timestamp: new Date().toISOString(),
                playerNamePattern: this.analyzePlayerNamePattern(playerName)
              })
            }
          }
        }
      })
      
      // Then apply the changes to all events
      this.events.forEach(event => {
        if (reassignments[event.player]) {
          event.regiment = reassignments[event.player]
        }
      })
      
      // Update cache with modified data
      this.cacheToLocalStorage({
        events: this.events,
        rounds: this.rounds,
        warnings: this.warnings,
        stats: this.stats,
        fileName: this.fileName,
        manualReassignments: this.manualReassignments
      })
    },
    
    analyzePlayerNamePattern(playerName) {
      // Analyze the player name to extract patterns
      return {
        patterns: {
          hasBrackets: /\[/.test(playerName),
          hasBraces: /\{/.test(playerName),
          hasParens: /\(/.test(playerName),
          hasPipe: /\|/.test(playerName),
          hasDash: /-/.test(playerName),
          hasUnderscore: /_/.test(playerName),
          startsWithNumber: /^[0-9]/.test(playerName),
          hasOrdinal: /\d+(st|nd|rd|th)/i.test(playerName)
        },
        tokens: {
          brackets: (playerName.match(/\[([^\]]+)\]/g) || []).map(m => m.slice(1, -1)),
          braces: (playerName.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1)),
          parens: (playerName.match(/\(([^)]+)\)/g) || []).map(m => m.slice(1, -1)),
          words: playerName.split(/[\s\-_|]+/).filter(w => w.length > 0)
        }
      }
    },

    getParsingConfig() {
      // Return the current parsing configuration
      return parsingConfig
    },

    setRegimentTeam(regiment, team, roundId = null) {
      // Use selected round if no roundId provided
      const targetRound = roundId !== null ? roundId : this.selectedRoundId
      
      // If no round selected and we have rounds, don't allow assignment
      if (targetRound === null && this.rounds.length > 1) {
        console.warn('Cannot assign teams without selecting a round first')
        return
      }
      
      // Initialize round teams if needed
      if (!this.regimentTeams[targetRound]) {
        this.regimentTeams[targetRound] = {}
      }
      
      if (team === null) {
        delete this.regimentTeams[targetRound][regiment]
      } else {
        this.regimentTeams[targetRound][regiment] = team
      }
      
      // Update cache
      this.cacheToLocalStorage({
        events: this.events,
        rounds: this.rounds,
        warnings: this.warnings,
        stats: this.stats,
        fileName: this.fileName,
        regimentTeams: this.regimentTeams
      })
    },

    getRegimentTeam(regiment, roundId = null) {
      // Use selected round if no roundId provided
      const targetRound = roundId !== null ? roundId : this.selectedRoundId
      
      // If no round specified, return null
      if (targetRound === null) {
        return null
      }
      
      return this.regimentTeams[targetRound]?.[regiment] || null
    },

    getTeamColor(team) {
      switch (team) {
        case 'USA':
          return '#2196F3' // Blue
        case 'CSA':
          return '#F44336' // Red
        default:
          return '#9E9E9E' // Gray
      }
    },

    /**
     * Start live monitoring mode
     */
    async startLiveMonitoring(fileName) {
      try {
        // Create live monitor worker
        const Worker = await import('../workers/live-monitor.worker.js?worker')
        liveMonitorWorker = new Worker.default()
        liveMonitorParser = wrap(liveMonitorWorker)

        // Reset parser state
        await liveMonitorParser.reset()

        this.isLiveMonitoring = true
        this.fileName = fileName
        this.events = []
        this.rounds = []
        this.warnings = []
        this.playerSessions = []
        this.stats = null
        this.selectedRoundId = null // Reset round selection

        console.log('Live monitoring started for:', fileName)
      } catch (error) {
        console.error('Error starting live monitoring:', error)
        throw error
      }
    },

    /**
     * Process a chunk of new log data during live monitoring
     */
    async processLiveUpdate(chunk) {
      if (!this.isLiveMonitoring || !liveMonitorParser) {
        throw new Error('Live monitoring not active')
      }

      try {
        // Track previous round count
        const previousRoundCount = this.rounds.length

        // Process the chunk incrementally
        const result = await liveMonitorParser.processChunk(chunk)

        // Get full state from worker
        const state = await liveMonitorParser.getState()

        // Update store with accumulated data
        this.events = state.events
        this.rounds = state.rounds
        this.warnings = state.warnings
        this.playerSessions = state.playerSessions
        this.chatMessages = state.chatMessages
        this.stats = state.stats

        // Auto-select latest round when new round is detected
        if (state.rounds.length > previousRoundCount && state.rounds.length > 0) {
          const latestRound = state.rounds[state.rounds.length - 1]
          this.setSelectedRound(latestRound.id)
          console.log(`Auto-selected new round ${latestRound.id}`)
        }

        // Update time range to include new data
        if (state.events.length > 0) {
          const times = state.events.map(e => e.time)
          this.timeRange = [Math.min(...times), Math.max(...times)]
        }

        return {
          newEvents: result.newEvents,
          newWarnings: result.newWarnings,
          newPlayerSessions: result.newPlayerSessions,
          totalEvents: result.totalEvents,
          totalRounds: result.totalRounds,
          stats: result.stats
        }
      } catch (error) {
        console.error('Error processing live update:', error)
        throw error
      }
    },

    /**
     * Reset live monitoring parser state
     */
    async resetLiveMonitoring() {
      if (!liveMonitorParser) return

      try {
        await liveMonitorParser.reset()
        this.events = []
        this.rounds = []
        this.warnings = []
        this.playerSessions = []
        this.stats = null
        this.timeRange = [0, 86400]
      } catch (error) {
        console.error('Error resetting live monitoring:', error)
        throw error
      }
    },

    /**
     * Stop live monitoring
     */
    stopLiveMonitoring() {
      if (liveMonitorWorker) {
        liveMonitorWorker.terminate()
        liveMonitorWorker = null
        liveMonitorParser = null
      }
      this.isLiveMonitoring = false
      console.log('Live monitoring stopped')
    }
  }
})
