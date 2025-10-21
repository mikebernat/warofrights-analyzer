<template>
  <div>
      <v-alert type="info" variant="tonal" class="mb-4">
        Reassign players to correct regiments. Changes apply to all their respawns. Select multiple players for mass updates.
      </v-alert>

      <!-- Mass update controls -->
      <v-card v-if="selectedPlayers.length > 0" class="mb-4" color="primary" variant="tonal">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold">
                <v-icon class="mr-2">mdi-account-multiple</v-icon>
                {{ selectedPlayers.length }} player(s) selected
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <v-combobox
                v-model="massUpdateRegiment"
                :items="availableRegiments"
                item-title="title"
                item-value="value"
                :return-object="false"
                label="Assign Regiment"
                density="compact"
                variant="outlined"
                placeholder="Select or type regiment"
                hide-details
              ></v-combobox>
            </v-col>
            <v-col cols="12" md="2">
              <v-btn
                color="primary"
                block
                :disabled="!massUpdateRegiment"
                @click="applyMassUpdate"
                prepend-icon="mdi-check-all"
              >
                Apply
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Filter controls -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchPlayer"
            label="Search Players"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="filterRegiment"
            :items="regimentFilterOptions"
            label="Filter by Regiment"
            prepend-inner-icon="mdi-filter"
            variant="outlined"
            density="compact"
            clearable
          ></v-select>
        </v-col>
      </v-row>

      <!-- Players table -->
      <v-data-table
        v-model="selectedPlayers"
        :headers="headers"
        :items="filteredPlayers"
        :items-per-page="10"
        density="compact"
        show-select
        item-value="player"
      >
        <template v-slot:item.player="{ item }">
          <span class="font-weight-medium">{{ item.player }}</span>
        </template>
        
        <template v-slot:item.currentRegiment="{ item }">
          <v-chip
            size="small"
            :color="item.currentRegiment === 'Uncategorized' ? 'warning' : 'primary'"
          >
            {{ item.currentRegiment }}
          </v-chip>
        </template>

        <template v-slot:item.newRegiment="{ item }">
          <v-combobox
            v-model="item.newRegiment"
            :items="availableRegiments"
            item-title="title"
            item-value="value"
            :return-object="false"
            density="compact"
            variant="outlined"
            placeholder="Select or type regiment"
            hide-details
            @blur="applyChange(item)"
            @keydown.enter="applyChange(item)"
          ></v-combobox>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon size="small" color="success" v-if="item.currentRegiment !== 'Uncategorized'">
            mdi-check-circle
          </v-icon>
        </template>
      </v-data-table>

      <!-- Action buttons -->
      <v-row class="mt-4">
        <v-col>
          <v-btn
            color="info"
            prepend-icon="mdi-bug"
            @click="generateDebugReport"
          >
            Generate Debug Report
          </v-btn>
        </v-col>
      </v-row>

    <!-- Debug Report Dialog -->
    <v-dialog v-model="showDebugDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-bug</v-icon>
          Debug Report - Regiment Parsing Analysis
        </v-card-title>
        <v-card-text style="max-height: 600px; overflow-y: auto;">
          <v-alert type="info" variant="tonal" class="mb-4">
            This report contains manual reassignments and parsing configuration.
            Copy and share this to help improve the regiment parsing rules.
          </v-alert>
          
          <v-textarea
            v-model="debugReport"
            readonly
            rows="20"
            variant="outlined"
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-copy"
            @click="copyDebugReport"
          >
            Copy to Clipboard
          </v-btn>
          <v-btn
            color="secondary"
            @click="downloadDebugReport"
            prepend-icon="mdi-download"
          >
            Download
          </v-btn>
          <v-btn @click="showDebugDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

const searchPlayer = ref('')
const filterRegiment = ref(null) // Will be set to "Uncategorized (X players)" dynamically
const showDebugDialog = ref(false)
const debugReport = ref('')
const selectedPlayers = ref([])
const massUpdateRegiment = ref(null)

const headers = [
  { title: 'Player', key: 'player', sortable: true },
  { title: 'Current Regiment', key: 'currentRegiment', sortable: true },
  { title: 'Respawns', key: 'respawns', sortable: true },
  { title: 'New Regiment', key: 'newRegiment', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: 80 }
]

// Get unique players with their current regiments
const playerData = computed(() => {
  const players = {}
  
  logStore.events.forEach(event => {
    if (!players[event.player]) {
      players[event.player] = {
        player: event.player,
        currentRegiment: event.regiment,
        originalRegiment: event.regiment,
        newRegiment: null,
        respawns: 0,
        changed: false
      }
    }
    players[event.player].respawns++
  })
  
  return Object.values(players).sort((a, b) => b.respawns - a.respawns)
})

// Count uncategorized players
const uncategorizedCount = computed(() => {
  return playerData.value.filter(p => p.currentRegiment === 'Uncategorized').length
})

// Available regiments for dropdown with player counts
const availableRegiments = computed(() => {
  const regimentCounts = {}
  
  // Count unique players per regiment
  logStore.events.forEach(event => {
    if (event.regiment !== 'Uncategorized') {
      if (!regimentCounts[event.regiment]) {
        regimentCounts[event.regiment] = new Set()
      }
      regimentCounts[event.regiment].add(event.player)
    }
  })
  
  // Convert to array with formatted labels
  return Object.entries(regimentCounts)
    .map(([regiment, players]) => ({
      title: `${regiment} (${players.size} players)`,
      value: regiment
    }))
    .sort((a, b) => a.value.localeCompare(b.value))
})

// Regiment filter options with player counts
const regimentFilterOptions = computed(() => {
  // Count uncategorized players
  const uncategorizedPlayers = playerData.value.filter(p => p.currentRegiment === 'Uncategorized').length
  
  // Build options array with counts
  const options = [
    `Uncategorized (${uncategorizedPlayers} players)`,
    ...availableRegiments.value.map(r => r.title)
  ]
  
  return options
})

// Filtered players based on search and filter
const filteredPlayers = computed(() => {
  let filtered = playerData.value
  
  if (searchPlayer.value) {
    const search = searchPlayer.value.toLowerCase()
    filtered = filtered.filter(p => p.player.toLowerCase().includes(search))
  }
  
  if (filterRegiment.value) {
    // Extract regiment name from "Regiment (X players)" format
    const regimentName = filterRegiment.value.replace(/\s*\(\d+\s+players?\)$/, '')
    filtered = filtered.filter(p => p.currentRegiment === regimentName)
  }
  
  return filtered
})

// Check if there are any changes
const hasChanges = computed(() => {
  return playerData.value.some(p => p.changed)
})

const applyChange = (item) => {
  if (item.newRegiment && item.newRegiment !== item.currentRegiment) {
    // Apply change
    const changes = { [item.player]: item.newRegiment }
    logStore.applyRegimentReassignments(changes)
    
    // Update UI
    item.currentRegiment = item.newRegiment
    item.originalRegiment = item.newRegiment
    item.newRegiment = null
    item.changed = false
  } else if (!item.newRegiment || item.newRegiment === item.currentRegiment) {
    // Clear if empty or same as current
    item.newRegiment = null
    item.changed = false
  }
}

const applyMassUpdate = () => {
  if (!massUpdateRegiment.value || selectedPlayers.value.length === 0) {
    return
  }
  
  // Build changes object for all selected players
  const changes = {}
  selectedPlayers.value.forEach(playerName => {
    changes[playerName] = massUpdateRegiment.value
  })
  
  // Apply changes to store
  logStore.applyRegimentReassignments(changes)
  
  // Update UI for all affected players
  playerData.value.forEach(p => {
    if (selectedPlayers.value.includes(p.player)) {
      p.currentRegiment = massUpdateRegiment.value
      p.originalRegiment = massUpdateRegiment.value
      p.newRegiment = null
      p.changed = false
    }
  })
  
  // Clear selection and mass update field
  selectedPlayers.value = []
  massUpdateRegiment.value = null
}

const resetPlayer = (item) => {
  item.newRegiment = null
  item.changed = false
}

const resetAll = () => {
  playerData.value.forEach(p => {
    p.newRegiment = null
    p.changed = false
  })
}

const applyChanges = () => {
  const changes = {}
  
  playerData.value.forEach(p => {
    if (p.changed && p.newRegiment) {
      changes[p.player] = p.newRegiment
    }
  })
  
  if (Object.keys(changes).length === 0) {
    return
  }
  
  // Apply changes to store
  logStore.applyRegimentReassignments(changes)
  
  // Update current regiments in the UI
  playerData.value.forEach(p => {
    if (p.changed && p.newRegiment) {
      p.currentRegiment = p.newRegiment
      p.originalRegiment = p.newRegiment
      p.newRegiment = null
      p.changed = false
    }
  })
}

const generateDebugReport = () => {
  const uncategorized = playerData.value.filter(p => p.currentRegiment === 'Uncategorized')
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPlayers: playerData.value.length,
      uncategorizedPlayers: uncategorized.length,
      uncategorizedPercentage: ((uncategorized.length / playerData.value.length) * 100).toFixed(2) + '%',
      totalRespawns: logStore.events.length,
      uncategorizedRespawns: uncategorized.reduce((sum, p) => sum + p.respawns, 0),
      manualReassignmentsCount: logStore.manualReassignments.length
    },
    manualReassignments: logStore.manualReassignments.map(r => ({
      playerName: r.playerName,
      originalRegiment: r.originalRegiment,
      newRegiment: r.newRegiment,
      timestamp: r.timestamp,
      playerNamePattern: r.playerNamePattern,
      suggestedPattern: generatePatternSuggestion(r)
    })),
    currentParsingConfig: logStore.getParsingConfig()
  }
  
  debugReport.value = JSON.stringify(report, null, 2)
  showDebugDialog.value = true
}

const generatePatternSuggestion = (reassignment) => {
  const { playerName, newRegiment, playerNamePattern } = reassignment
  
  // Try to identify what part of the name contains the regiment
  const regimentIndex = playerName.indexOf(newRegiment)
  
  if (regimentIndex >= 0) {
    return {
      found: true,
      location: regimentIndex === 0 ? 'start' : 'middle',
      suggestion: `Regiment "${newRegiment}" found in player name at position ${regimentIndex}`
    }
  }
  
  // Check if regiment is in brackets/braces/parens
  if (playerNamePattern.tokens.brackets.some(b => b.includes(newRegiment))) {
    return { found: true, location: 'brackets', suggestion: `Regiment found in brackets` }
  }
  if (playerNamePattern.tokens.braces.some(b => b.includes(newRegiment))) {
    return { found: true, location: 'braces', suggestion: `Regiment found in braces` }
  }
  if (playerNamePattern.tokens.parens.some(p => p.includes(newRegiment))) {
    return { found: true, location: 'parens', suggestion: `Regiment found in parentheses` }
  }
  
  return {
    found: false,
    suggestion: `Manual assignment - regiment "${newRegiment}" not found in player name "${playerName}"`
  }
}

const extractPatterns = (playerName) => {
  const patterns = {
    hasBrackets: /\[([^\]]+)\]/.test(playerName),
    hasBraces: /\{([^}]+)\}/.test(playerName),
    hasParens: /\(([^)]+)\)/.test(playerName),
    hasPipe: /\|/.test(playerName),
    hasDash: /-/.test(playerName),
    hasUnderscore: /_/.test(playerName),
    startsWithNumber: /^\d/.test(playerName),
    hasOrdinal: /\d+(st|nd|rd|th)/i.test(playerName)
  }
  
  const tokens = {
    brackets: playerName.match(/\[([^\]]+)\]/g) || [],
    braces: playerName.match(/\{([^}]+)\}/g) || [],
    parens: playerName.match(/\(([^)]+)\)/g) || [],
    words: playerName.split(/[\s\-_|]/).filter(w => w.length > 0)
  }
  
  return { patterns, tokens }
}

const generateRecommendations = (uncategorized) => {
  const recommendations = []
  
  // Analyze common patterns in uncategorized names
  const patternCounts = {
    brackets: 0,
    braces: 0,
    parens: 0,
    pipe: 0,
    dash: 0
  }
  
  uncategorized.forEach(p => {
    if (/\[/.test(p.player)) patternCounts.brackets++
    if (/\{/.test(p.player)) patternCounts.braces++
    if (/\(/.test(p.player)) patternCounts.parens++
    if (/\|/.test(p.player)) patternCounts.pipe++
    if (/-/.test(p.player)) patternCounts.dash++
  })
  
  if (patternCounts.parens > 5) {
    recommendations.push('Consider adding a pattern for parentheses: \\(([^)]+)\\)')
  }
  if (patternCounts.pipe > 5) {
    recommendations.push('Consider adding a pattern for pipe delimiter: ([^|]+)\\|')
  }
  
  return recommendations
}

const copyDebugReport = async () => {
  try {
    await navigator.clipboard.writeText(debugReport.value)
    alert('Debug report copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const downloadDebugReport = () => {
  const blob = new Blob([debugReport.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `regiment-parsing-debug-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
