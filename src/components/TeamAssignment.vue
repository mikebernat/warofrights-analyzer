<template>
  <div>
      <v-alert v-if="!logStore.selectedRoundId && logStore.rounds.length > 1" type="warning" variant="tonal" class="mb-4">
        Please select a round first to assign teams. Team assignments are round-specific.
      </v-alert>
      <v-alert v-else type="info" variant="tonal" class="mb-4">
        Drag regiments to assign them to USA (Blue) or CSA (Red). Teams are specific to this round.
      </v-alert>

      <v-row>
        <!-- USA Team -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" color="blue">
            <v-card-title class="bg-blue text-white">
              <v-icon class="mr-2">mdi-flag</v-icon>
              USA (Union) ({{ getTeamPlayerCount('USA') }})
            </v-card-title>
            <v-card-text
              class="drop-zone"
              @drop="onDrop($event, 'USA')"
              @dragover.prevent
              @dragenter.prevent
              style="min-height: 300px;"
            >
              <v-chip
                v-for="regiment in usaRegiments"
                :key="regiment"
                class="ma-1"
                color="blue"
                closable
                draggable="true"
                @dragstart="onDragStart($event, regiment)"
                @click:close="removeTeam(regiment)"
              >
                {{ regiment }} ({{ getPlayerCount(regiment) }})
              </v-chip>
              <div v-if="usaRegiments.length === 0" class="text-center text-medium-emphasis mt-4">
                Drag regiments here
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Unassigned -->
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-title>
              <v-icon class="mr-2">mdi-help-circle</v-icon>
              Unassigned ({{ getTeamPlayerCount(null) }})
            </v-card-title>
            <v-card-text
              class="drop-zone"
              @drop="onDrop($event, null)"
              @dragover.prevent
              @dragenter.prevent
              style="min-height: 300px; overflow-y: auto;"
            >
              <v-chip
                v-for="regiment in unassignedRegiments"
                :key="regiment"
                class="ma-1"
                draggable="true"
                @dragstart="onDragStart($event, regiment)"
              >
                {{ regiment }} ({{ getPlayerCount(regiment) }})
              </v-chip>
              <div v-if="unassignedRegiments.length === 0" class="text-center text-medium-emphasis mt-4">
                All regiments assigned
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- CSA Team -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" color="red">
            <v-card-title class="bg-red text-white">
              <v-icon class="mr-2">mdi-flag</v-icon>
              CSA (Confederate) ({{ getTeamPlayerCount('CSA') }})
            </v-card-title>
            <v-card-text
              class="drop-zone"
              @drop="onDrop($event, 'CSA')"
              @dragover.prevent
              @dragenter.prevent
              style="min-height: 300px;"
            >
              <v-chip
                v-for="regiment in csaRegiments"
                :key="regiment"
                class="ma-1"
                color="red"
                closable
                draggable="true"
                @dragstart="onDragStart($event, regiment)"
                @click:close="removeTeam(regiment)"
              >
                {{ regiment }} ({{ getPlayerCount(regiment) }})
              </v-chip>
              <div v-if="csaRegiments.length === 0" class="text-center text-medium-emphasis mt-4">
                Drag regiments here
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-4">
        <v-col cols="auto">
          <TeamSmartMatcher />
        </v-col>
        <v-col cols="auto">
          <v-btn
            color="error"
            prepend-icon="mdi-delete"
            variant="outlined"
            @click="clearAllAssignments"
          >
            Clear All Assignments
          </v-btn>
        </v-col>
      </v-row>
  </div>
</template>

<script setup>
import TeamSmartMatcher from './TeamSmartMatcher.vue'

import { computed, ref } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const draggedRegiment = ref(null)

// Get current round info
const currentRound = computed(() => {
  if (logStore.selectedRoundId !== null) {
    return logStore.rounds.find(r => r.id === logStore.selectedRoundId)
  }
  return null
})

// Get all unique regiments from current round or all events, sorted by player count
const regimentPlayerCounts = ref({})

const allRegiments = computed(() => {
  const eventsToCheck = logStore.selectedRoundId !== null
    ? logStore.events.filter(e => e.roundId === logStore.selectedRoundId)
    : logStore.events
  
  // Count unique players per regiment
  const regimentPlayers = {}
  eventsToCheck.forEach(event => {
    if (event.regiment !== 'Uncategorized') {
      if (!regimentPlayers[event.regiment]) {
        regimentPlayers[event.regiment] = new Set()
      }
      regimentPlayers[event.regiment].add(event.player)
    }
  })
  
  // Store player counts for display
  regimentPlayerCounts.value = {}
  Object.entries(regimentPlayers).forEach(([regiment, players]) => {
    regimentPlayerCounts.value[regiment] = players.size
  })
  
  // Sort regiments by player count (highest to lowest)
  return Object.entries(regimentPlayers)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([regiment]) => regiment)
})

const getPlayerCount = (regiment) => {
  return regimentPlayerCounts.value[regiment] || 0
}

const getTeamPlayerCount = (team) => {
  let regiments = []
  if (team === 'USA') {
    regiments = usaRegiments.value
  } else if (team === 'CSA') {
    regiments = csaRegiments.value
  } else {
    regiments = unassignedRegiments.value
  }
  
  return regiments.reduce((total, regiment) => {
    return total + getPlayerCount(regiment)
  }, 0)
}

// Get regiments by team for current round
const usaRegiments = computed(() => {
  const roundId = logStore.selectedRoundId
  if (roundId === null) return []
  return allRegiments.value.filter(r => logStore.regimentTeams[roundId]?.[r] === 'USA')
})

const csaRegiments = computed(() => {
  const roundId = logStore.selectedRoundId
  if (roundId === null) return []
  return allRegiments.value.filter(r => logStore.regimentTeams[roundId]?.[r] === 'CSA')
})

const unassignedRegiments = computed(() => {
  const roundId = logStore.selectedRoundId
  if (roundId === null) return allRegiments.value
  return allRegiments.value.filter(r => !logStore.regimentTeams[roundId]?.[r])
})

const onDragStart = (event, regiment) => {
  draggedRegiment.value = regiment
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', regiment)
}

const onDrop = (event, team) => {
  event.preventDefault()
  const regiment = event.dataTransfer.getData('text/plain')
  
  if (regiment) {
    logStore.setRegimentTeam(regiment, team)
  }
  
  draggedRegiment.value = null
}

const removeTeam = (regiment) => {
  logStore.setRegimentTeam(regiment, null)
}

const clearAllAssignments = () => {
  if (confirm('Are you sure you want to clear all team assignments?')) {
    allRegiments.value.forEach(regiment => {
      logStore.setRegimentTeam(regiment, null)
    })
  }
}
</script>

<style scoped>
.drop-zone {
  transition: background-color 0.2s;
}

.drop-zone:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.v-chip {
  cursor: move;
}
</style>
