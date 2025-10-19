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
            <div class="d-flex align-center justify-space-between w-100">
              <span class="font-weight-bold">{{ regiment.name }}</span>
              <v-chip size="small" color="primary" class="mr-4">
                {{ regiment.players.length }} players, {{ regiment.totalRespawns }} respawns
              </v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Player</th>
                  <th class="text-right">Respawns</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in regiment.players" :key="player.name">
                  <td>{{ player.name }}</td>
                  <td class="text-right">{{ player.respawns }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

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
        .map(([name, respawns]) => ({ name, respawns }))
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
</script>
