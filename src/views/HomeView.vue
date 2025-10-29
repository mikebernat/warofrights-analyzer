<template>
  <v-container fluid>
    <!-- Privacy Notice -->
    <v-alert
      v-if="!logStore.fileName"
      type="info"
      variant="tonal"
      class="mb-4"
      icon="mdi-shield-lock"
    >
      <strong>Privacy Notice:</strong> All log parsing is performed locally in your browser. 
      No data is uploaded to any server. Your logs remain completely private.
    </v-alert>

    <!-- Step 1: Upload Log File or Start Live Monitoring -->
    <v-card class="mb-4">
      <v-card-title class="bg-primary">
        <v-icon class="mr-2">mdi-numeric-1-circle</v-icon>
        Step 1: Upload a Replay Log File or Monitor Live
      </v-card-title>
      <v-card-text class="pt-4">
        <div v-if="!logStore.fileName">
          <!-- Mode Toggle -->
          <v-btn-toggle
            v-model="uploadMode"
            mandatory
            color="primary"
            class="mb-4"
            divided
          >
            <v-btn value="upload">
              <v-icon start>mdi-upload</v-icon>
              Upload File
            </v-btn>
            <v-btn value="live">
              <v-icon start>mdi-monitor-eye</v-icon>
              Live Monitor
            </v-btn>
          </v-btn-toggle>

          <!-- Upload Mode -->
          <FileUploader v-if="uploadMode === 'upload'" />
        </div>
        
        <!-- Live Monitor Mode - Keep mounted to prevent unmount during initialization -->
        <LiveMonitor v-if="uploadMode === 'live'" />
        
        <!-- File loaded indicator (non-live mode) -->
        <div v-if="logStore.fileName && !logStore.isLiveMonitoring">
          <v-chip color="success" size="large" class="mr-2">
            <v-icon start>mdi-file-check</v-icon>
            {{ logStore.fileName }}
          </v-chip>
          <v-btn
            color="error"
            variant="outlined"
            @click="clearData"
            prepend-icon="mdi-delete"
            class="ml-2"
          >
            Clear Data
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Main Content -->
    <template v-if="logStore.fileName">
      <!-- Step 2: Select Round -->
      <v-card class="mb-4">
        <v-card-title :class="logStore.selectedRoundId !== null ? 'bg-primary' : 'bg-secondary'">
          <v-icon class="mr-2">mdi-numeric-2-circle</v-icon>
          Step 2: Select a Round
        </v-card-title>
        <v-card-text class="pt-4">
          <RoundSelector />
        </v-card-text>
      </v-card>

      <!-- Step 3: Update Assignments (Optional) - Only show when round selected -->
      <v-card v-if="logStore.selectedRoundId !== null" class="mb-4">
        <v-card-title class="bg-info">
          <v-icon class="mr-2">mdi-numeric-3-circle</v-icon>
          Step 3: Update Assignments (Optional)
        </v-card-title>
        <v-card-subtitle class="pt-2">
          Assign players to regiments and regiments to teams to improve analysis accuracy.
        </v-card-subtitle>
        <v-card-text>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                  <v-icon class="mr-2">mdi-pencil</v-icon>
                  <span class="font-weight-bold">Assignment Editor</span>
                  <v-spacer></v-spacer>
                  <div class="mr-4">
                    <v-chip 
                      size="small" 
                      color="warning" 
                      class="mr-2"
                      v-if="uncategorizedPlayersCount > 0"
                    >
                      {{ uncategorizedPlayersCount }} players need regiments
                    </v-chip>
                    <v-chip 
                      size="small" 
                      color="warning"
                      v-if="unassignedRegimentsCount > 0"
                    >
                      {{ unassignedRegimentsCount }} regiments need teams
                    </v-chip>
                    <v-chip 
                      size="small" 
                      color="success"
                      v-if="uncategorizedPlayersCount === 0 && unassignedRegimentsCount === 0"
                    >
                      All assigned
                    </v-chip>
                  </div>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-tabs v-model="assignmentTab" color="primary" class="mt-2">
            <v-tab value="regiment">
              <v-icon class="mr-2">mdi-account-edit</v-icon>
              Regiment Reassignment
              <v-chip 
                size="small" 
                color="warning" 
                class="ml-2" 
                v-if="uncategorizedPlayersCount > 0"
              >
                {{ uncategorizedPlayersCount }}
              </v-chip>
              <v-chip 
                size="small" 
                color="success" 
                class="ml-2" 
                v-else
              >
                ✓
              </v-chip>
            </v-tab>
            <v-tab value="team">
              <v-icon class="mr-2">mdi-shield-sword</v-icon>
              Team Assignment
              <v-chip 
                size="small" 
                color="warning" 
                class="ml-2" 
                v-if="unassignedRegimentsCount > 0"
              >
                {{ unassignedRegimentsCount }}
              </v-chip>
              <v-chip 
                size="small" 
                color="success" 
                class="ml-2" 
                v-else
              >
                ✓
              </v-chip>
            </v-tab>
          </v-tabs>

          <v-window v-model="assignmentTab" class="mt-4">
            <v-window-item value="regiment">
              <RegimentReassignment />
            </v-window-item>

            <v-window-item value="team">
              <TeamAssignment />
            </v-window-item>
          </v-window>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>

      <!-- Step 4: Filter Data - Only show when round selected -->
      <v-card v-if="logStore.selectedRoundId !== null" class="mb-4 sticky-step4">
        <v-card-title class="bg-success">
          <v-icon class="mr-2">mdi-numeric-4-circle</v-icon>
          Step 4: Filter Data
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="4">
              <FilterInput />
            </v-col>
            <v-col cols="12" md="8">
              <TimeSlider />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Analytics Cards - Only show when round selected -->
      <template v-if="logStore.selectedRoundId !== null">
        <!-- Tabs for organized content -->
        <div class="sticky-tabs-wrapper">
          <v-card class="mb-0 analysis-tabs-card" elevation="4">
            <v-tabs 
              v-model="analysisTab" 
              color="primary" 
              bg-color="surface"
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
                  <!-- Top Regiments by Players -->
                  <v-col cols="12" md="6">
                    <TopRegimentsByPlayersChart />
                  </v-col>

                  <!-- Top Regiments by Respawns -->
                  <v-col cols="12" md="6">
                    <TopRegimentsChart />
                  </v-col>
                </v-row>

                <v-row>
                  <!-- Top Players -->
                  <v-col cols="12" md="6">
                    <TopPlayersChart />
                  </v-col>

                  <!-- Respawns per Player -->
                  <v-col cols="12" md="6">
                    <RespawnsPerPlayerChart />
                  </v-col>
                </v-row>

                <v-row>
                  <!-- Regiment Timeline -->
                  <v-col cols="12">
                    <RegimentTimelineChart />
                  </v-col>
                </v-row>

                <v-row>
                  <!-- Regiment Real-Time Respawns -->
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
    </template>
  </v-container>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLogStore } from '../stores/logStore'
import { useUrlState } from '../composables/useUrlState'
import FileUploader from '../components/FileUploader.vue'
import LiveMonitor from '../components/LiveMonitor.vue'
import RoundSelector from '../components/RoundSelector.vue'
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
import TeamAssignment from '../components/TeamAssignment.vue'
import RegimentReassignment from '../components/RegimentReassignment.vue'

const router = useRouter()
const logStore = useLogStore()
const { loadFromUrl, setupWatchers } = useUrlState(logStore)

// Upload mode toggle
const uploadMode = ref('upload')

// Assignment tab state
const assignmentTab = ref('regiment')

// Analysis tab state
const analysisTab = ref('graphs')

// Count uncategorized players
const uncategorizedPlayersCount = computed(() => {
  const players = new Set()
  logStore.events.forEach(event => {
    if (event.regiment === 'Uncategorized') {
      players.add(event.player)
    }
  })
  return players.size
})

// Count unassigned regiments for selected round
const unassignedRegimentsCount = computed(() => {
  if (logStore.selectedRoundId === null) return 0
  
  const roundId = logStore.selectedRoundId
  const roundEvents = logStore.events.filter(e => e.roundId === roundId)
  const regiments = new Set(roundEvents.map(e => e.regiment))
  
  let unassigned = 0
  regiments.forEach(regiment => {
    // Exclude 'Uncategorized' from count (handled in Regiment Reassignment)
    if (regiment !== 'Uncategorized' && !logStore.getRegimentTeam(regiment, roundId)) {
      unassigned++
    }
  })
  
  return unassigned
})

onMounted(() => {
  // Try to load from cache on startup
  logStore.loadFromCache()
  
  // Load state from URL parameters
  loadFromUrl()
  
  // Setup watchers to sync state to URL
  setupWatchers()
})

const clearData = () => {
  if (confirm('Are you sure you want to clear all data? This will remove the cached log and reset everything.')) {
    logStore.clearCache()
    
    // Clear URL parameters and reload
    router.push('/').then(() => {
      window.location.href = '/'
    })
  }
}
</script>

<style scoped>
.sticky-step4 {
  position: sticky;
  top: 64px; /* Height of Vuetify app bar */
  z-index: 10;
}

.sticky-tabs-wrapper {
  position: sticky;
  top: calc(129px + 100px); /* App bar (64px) + Step 4 card height */
  z-index: 9;
  margin-bottom: 0;
}

.sticky-tabs-wrapper .analysis-tabs-card {
  margin-bottom: 0 !important;
}

.analysis-tabs-card {
  border: 1px solid rgba(128, 128, 128, 0.3) !important;
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
}

.analysis-tabs-card :deep(.v-tab--selected) {
  background-color: rgb(var(--v-theme-primary));
  color: white !important;
  outline: none !important;
  box-shadow: none !important;
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
