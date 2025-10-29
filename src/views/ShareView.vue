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

      <!-- Combined Round Info and Filters (Sticky) -->
      <v-card class="mb-4 sticky-filters">
        <v-card-title class="bg-primary">
          <v-icon class="mr-2">mdi-information</v-icon>
          Round Information & Filters
        </v-card-title>
        <v-card-text class="pt-4">
          <!-- Round Info -->
          <v-row class="mb-4">
            <v-col cols="12">
              <div class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px;">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis mr-2">Map:</span>
                  <span class="text-h6">{{ shareData.roundInfo.map }}</span>
                </div>
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis mr-2">Duration:</span>
                  <span class="text-h6">{{ formatDuration(shareData.roundInfo.endTime - shareData.roundInfo.startTime) }}</span>
                </div>
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis mr-2">Winner:</span>
                  <v-chip 
                    v-if="shareData.roundInfo.winner"
                    :color="shareData.roundInfo.winner === 'USA' ? 'blue' : 'red'"
                    size="small"
                  >
                    {{ shareData.roundInfo.winner }}
                  </v-chip>
                  <v-chip v-else color="grey" size="small">
                    N/A
                  </v-chip>
                </div>
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis mr-2">Total Respawns:</span>
                  <span class="text-h6">{{ shareData.events.length }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
          
          <!-- Filters -->
          <v-row>
            <v-col cols="12" md="4">
              <FilterInput />
            </v-col>
            <v-col cols="12" md="8">
              <TimeSlider />
            </v-col>
          </v-row>

          <!-- Quick Filters -->
          <v-row>
            <v-col cols="12">
              <div class="d-flex align-center flex-wrap">
                <span class="text-subtitle-2 mr-3">Quick Filters:</span>
                <!-- USA Team -->
                <v-menu v-if="usaRegiments.length > 0">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      :color="isTeamSelected('USA') ? 'blue' : 'default'"
                      :variant="isTeamSelected('USA') ? 'flat' : 'outlined'"
                      class="mr-2"
                    >
                      <v-icon start>mdi-flag</v-icon>
                      <span @click="toggleTeam('USA')">USA ({{ usaRegiments.length }})</span>
                      <v-icon end v-bind="props">mdi-chevron-down</v-icon>
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="regiment in usaRegiments"
                      :key="regiment"
                      @click="toggleRegiment(regiment)"
                    >
                      <template v-slot:prepend>
                        <v-checkbox-btn
                          :model-value="selectedRegiments.includes(regiment)"
                          @click.stop="toggleRegiment(regiment)"
                        ></v-checkbox-btn>
                      </template>
                      <v-list-item-title>{{ regiment }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <!-- CSA Team -->
                <v-menu v-if="csaRegiments.length > 0">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      :color="isTeamSelected('CSA') ? 'red' : 'default'"
                      :variant="isTeamSelected('CSA') ? 'flat' : 'outlined'"
                      class="mr-2"
                    >
                      <v-icon start>mdi-flag</v-icon>
                      <span @click="toggleTeam('CSA')">CSA ({{ csaRegiments.length }})</span>
                      <v-icon end v-bind="props">mdi-chevron-down</v-icon>
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="regiment in csaRegiments"
                      :key="regiment"
                      @click="toggleRegiment(regiment)"
                    >
                      <template v-slot:prepend>
                        <v-checkbox-btn
                          :model-value="selectedRegiments.includes(regiment)"
                          @click.stop="toggleRegiment(regiment)"
                        ></v-checkbox-btn>
                      </template>
                      <v-list-item-title>{{ regiment }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <!-- Unassigned -->
                <v-menu v-if="unassignedRegiments.length > 0">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      :color="isTeamSelected(null) ? 'grey' : 'default'"
                      :variant="isTeamSelected(null) ? 'flat' : 'outlined'"
                      class="mr-2"
                    >
                      <v-icon start>mdi-help-circle</v-icon>
                      <span @click="toggleTeam(null)">Unassigned ({{ unassignedRegiments.length }})</span>
                      <v-icon end v-bind="props">mdi-chevron-down</v-icon>
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="regiment in unassignedRegiments"
                      :key="regiment"
                      @click="toggleRegiment(regiment)"
                    >
                      <template v-slot:prepend>
                        <v-checkbox-btn
                          :model-value="selectedRegiments.includes(regiment)"
                          @click.stop="toggleRegiment(regiment)"
                        ></v-checkbox-btn>
                      </template>
                      <v-list-item-title>{{ regiment }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <!-- Uncategorized -->
                <v-chip
                  v-if="hasUncategorized"
                  :color="selectedRegiments.includes('Uncategorized') ? 'warning' : 'default'"
                  :variant="selectedRegiments.includes('Uncategorized') ? 'flat' : 'outlined'"
                  @click="toggleRegiment('Uncategorized')"
                  class="mr-2"
                >
                  <v-icon start>mdi-account-question</v-icon>
                  Uncategorized ({{ uncategorizedCount }})
                </v-chip>

                <!-- Clear Filters -->
                <v-chip
                  v-if="selectedRegiments.length > 0"
                  color="error"
                  variant="outlined"
                  @click="clearRegimentFilters"
                  prepend-icon="mdi-close"
                >
                  Clear
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Tabs for organized content -->
      <div class="sticky-tabs-wrapper">
        <v-card class="mb-0 analysis-tabs-card" elevation="4">
          <v-tabs 
            v-model="analysisTab" 
            color="primary" 
            bg-color="#2a2a2a"
            height="60"
            slider-color="grey-darken-2"
            show-arrows
          >
            <v-tab value="graphs" class="text-h6">
              <v-icon class="mr-2" size="large">mdi-chart-line</v-icon>
              Graphs
            </v-tab>
            <v-tab value="players" class="text-h6">
              <v-icon class="mr-2" size="large">mdi-account-group</v-icon>
              Players
            </v-tab>
            <v-tab value="chat" class="text-h6">
              <v-icon class="mr-2" size="large">mdi-chat</v-icon>
              Chat
            </v-tab>
          </v-tabs>
        </v-card>
      </div>

      <v-card class="mb-4 analysis-tabs-card" elevation="4">
        <v-window v-model="analysisTab" class="analysis-window">
          <!-- Tab 1: Graphs -->
          <v-window-item value="graphs">
            <v-container fluid class="bg-black">
              <v-row>
                <v-col cols="12">
                  <KpiCard />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <RespawnsTimelineChart />
                </v-col>
              </v-row>

              <v-row>
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
                  <RegimentRespawnsRealTimeChart />
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>

          <!-- Tab 2: Players -->
          <v-window-item value="players">
            <v-container fluid class="bg-black">
              <v-row>
                <v-col cols="12">
                  <PlayersTable />
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>

          <!-- Tab 3: Chat -->
          <v-window-item value="chat">
            <v-container fluid class="bg-black">
              <v-row>
                <v-col cols="12">
                  <ChatTable />
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card>
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
import RegimentRespawnsRealTimeChart from '../components/RegimentRespawnsRealTimeChart.vue'
import RespawnsPerPlayerChart from '../components/RespawnsPerPlayerChart.vue'
import PlayersTable from '../components/PlayersTable.vue'
import ChatTable from '../components/ChatTable.vue'

const route = useRoute()
const router = useRouter()
const logStore = useLogStore()
const { loadFromUrl, setupWatchers } = useUrlState(logStore)

const shareId = ref(route.params.shareId)
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const shareData = ref(null)
const analysisTab = ref('graphs')
const selectedRegiments = ref([])

// Get regiments by team
const usaRegiments = computed(() => {
  if (!shareData.value) return []
  const regiments = []
  Object.entries(shareData.value.teamAssignments).forEach(([regiment, team]) => {
    if (team === 'USA') regiments.push(regiment)
  })
  return regiments.sort()
})

const csaRegiments = computed(() => {
  if (!shareData.value) return []
  const regiments = []
  Object.entries(shareData.value.teamAssignments).forEach(([regiment, team]) => {
    if (team === 'CSA') regiments.push(regiment)
  })
  return regiments.sort()
})

const unassignedRegiments = computed(() => {
  if (!shareData.value) return []
  const allRegiments = new Set(shareData.value.events.map(e => e.regiment))
  const assignedRegiments = new Set(Object.keys(shareData.value.teamAssignments))
  const unassigned = []
  allRegiments.forEach(regiment => {
    if (!assignedRegiments.has(regiment) && regiment !== 'Uncategorized') {
      unassigned.push(regiment)
    }
  })
  return unassigned.sort()
})

// Check if a team is selected (all regiments from that team)
function isTeamSelected(team) {
  let teamRegiments = []
  if (team === 'USA') teamRegiments = usaRegiments.value
  else if (team === 'CSA') teamRegiments = csaRegiments.value
  else teamRegiments = unassignedRegiments.value
  
  if (teamRegiments.length === 0) return false
  return teamRegiments.every(r => selectedRegiments.value.includes(r))
}

// Toggle entire team
function toggleTeam(team) {
  let teamRegiments = []
  if (team === 'USA') teamRegiments = usaRegiments.value
  else if (team === 'CSA') teamRegiments = csaRegiments.value
  else teamRegiments = unassignedRegiments.value
  
  const allSelected = isTeamSelected(team)
  
  if (allSelected) {
    // Remove all team regiments
    selectedRegiments.value = selectedRegiments.value.filter(r => !teamRegiments.includes(r))
  } else {
    // Add all team regiments
    teamRegiments.forEach(r => {
      if (!selectedRegiments.value.includes(r)) {
        selectedRegiments.value.push(r)
      }
    })
  }
  
  applyRegimentFilter()
}

// Toggle individual regiment
function toggleRegiment(regiment) {
  const index = selectedRegiments.value.indexOf(regiment)
  if (index > -1) {
    selectedRegiments.value.splice(index, 1)
  } else {
    selectedRegiments.value.push(regiment)
  }
  applyRegimentFilter()
}

// Apply regiment filter to store
function applyRegimentFilter() {
  logStore.selectedRegimentFilter = selectedRegiments.value
}

// Clear all regiment filters
function clearRegimentFilters() {
  selectedRegiments.value = []
  logStore.selectedRegimentFilter = []
}

// Computed properties
const uniquePlayersCount = computed(() => {
  const players = new Set(logStore.filteredEvents.map(e => e.player))
  return players.size
})

const uniqueRegimentsCount = computed(() => {
  const regiments = new Set(logStore.filteredEvents.map(e => e.regiment))
  return regiments.size
})

// Count uncategorized players
const uncategorizedCount = computed(() => {
  if (!shareData.value) return 0
  const players = new Set()
  shareData.value.events.forEach(event => {
    if (event.regiment === 'Uncategorized') {
      players.add(event.player)
    }
  })
  return players.size
})

// Check if there are uncategorized players
const hasUncategorized = computed(() => {
  return uncategorizedCount.value > 0
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
    shareData.value = response
    
    // Load data into store
    logStore.events = shareData.value.events
    logStore.rounds = [shareData.value.roundInfo]
    logStore.selectedRoundId = shareData.value.roundInfo.id
    logStore.fileName = `Shared: ${shareData.value.roundInfo.map}`
    
    // Load player sessions (presence time data)
    logStore.playerSessions = shareData.value.playerSessions || []
    
    // Load chat messages
    logStore.chatMessages = shareData.value.chatMessages || []
    
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
.sticky-filters {
  position: sticky;
  top: 64px; /* Height of Vuetify app bar */
  z-index: 10;
}

.sticky-tabs-wrapper {
  position: sticky;
  top: calc(257px + 100px); /* App bar (64px) + Filters card height */
  z-index: 9;
  margin-bottom: 0;
}

.sticky-tabs-wrapper .analysis-tabs-card {
  margin-bottom: 0 !important;
}

.analysis-tabs-card {
  border: none !important;
  background-color: #2a2a2a !important;
}

.analysis-tabs-card :deep(.v-tabs) {
  background-color: #2a2a2a !important;
}

.analysis-tabs-card :deep(.v-slide-group__content) {
  border-bottom: 3px solid #424242 !important;
}

.analysis-tabs-card :deep(.v-tab.v-tab.v-btn) {
  border-bottom: 3px solid #424242;
}

.analysis-tabs-card :deep(.v-tabs-window-item) {
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-top: none;
}

.analysis-tabs-card :deep(.v-tab) {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 1.1rem;
  background-color: #2a2a2a !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

.analysis-tabs-card :deep(.v-tab) .v-icon {
  color: rgba(255, 255, 255, 0.7) !important;
}

.analysis-tabs-card :deep(.v-tab--selected) {
  background-color: #3a3a3a !important;
  color: white !important;
  outline: none !important;
  box-shadow: none !important;
  border-bottom: 3px solid #2196F3 !important;
}

.analysis-tabs-card :deep(.v-tab--selected) .v-icon {
  color: white !important;
}

.analysis-tabs-card :deep(.v-tab--selected) .v-tab__slider {
  color: rgba(128, 128, 128, 0.3) !important;
}

.analysis-tabs-card :deep(.v-tabs__slider) {
  background-color: rgba(128, 128, 128, 0.3) !important;
}

.analysis-tabs-card :deep(.v-tab:focus-visible) {
  outline: none !important;
}

.analysis-tabs-card :deep(.v-tab::before) {
  opacity: 0 !important;
}

.analysis-tabs-card :deep(.v-tab::after) {
  opacity: 0 !important;
}

.analysis-tabs-card :deep(.v-tabs) {
  border-bottom: none !important;
}

.analysis-window {
  background-color: #121212;
}

.bg-black {
  background-color: #121212 !important;
}
</style>
