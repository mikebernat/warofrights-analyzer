import { describe, it, expect, beforeEach } from 'vitest'
import { wrap } from 'comlink'

/**
 * Tests for live monitoring worker
 * 
 * These tests verify the incremental parsing functionality
 * of the live monitor worker.
 */

describe('LiveMonitor Worker', () => {
  let parser

  beforeEach(async () => {
    // Import and wrap the worker
    const Worker = await import('../src/workers/live-monitor.worker.js?worker')
    const worker = new Worker.default()
    parser = wrap(worker)
    
    // Reset parser state
    await parser.reset()
  })

  it('should initialize with empty state', async () => {
    const state = await parser.getState()
    
    expect(state.events).toEqual([])
    expect(state.rounds).toEqual([])
    expect(state.warnings).toEqual([])
    expect(state.playerSessions).toEqual([])
    expect(state.stats.totalRespawns).toBe(0)
    expect(state.stats.totalRounds).toBe(0)
  })

  it('should process initialization line', async () => {
    const chunk = '[CWarOfRightsGame] Initialized\n'
    
    const result = await parser.processChunk(chunk)
    
    expect(result.newEvents).toEqual([])
    expect(result.totalEvents).toBe(0)
  })

  it('should process respawn event', async () => {
    // Initialize first
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    
    // Start a round
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    // Wait 60 seconds (to pass the initial spawn filter)
    // Then process a respawn
    const chunk = '<00:02:00> [CPlayer::ClDoRespawn] "10thVA.A Player1"\n'
    const result = await parser.processChunk(chunk)
    
    expect(result.newEvents.length).toBe(1)
    expect(result.newEvents[0].player).toBe('10thVA.A Player1')
    expect(result.newEvents[0].regiment).toBe('10thVA')
    expect(result.totalEvents).toBe(1)
  })

  it('should handle partial lines across chunks', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    // Send partial line
    const chunk1 = '<00:02:00> [CPlayer::ClDoRespawn] "10thVA'
    const result1 = await parser.processChunk(chunk1)
    expect(result1.newEvents.length).toBe(0) // No complete event yet
    
    // Complete the line
    const chunk2 = '.A Player1"\n'
    const result2 = await parser.processChunk(chunk2)
    expect(result2.newEvents.length).toBe(1)
    expect(result2.newEvents[0].player).toBe('10thVA.A Player1')
  })

  it('should track multiple events incrementally', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    // First respawn
    const result1 = await parser.processChunk('<00:02:00> [CPlayer::ClDoRespawn] "10thVA.A Player1"\n')
    expect(result1.totalEvents).toBe(1)
    
    // Second respawn
    const result2 = await parser.processChunk('<00:02:30> [CPlayer::ClDoRespawn] "69thNY.B Player2"\n')
    expect(result2.totalEvents).toBe(2)
    expect(result2.newEvents.length).toBe(1)
    
    // Verify state
    const state = await parser.getState()
    expect(state.events.length).toBe(2)
    expect(state.events[0].regiment).toBe('10thVA')
    expect(state.events[1].regiment).toBe('69thNY')
  })

  it('should detect round start', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    
    const chunk = '<00:01:00> CGameRulesEventHelper::OnRoundStarted\n'
    await parser.processChunk(chunk)
    
    const state = await parser.getState()
    expect(state.rounds.length).toBe(1)
    expect(state.rounds[0].id).toBe(1)
    expect(state.rounds[0].status).toBe('Incomplete')
  })

  it('should detect round victory', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    const chunk = '<00:30:00> CGameRulesEventHelper::OnVictory TeamID: 1\n'
    await parser.processChunk(chunk)
    
    const state = await parser.getState()
    expect(state.rounds[0].status).toBe('Complete')
    expect(state.rounds[0].winner).toBe('USA')
  })

  it('should track player sessions', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    
    // Player joins
    const joinChunk = '<00:00:30> Player TestPlayer has joined the server\n'
    const result1 = await parser.processChunk(joinChunk)
    expect(result1.newPlayerSessions.length).toBe(1)
    expect(result1.newPlayerSessions[0].action).toBe('join')
    
    // Player leaves
    const leaveChunk = '<00:05:00> Player TestPlayer has left the server\n'
    const result2 = await parser.processChunk(leaveChunk)
    expect(result2.newPlayerSessions.length).toBe(1)
    expect(result2.newPlayerSessions[0].action).toBe('leave')
    
    const state = await parser.getState()
    expect(state.playerSessions.length).toBe(2)
  })

  it('should reset state correctly', async () => {
    // Add some data
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    await parser.processChunk('<00:02:00> [CPlayer::ClDoRespawn] "10thVA.A Player1"\n')
    
    let state = await parser.getState()
    expect(state.events.length).toBe(1)
    
    // Reset
    await parser.reset()
    
    state = await parser.getState()
    expect(state.events).toEqual([])
    expect(state.rounds).toEqual([])
    expect(state.warnings).toEqual([])
  })

  it('should handle map changes', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> PrepareLevel Antietam\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    const state = await parser.getState()
    expect(state.rounds[0].map).toBe('Antietam')
  })

  it('should extract regiment names correctly', async () => {
    await parser.processChunk('[CWarOfRightsGame] Initialized\n')
    await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
    
    const testCases = [
      { input: '10thVA.A Player', expected: '10thVA' },
      { input: '69thNY.B Player', expected: '69thNY' },
      { input: '[1stSC] Player', expected: '1stSC' },
      { input: 'CB|Player', expected: 'CB' },
      { input: 'RandomPlayer', expected: 'Uncategorized' }
    ]
    
    for (const testCase of testCases) {
      await parser.reset()
      await parser.processChunk('[CWarOfRightsGame] Initialized\n')
      await parser.processChunk('<00:01:00> CGameRulesEventHelper::OnRoundStarted\n')
      
      const chunk = `<00:02:00> [CPlayer::ClDoRespawn] "${testCase.input}"\n`
      const result = await parser.processChunk(chunk)
      
      expect(result.newEvents[0].regiment).toBe(testCase.expected)
    }
  })
})
