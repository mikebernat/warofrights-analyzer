<template>
  <v-select
    v-model="selectedRound"
    :items="roundOptions"
    label="Select Round"
    prepend-inner-icon="mdi-flag-checkered"
    variant="outlined"
    density="comfortable"
    hint="Filter data by specific round"
    persistent-hint
    clearable
    @update:model-value="updateSelectedRound"
  >
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <template v-slot:prepend>
          <v-icon :color="getStatusColor(item.raw.status)">
            {{ getStatusIcon(item.raw.status) }}
          </v-icon>
        </template>
        <template v-slot:append>
          <v-chip
            v-if="item.raw.winner"
            size="small"
            :color="item.raw.winner === 'USA' ? 'blue' : 'red'"
          >
            {{ item.raw.winner }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
    <template v-slot:selection="{ item }">
      <span>{{ item.title }}</span>
      <v-chip
        v-if="item.raw.winner"
        size="x-small"
        class="ml-2"
        :color="item.raw.winner === 'USA' ? 'blue' : 'red'"
      >
        {{ item.raw.winner }}
      </v-chip>
    </template>
  </v-select>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const selectedRound = ref(null)

// Sync local ref with store on mount and when store changes
watch(() => logStore.selectedRoundId, (newRoundId) => {
  selectedRound.value = newRoundId
}, { immediate: true })

const roundOptions = computed(() => {
  return logStore.rounds.map(round => {
    const duration = round.endTime - round.startTime
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const durationStr = `${minutes}m ${seconds}s`
    
    const respawnCount = round.respawns?.length || 0
    
    // Format start and end times in UTC
    const startDate = new Date(round.startTime * 1000)
    const endDate = new Date(round.endTime * 1000)
    
    // Get time in 12-hour format (e.g., "7:31pm")
    const startTimeStr = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).toLowerCase().replace(/\s/g, '')
    
    const endTimeStr = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).toLowerCase().replace(/\s/g, '')
    
    let title = `Round ${round.id}`
    if (round.map) {
      title += ` - ${round.map}`
    }
    title += ` ${startTimeStr} - ${endTimeStr}`
    title += ` (${durationStr}, ${respawnCount} respawns)`
    
    return {
      value: round.id,
      title: title,
      status: round.status,
      winner: round.winner,
      raw: round
    }
  })
})

// Watch for store changes (when new log is loaded)
watch(() => logStore.rounds, () => {
  selectedRound.value = null
}, { deep: true })

const updateSelectedRound = (roundId) => {
  logStore.setSelectedRound(roundId)
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'Complete':
      return 'mdi-check-circle'
    case 'Incomplete':
      return 'mdi-alert-circle'
    case 'Pseudo':
      return 'mdi-information'
    default:
      return 'mdi-circle'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Complete':
      return 'success'
    case 'Incomplete':
      return 'warning'
    case 'Pseudo':
      return 'info'
    default:
      return 'grey'
  }
}
</script>
