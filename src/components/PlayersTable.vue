<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-table</v-icon>
      Players by Regiment
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Detailed breakdown of all players grouped by their regiment. Expand to see individual respawn counts.
    </v-card-subtitle>
    <v-card-text>
      <v-expansion-panels>
        <v-expansion-panel
          v-for="regiment in regimentGroups"
          :key="regiment.name"
        >
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <div class="d-flex align-center justify-space-between w-100">
                <span class="font-weight-bold">{{ regiment.name }}</span>
                <div class="d-flex align-center gap-2">
                  <v-chip size="small" color="primary">
                    {{ regiment.players.length }} players, {{ regiment.totalRespawns }} respawns
                  </v-chip>
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    @click.stop="copyRegimentToClipboard(regiment)"
                    :title="`Copy ${regiment.name} players to clipboard`"
                  >
                  </v-btn>
                </div>
              </div>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Player</th>
                  <th class="text-right">Respawns</th>
                  <th class="text-right">Presence Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in regiment.players" :key="player.name">
                  <td>{{ player.name }}</td>
                  <td class="text-right">{{ player.respawns }}</td>
                  <td class="text-right">
                    <span class="font-weight-medium">{{ player.presenceTime }}</span>
                    <v-chip size="x-small" :color="getPresenceColor(player.presencePercentage)" class="ml-2">
                      {{ player.presencePercentage }}%
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <!-- Success snackbar -->
    <v-snackbar
      v-model="showCopySnackbar"
      :timeout="2000"
      color="success"
      location="bottom"
    >
      <v-icon class="mr-2">mdi-check-circle</v-icon>
      {{ copyMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const showCopySnackbar = ref(false)
const copyMessage = ref('')

const regimentGroups = computed(() => {
  const groups = {}
  
  // Group events by regiment and player
  logStore.filteredEvents.forEach(event => {
    if (!groups[event.regiment]) {
      groups[event.regiment] = {}
    }
    if (!groups[event.regiment][event.player]) {
      groups[event.regiment][event.player] = 0
    }
    groups[event.regiment][event.player]++
  })
  
  // Convert to array format
  return Object.entries(groups)
    .map(([regiment, players]) => {
      const playerList = Object.entries(players)
        .map(([name, respawns]) => {
          // Get presence time for this player
          const presence = logStore.getPlayerPresenceTime(name, logStore.selectedRoundId)
          
          return {
            name,
            respawns,
            presenceTime: presence.formattedTime,
            presencePercentage: presence.percentage
          }
        })
        .sort((a, b) => b.respawns - a.respawns)
      
      const totalRespawns = playerList.reduce((sum, p) => sum + p.respawns, 0)
      
      return {
        name: regiment,
        players: playerList,
        totalRespawns,
        playerCount: playerList.length
      }
    })
    .sort((a, b) => b.playerCount - a.playerCount)
})

const getPresenceColor = (percentage) => {
  if (percentage >= 80) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

const copyRegimentToClipboard = async (regiment) => {
  try {
    // Create TSV format: Player\tRespawns\tPresence Time\tPresence %
    const header = 'Player\tRespawns\tPresence Time\tPresence %'
    const rows = regiment.players.map(player => 
      `${player.name}\t${player.respawns}\t${player.presenceTime}\t${player.presencePercentage}%`
    )
    const tsv = [header, ...rows].join('\n')
    
    await navigator.clipboard.writeText(tsv)
    
    // Show success feedback
    copyMessage.value = `Copied ${regiment.players.length} players from ${regiment.name}`
    showCopySnackbar.value = true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    copyMessage.value = 'Failed to copy to clipboard'
    showCopySnackbar.value = true
  }
}
</script>
