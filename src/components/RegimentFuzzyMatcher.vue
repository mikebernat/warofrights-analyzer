<template>
  <div>
    <!-- Launch button -->
    <v-btn
      color="primary"
      prepend-icon="mdi-auto-fix"
      @click="openDialog"
      :loading="analyzing"
    >
      Smart Regiment Matcher
    </v-btn>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="1200" scrollable>
      <v-card>
        <v-card-title class="text-h5 bg-primary">
          <v-icon class="mr-2">mdi-auto-fix</v-icon>
          Smart Regiment Matcher
        </v-card-title>

        <v-card-subtitle class="mt-2">
          Automatically finds similar regiment names and suggests merges. 
          Focuses on small regiments (bottom 50%) that might be variations of larger ones.
        </v-card-subtitle>

        <v-divider></v-divider>

        <!-- Settings -->
        <v-card-text v-if="!hasAnalyzed">
          <v-row>
            <v-col cols="12" md="4">
              <v-slider
                v-model="similarityThreshold"
                :min="0.5"
                :max="0.95"
                :step="0.05"
                label="Similarity Threshold"
                thumb-label
                :hint="`Higher = stricter matching (${(similarityThreshold * 100).toFixed(0)}%)`"
                persistent-hint
              >
                <template v-slot:append>
                  <v-chip size="small">{{ (similarityThreshold * 100).toFixed(0) }}%</v-chip>
                </template>
              </v-slider>
            </v-col>
            <v-col cols="12" md="4">
              <v-slider
                v-model="minPlayerDifference"
                :min="0"
                :max="20"
                :step="1"
                label="Min Player Difference"
                thumb-label
                hint="Target must have at least this many more players"
                persistent-hint
              >
                <template v-slot:append>
                  <v-chip size="small">{{ minPlayerDifference }}</v-chip>
                </template>
              </v-slider>
            </v-col>
            <v-col cols="12" md="4">
              <v-slider
                v-model="minSourcePlayers"
                :min="1"
                :max="5"
                :step="1"
                label="Min Source Players"
                thumb-label
                hint="Only match regiments with at least this many players"
                persistent-hint
              >
                <template v-slot:append>
                  <v-chip size="small">{{ minSourcePlayers }}</v-chip>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-4">
            <strong>How it works:</strong>
            <ul class="mt-2">
              <li>Analyzes bottom 50% of regiments by player count</li>
              <li>Finds similar regiment names using fuzzy matching</li>
              <li>Suggests merging small regiments into larger ones</li>
              <li>You review and approve each suggestion</li>
            </ul>
          </v-alert>
        </v-card-text>

        <!-- Results -->
        <v-card-text v-else style="max-height: 500px;">
          <v-alert v-if="matches.length === 0" type="success" variant="tonal">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            No similar regiment names found! Your data looks clean.
          </v-alert>

          <div v-else>
            <v-alert type="info" variant="tonal" class="mb-4">
              Found <strong>{{ matches.length }}</strong> potential matches affecting 
              <strong>{{ totalAffectedPlayers }}</strong> players
            </v-alert>

            <!-- Match cards -->
            <v-card
              v-for="(match, index) in matches"
              :key="index"
              class="mb-3"
              :color="match.approved ? 'success' : 'default'"
              variant="outlined"
            >
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="5">
                    <div class="text-subtitle-2 text-medium-emphasis">From (Small Regiment)</div>
                    <div class="text-h6">{{ match.sourceRegiment }}</div>
                    <v-chip size="small" color="warning" class="mt-1">
                      {{ match.sourcePlayers.length }} players
                    </v-chip>
                  </v-col>

                  <v-col cols="12" md="2" class="text-center">
                    <v-icon size="large" color="primary">mdi-arrow-right-thick</v-icon>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ (match.similarity * 100).toFixed(0) }}% match
                    </div>
                  </v-col>

                  <v-col cols="12" md="5">
                    <div class="text-subtitle-2 text-medium-emphasis">To (Target Regiment)</div>
                    <div class="text-h6">{{ match.targetRegiment }}</div>
                    <v-chip size="small" color="success" class="mt-1">
                      {{ match.targetPlayerCount }} players
                    </v-chip>
                  </v-col>
                </v-row>

                <!-- Affected players -->
                <v-expansion-panels class="mt-3">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <span class="text-subtitle-2">
                        <v-icon class="mr-2" size="small">mdi-account-multiple</v-icon>
                        View {{ match.sourcePlayers.length }} affected players
                      </span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th class="text-right">Respawns</th>
                            <th>Old Regiment</th>
                            <th>New Regiment</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="player in match.sourcePlayers" :key="player.name">
                            <td>{{ player.name }}</td>
                            <td class="text-right">{{ player.respawns }}</td>
                            <td>
                              <v-chip size="x-small" color="warning">{{ match.sourceRegiment }}</v-chip>
                            </td>
                            <td>
                              <v-chip size="x-small" color="success">{{ match.targetRegiment }}</v-chip>
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Approve button -->
                <div class="mt-3 text-right">
                  <v-btn
                    v-if="!match.approved"
                    color="success"
                    prepend-icon="mdi-check"
                    @click="approveMatch(index)"
                  >
                    Approve Merge
                  </v-btn>
                  <v-chip v-else color="success" prepend-icon="mdi-check-circle">
                    Approved
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="!hasAnalyzed"
            color="primary"
            prepend-icon="mdi-magnify"
            @click="analyzeRegiments"
            :loading="analyzing"
          >
            Analyze Regiments
          </v-btn>
          <template v-else>
            <v-btn
              text="Reset"
              @click="reset"
            ></v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-check-all"
              @click="applyAllApproved"
              :disabled="approvedCount === 0"
            >
              Apply {{ approvedCount }} Approved Changes
            </v-btn>
          </template>
          <v-btn
            text="Close"
            @click="dialog = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success snackbar -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      :timeout="3000"
      color="success"
      location="bottom"
    >
      <v-icon class="mr-2">mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLogStore } from '../stores/logStore'
import fuzzysort from 'fuzzysort'

const logStore = useLogStore()

const dialog = ref(false)
const analyzing = ref(false)
const hasAnalyzed = ref(false)
const matches = ref([])
const similarityThreshold = ref(0.75)
const minPlayerDifference = ref(2)
const minSourcePlayers = ref(1)
const showSuccessSnackbar = ref(false)
const successMessage = ref('')

const totalAffectedPlayers = computed(() => {
  return matches.value.reduce((sum, match) => sum + match.sourcePlayers.length, 0)
})

const approvedCount = computed(() => {
  return matches.value.filter(m => m.approved).length
})

const openDialog = () => {
  dialog.value = true
}

const analyzeRegiments = () => {
  analyzing.value = true
  
  // Small delay for UI feedback
  setTimeout(() => {
    performAnalysis()
    analyzing.value = false
    hasAnalyzed.value = true
  }, 500)
}

const performAnalysis = () => {
  // Get all regiments with player counts
  const regimentStats = {}
  
  logStore.filteredEvents.forEach(event => {
    if (!regimentStats[event.regiment]) {
      regimentStats[event.regiment] = {
        name: event.regiment,
        players: new Set(),
        playerDetails: {}
      }
    }
    regimentStats[event.regiment].players.add(event.player)
    
    if (!regimentStats[event.regiment].playerDetails[event.player]) {
      regimentStats[event.regiment].playerDetails[event.player] = 0
    }
    regimentStats[event.regiment].playerDetails[event.player]++
  })

  // Convert to array and add player count
  const regiments = Object.values(regimentStats).map(r => ({
    name: r.name,
    playerCount: r.players.size,
    players: Array.from(r.players),
    playerDetails: r.playerDetails
  }))

  console.log('Total regiments:', regiments.length)
  console.log('Regiment counts:', regiments.map(r => `${r.name}: ${r.playerCount}`))

  // Sort by player count
  regiments.sort((a, b) => a.playerCount - b.playerCount)

  // Get bottom 50% (small regiments)
  const medianIndex = Math.floor(regiments.length / 2)
  const smallRegiments = regiments.slice(0, medianIndex)
  const largeRegiments = regiments.slice(medianIndex)
  
  console.log('Small regiments:', smallRegiments.length, smallRegiments.map(r => `${r.name}(${r.playerCount})`))
  console.log('Large regiments:', largeRegiments.length, largeRegiments.map(r => `${r.name}(${r.playerCount})`))

  // Find matches
  const foundMatches = []

  smallRegiments.forEach(smallReg => {
    // Skip if below minimum player threshold
    if (smallReg.playerCount < minSourcePlayers.value) {
      console.log(`Skipping ${smallReg.name} - only ${smallReg.playerCount} player(s) (min: ${minSourcePlayers.value})`)
      return
    }

    // Compare against all large regiments and find best match
    let bestMatch = null
    let bestSimilarity = 0

    largeRegiments.forEach(largeReg => {
      // Skip if same name
      if (smallReg.name === largeReg.name) return

      // Calculate similarity score (0-1)
      const similarity = calculateSimilarity(smallReg.name, largeReg.name)
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestMatch = largeReg
      }
    })

    if (bestMatch) {
      const playerDiff = bestMatch.playerCount - smallReg.playerCount
      
      console.log(`Comparing ${smallReg.name}(${smallReg.playerCount}) -> ${bestMatch.name}(${bestMatch.playerCount}):`)
      console.log(`  Similarity: ${(bestSimilarity * 100).toFixed(1)}% (threshold: ${(similarityThreshold.value * 100).toFixed(0)}%)`)
      console.log(`  Player diff: ${playerDiff} (min: ${minPlayerDifference.value})`)

      // Check if meets criteria
      if (
        bestSimilarity >= similarityThreshold.value &&
        playerDiff >= minPlayerDifference.value
      ) {
        console.log(`  ✓ MATCH FOUND!`)
        
        // Get player details
        const sourcePlayers = smallReg.players.map(playerName => ({
          name: playerName,
          respawns: smallReg.playerDetails[playerName]
        }))

        foundMatches.push({
          sourceRegiment: smallReg.name,
          targetRegiment: bestMatch.name,
          sourcePlayers: sourcePlayers,
          targetPlayerCount: bestMatch.playerCount,
          similarity: bestSimilarity,
          approved: false
        })
      } else {
        console.log(`  ✗ No match - criteria not met`)
      }
    } else {
      console.log(`No match found for ${smallReg.name}`)
    }
  })
  
  console.log(`Total matches found: ${foundMatches.length}`)

  matches.value = foundMatches
}

const calculateSimilarity = (str1, str2) => {
  // Normalize strings
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2)
  const maxLen = Math.max(s1.length, s2.length)
  
  // Convert to similarity score (0-1)
  return maxLen === 0 ? 1 : 1 - (distance / maxLen)
}

const levenshteinDistance = (str1, str2) => {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

const approveMatch = (index) => {
  matches.value[index].approved = true
}

const applyAllApproved = () => {
  const approvedMatches = matches.value.filter(m => m.approved)
  
  console.log('Applying approved matches:', approvedMatches.length)
  
  if (approvedMatches.length === 0) {
    console.log('No approved matches to apply')
    return
  }

  // Build changes object
  const changes = {}
  let totalPlayers = 0

  approvedMatches.forEach(match => {
    console.log(`Processing match: ${match.sourceRegiment} -> ${match.targetRegiment}`)
    match.sourcePlayers.forEach(player => {
      console.log(`  Reassigning player: ${player.name}`)
      changes[player.name] = match.targetRegiment
      totalPlayers++
    })
  })

  console.log('Total changes to apply:', changes)
  console.log('Calling applyRegimentReassignments with:', changes)

  // Apply changes to store
  try {
    logStore.applyRegimentReassignments(changes)
    console.log('Changes applied successfully')
    console.log('Events after change:', logStore.events.length)
    
    // Force reactivity by checking a few events
    const sampleEvents = logStore.events.slice(0, 5)
    console.log('Sample events after change:', sampleEvents.map(e => `${e.player}: ${e.regiment}`))
  } catch (error) {
    console.error('Error applying changes:', error)
    successMessage.value = 'Error applying changes: ' + error.message
    showSuccessSnackbar.value = true
    return
  }

  // Show success message
  successMessage.value = `Successfully merged ${approvedMatches.length} regiments affecting ${totalPlayers} players`
  showSuccessSnackbar.value = true

  // Close dialog after a short delay to allow user to see success message
  setTimeout(() => {
    dialog.value = false
    
    // Reset for next use
    setTimeout(() => {
      reset()
    }, 300)
  }, 1500)
}

const reset = () => {
  hasAnalyzed.value = false
  matches.value = []
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
