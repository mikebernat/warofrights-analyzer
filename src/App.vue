<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>
        <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
        War of Rights Log Analyzer
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="logStore.fileName" color="success" class="mr-2">
        <v-icon start>mdi-file-check</v-icon>
        {{ logStore.fileName }}
      </v-chip>
    </v-app-bar>

    <v-main>
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

        <!-- Step 1: Upload Log File -->
        <v-card class="mb-4">
          <v-card-title class="bg-primary">
            <v-icon class="mr-2">mdi-numeric-1-circle</v-icon>
            Step 1: Upload a Replay Log File
          </v-card-title>
          <v-card-text class="pt-4">
            <FileUploader v-if="!logStore.fileName" />
            <div v-else>
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
            <v-card-text>
              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                      <v-icon class="mr-2">mdi-account-edit</v-icon>
                      <span class="font-weight-bold">Regiment Reassignment</span>
                      <v-spacer></v-spacer>
                      <div class="mr-4">
                        <v-chip size="small" color="warning" class="mr-2" v-if="uncategorizedPlayersCount > 0">
                          {{ uncategorizedPlayersCount }} players need regiments
                        </v-chip>
                        <v-chip size="small" color="success" v-else>
                          All players assigned
                        </v-chip>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <RegimentReassignment />
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                      <v-icon class="mr-2">mdi-flag</v-icon>
                      <span class="font-weight-bold">Team Assignment</span>
                      <v-spacer></v-spacer>
                      <div class="mr-4">
                        <v-chip size="small" color="warning" class="mr-2" v-if="unassignedTeamsCount > 0">
                          {{ unassignedTeamsCount }} regiments need teams
                        </v-chip>
                        <v-chip size="small" color="success" v-else>
                          All regiments assigned
                        </v-chip>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <TeamAssignment />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>

          <!-- Step 4: Filter Data - Only show when round selected -->
          <v-card v-if="logStore.selectedRoundId !== null" class="mb-4 sticky-filter">
            <v-card-title class="bg-success">
              <v-icon class="mr-2">mdi-numeric-4-circle</v-icon>
              Step 4: Filter Data
            </v-card-title>
            <v-card-text class="pt-4">
              <v-row>
                <v-col cols="12" md="8">
                  <TimeSlider />
                </v-col>
                <v-col cols="12" md="4">
                  <FilterInput />
                </v-col>
              </v-row>
              <v-row class="mt-2">
                <v-col>
                  <v-btn
                    color="warning"
                    variant="outlined"
                    prepend-icon="mdi-filter-off"
                    @click="resetFilters"
                    class="mr-2"
                  >
                    Reset Filters
                  </v-btn>
                  <v-btn
                    color="success"
                    variant="outlined"
                    prepend-icon="mdi-download"
                    @click="logStore.exportCSV()"
                  >
                    Export CSV
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Analytics Cards - Only show when round selected -->
          <template v-if="logStore.selectedRoundId !== null">
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
            <!-- Players Table -->
            <v-col cols="12">
              <PlayersTable />
            </v-col>
          </v-row>
          </template>
        </template>
      </v-container>
    </v-main>

    <!-- Loading Overlay -->
    <v-overlay :model-value="logStore.loading" class="align-center justify-center">
      <v-card width="400" class="pa-4">
        <v-card-title>Parsing Log File...</v-card-title>
        <v-card-text>
          <v-progress-linear
            :model-value="logStore.progress"
            color="primary"
            height="25"
          >
            <strong>{{ logStore.progress }}%</strong>
          </v-progress-linear>
        </v-card-text>
      </v-card>
    </v-overlay>
  </v-app>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useLogStore } from './stores/logStore'
import FileUploader from './components/FileUploader.vue'
import RoundSelector from './components/RoundSelector.vue'
import TimeSlider from './components/TimeSlider.vue'
import FilterInput from './components/FilterInput.vue'
import KpiCard from './components/KpiCard.vue'
import RespawnsTimelineChart from './components/RespawnsTimelineChart.vue'
import CumulativeRespawnsChart from './components/CumulativeRespawnsChart.vue'
import TopRegimentsByPlayersChart from './components/TopRegimentsByPlayersChart.vue'
import TopRegimentsChart from './components/TopRegimentsChart.vue'
import TopPlayersChart from './components/TopPlayersChart.vue'
import RegimentTimelineChart from './components/RegimentTimelineChart.vue'
import RespawnsPerPlayerChart from './components/RespawnsPerPlayerChart.vue'
import PlayersTable from './components/PlayersTable.vue'
import TeamAssignment from './components/TeamAssignment.vue'
import RegimentReassignment from './components/RegimentReassignment.vue'

const logStore = useLogStore()

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

// Count regiments without team assignment for current round
const unassignedTeamsCount = computed(() => {
  const roundId = logStore.selectedRoundId
  
  // Get unique regiments from current round or all events
  const regiments = new Set()
  const eventsToCheck = roundId !== null
    ? logStore.events.filter(e => e.roundId === roundId)
    : logStore.events
  
  eventsToCheck.forEach(event => {
    if (event.regiment !== 'Uncategorized') {
      regiments.add(event.regiment)
    }
  })
  
  // Count how many don't have team assignments
  let unassigned = 0
  regiments.forEach(regiment => {
    if (!logStore.getRegimentTeam(regiment, roundId)) {
      unassigned++
    }
  })
  
  return unassigned
})

onMounted(() => {
  // Try to load from cache on startup
  logStore.loadFromCache()
})

const clearData = () => {
  if (confirm('Are you sure you want to clear all data? This will remove the cached log.')) {
    logStore.clearCache()
  }
}

const resetFilters = () => {
  // Reset text filter
  logStore.filterText = ''
  
  // Reset time range to min/max
  if (logStore.selectedRoundId !== null) {
    const round = logStore.rounds.find(r => r.id === logStore.selectedRoundId)
    if (round) {
      logStore.timeRange = [round.startTime, round.endTime]
      logStore.timeOffset = round.startTime
    }
  }
}
</script>

<style scoped>
.sticky-filter {
  position: sticky;
  top: 64px; /* Height of Vuetify app bar */
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
