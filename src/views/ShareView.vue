<template>
  <v-container fluid>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
        class="mb-4"
      ></v-progress-circular>
      <div class="text-h5">Loading shared analysis...</div>
      <div class="text-caption text-medium-emphasis">{{ shareId }}</div>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      <div class="text-h6 mb-2">❌ Failed to Load Share</div>
      <p>{{ errorMessage }}</p>
      <v-btn
        color="primary"
        variant="elevated"
        class="mt-4"
        @click="$router.push('/')"
      >
        Go to Home
      </v-btn>
    </v-alert>

    <!-- Loaded State -->
    <template v-else-if="shareData">
      <!-- Shared Analysis Notice -->
      <v-alert type="info" variant="tonal" class="mb-4" prominent>
        <div class="d-flex align-center">
          <v-icon size="large" class="mr-4">mdi-share-variant</v-icon>
          <div class="flex-grow-1">
            <div class="text-h6 mb-1">📊 Viewing Shared Analysis</div>
            <p class="mb-2">
              This is a read-only view of a shared round analysis.
              <strong>Any changes you make (filters, assignments) are not saved.</strong>
            </p>
            <div class="text-caption">
              <v-icon size="small">mdi-clock-outline</v-icon>
              Shared: {{ formatDate(shareData.metadata.createdAt) }} • 
              Expires: {{ formatDate(shareData.metadata.expiresAt) }}
            </div>
          </div>
        </div>
      </v-alert>

      <!-- Round Info Card -->
      <v-card class="mb-4">
        <v-card-title class="bg-primary">
          <v-icon class="mr-2">mdi-information</v-icon>
          Round Information
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">Map</div>
              <div class="text-h6">{{ shareData.roundInfo.map }}</div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">Duration</div>
              <div class="text-h6">{{ formatDuration(shareData.roundInfo.endTime - shareData.roundInfo.startTime) }}</div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">Winner</div>
              <div class="text-h6">
                <v-chip :color="shareData.roundInfo.winner === 'USA' ? 'blue' : 'red'">
                  {{ shareData.roundInfo.winner }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">Total Respawns</div>
              <div class="text-h6">{{ shareData.events.length }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Filters -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <TimeSlider />
            </v-col>
            <v-col cols="12">
              <FilterInput />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- KPI Cards -->
      <v-row>
          <!-- KPI Card -->
          <v-col cols="12">
            <KpiCard />
          </v-col>
        </v-row>

        <v-row>
          <!-- Respawns Over Time -->
          <v-col cols="12">
            <RespawnsTimelineChart />
          </v-col>
        </v-row>

        <v-row>
          <!-- Cumulative Respawns -->
          <v-col cols="12">
            <CumulativeRespawnsChart />
          </v-col>
        </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <TopRegimentsByPlayersChart />
        </v-col>
        <v-col cols="12" md="6">
          <TopRegimentsChart />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <TopPlayersChart />
        </v-col>
        <v-col cols="12" md="6">
          <RespawnsPerPlayerChart />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <RegimentTimelineChart />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <PlayersTable />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLogStore } from '../stores/logStore'
import { useUrlState } from '../composables/useUrlState'
import { shareAPI } from '../services/api'
import TimeSlider from '../components/TimeSlider.vue'
import FilterInput from '../components/FilterInput.vue'
import KpiCard from '../components/KpiCard.vue'
import RespawnsTimelineChart from '../components/RespawnsTimelineChart.vue'
import CumulativeRespawnsChart from '../components/CumulativeRespawnsChart.vue'
import TopRegimentsByPlayersChart from '../components/TopRegimentsByPlayersChart.vue'
import TopRegimentsChart from '../components/TopRegimentsChart.vue'
import TopPlayersChart from '../components/TopPlayersChart.vue'
import RegimentTimelineChart from '../components/RegimentTimelineChart.vue'
import RespawnsPerPlayerChart from '../components/RespawnsPerPlayerChart.vue'
import PlayersTable from '../components/PlayersTable.vue'

const route = useRoute()
const router = useRouter()
const logStore = useLogStore()
const { loadFromUrl, setupWatchers } = useUrlState(logStore)

const shareId = ref(route.params.shareId)
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const shareData = ref(null)

// Computed properties
const uniquePlayersCount = computed(() => {
  const players = new Set(logStore.filteredEvents.map(e => e.player))
  return players.size
})

const uniqueRegimentsCount = computed(() => {
  const regiments = new Set(logStore.filteredEvents.map(e => e.regiment))
  return regiments.size
})

const timeRangeDisplay = computed(() => {
  const duration = logStore.timeRange[1] - logStore.timeRange[0]
  const minutes = Math.floor(duration / 60)
  return `${minutes}m`
})

async function loadSharedAnalysis() {
  try {
    loading.value = true
    error.value = false
    
    const response = await shareAPI.getShare(shareId.value)
    shareData.value = response.data
    
    // Load data into store
    logStore.events = shareData.value.events
    logStore.rounds = [shareData.value.roundInfo]
    logStore.selectedRoundId = shareData.value.roundInfo.id
    logStore.fileName = `Shared: ${shareData.value.roundInfo.map}`
    
    // Load player sessions (presence time data)
    logStore.playerSessions = shareData.value.playerSessions || []
    
    // Load team assignments
    Object.entries(shareData.value.teamAssignments).forEach(([regiment, team]) => {
      logStore.setRegimentTeam(regiment, team, shareData.value.roundInfo.id)
    })
    
    // Set time range
    const times = shareData.value.events.map(e => e.time)
    logStore.timeRange = [Math.min(...times), Math.max(...times)]
    
    // Load URL parameters (filters)
    loadFromUrl()
    
    // Setup watchers for URL sync
    setupWatchers()
    
    loading.value = false
  } catch (err) {
    console.error('Error loading shared analysis:', err)
    error.value = true
    errorMessage.value = err.response?.data?.error || err.message || 'Failed to load shared analysis'
    loading.value = false
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

onMounted(() => {
  loadSharedAnalysis()
})
</script>

<style scoped>
/* Add any specific styles for share view */
</style>
