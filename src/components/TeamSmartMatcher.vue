<template>
  <v-dialog v-model="dialog" max-width="800">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        color="primary"
        variant="elevated"
        prepend-icon="mdi-auto-fix"
      >
        Smart Team Matcher
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="bg-primary">
        <v-icon class="mr-2">mdi-auto-fix</v-icon>
        Smart Team Matcher
      </v-card-title>

      <v-card-text class="pt-4">
        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">How it works:</div>
          <ul class="text-body-2">
            <li>Analyzes team chat messages to identify which regiments communicated together</li>
            <li>Since only same-team chat is logged, regiments that chatted are on the same team</li>
          </ul>
        </v-alert>

        <template v-if="!analysisComplete">
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="text-h6 mb-3">Step 1: Select Your Team</div>
              <p class="text-body-2 mb-3">
                Which team were you playing on during this round?
              </p>
              <v-radio-group v-model="userTeam" inline>
                <v-radio label="USA (Union)" value="USA" color="blue"></v-radio>
                <v-radio label="CSA (Confederate)" value="CSA" color="red"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="text-h6 mb-3">Step 2: Analyze Chat</div>
              <v-btn
                color="primary"
                :disabled="!userTeam"
                @click="analyzeTeams"
                prepend-icon="mdi-magnify"
                block
              >
                Analyze Chat Messages
              </v-btn>
            </v-card-text>
          </v-card>
        </template>

        <template v-else>
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="text-h6 mb-3">Analysis Results</div>
              
              <v-alert type="success" variant="tonal" class="mb-3">
                <div class="text-subtitle-2 font-weight-bold">
                  Found {{ chattingRegiments.size }} regiments in team chat
                </div>
              </v-alert>

              <v-row>
                <v-col cols="6">
                  <div class="text-subtitle-1 font-weight-bold mb-2" :class="userTeam === 'USA' ? 'text-blue' : 'text-red'">
                    {{ userTeam }} (Your Team)
                  </div>
                  <v-chip
                    v-for="regiment in userTeamRegiments"
                    :key="regiment"
                    size="small"
                    :color="userTeam === 'USA' ? 'blue' : 'red'"
                    class="ma-1"
                  >
                    {{ regiment }}
                  </v-chip>
                  <div v-if="userTeamRegiments.length === 0" class="text-body-2 text-medium-emphasis">
                    No regiments found in chat
                  </div>
                </v-col>

                <v-col cols="6">
                  <div class="text-subtitle-1 font-weight-bold mb-2" :class="autoAssignOpposing ? (opposingTeam === 'USA' ? 'text-blue' : 'text-red') : 'text-grey'">
                    {{ autoAssignOpposing ? opposingTeam + ' (Opposing Team)' : 'Unassigned' }}
                  </div>
                  <v-chip
                    v-for="regiment in opposingTeamRegiments"
                    :key="regiment"
                    size="small"
                    :color="autoAssignOpposing ? (opposingTeam === 'USA' ? 'blue' : 'red') : 'grey'"
                    class="ma-1"
                  >
                    {{ regiment }}
                  </v-chip>
                  <div v-if="opposingTeamRegiments.length === 0" class="text-body-2 text-medium-emphasis">
                    No regiments (all were in chat)
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3"></v-divider>

              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="mr-1">mdi-information</v-icon>
                Based on {{ totalChatMessages }} team chat messages
              </div>
            </v-card-text>
          </v-card>

          <v-alert type="warning" variant="tonal" class="mb-4" v-if="chattingRegiments.size === 0">
            <div class="text-subtitle-2 font-weight-bold mb-1">No chat messages found</div>
            <p class="text-body-2 mb-0">
              This round has no team chat messages. Team assignments cannot be inferred.
              You'll need to assign teams manually.
            </p>
          </v-alert>

          <v-alert type="warning" variant="tonal" class="mb-4" v-if="chattingRegiments.size > 0 && opposingTeamRegiments.length === 0">
            <div class="text-subtitle-2 font-weight-bold mb-1">All regiments were chatting</div>
            <p class="text-body-2 mb-0">
              All regiments appear in the chat logs. This suggests everyone was on the same team,
              which is unusual. Please verify the assignments manually.
            </p>
          </v-alert>

          <v-card variant="outlined" class="mb-4" v-if="opposingTeamRegiments.length > 0">
            <v-card-text>
              <div class="text-h6 mb-3">Assignment Options</div>
              <v-checkbox
                v-model="autoAssignOpposing"
                label="Auto-assign regiments without chat to opposing team"
                hint="If unchecked, regiments without chat messages will remain unassigned"
                persistent-hint
                color="primary"
                density="compact"
              ></v-checkbox>
            </v-card-text>
          </v-card>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!analysisComplete"
          @click="dialog = false"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="analysisComplete"
          @click="resetAnalysis"
          variant="text"
        >
          Back
        </v-btn>
        <v-btn
          v-if="analysisComplete"
          @click="applyAssignments"
          color="primary"
          variant="elevated"
          :disabled="chattingRegiments.size === 0"
          prepend-icon="mdi-check"
        >
          Apply Assignments
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

const dialog = ref(false)
const userTeam = ref(null)
const autoAssignOpposing = ref(false)
const analysisComplete = ref(false)
const chattingRegiments = ref(new Set())

const opposingTeam = computed(() => {
  return userTeam.value === 'USA' ? 'CSA' : 'USA'
})

// Get all regiments that appear in chat for the selected round
const totalChatMessages = computed(() => {
  return logStore.chatMessages.filter(msg => 
    msg.roundId === logStore.selectedRoundId
  ).length
})

// Get all unique regiments from events in the selected round
const allRegiments = computed(() => {
  const regiments = new Set()
  logStore.events.forEach(event => {
    if (event.roundId === logStore.selectedRoundId && event.regiment !== 'Uncategorized') {
      regiments.add(event.regiment)
    }
  })
  return Array.from(regiments)
})

// Regiments assigned to user's team (those that chatted)
const userTeamRegiments = computed(() => {
  return Array.from(chattingRegiments.value).sort()
})

// Regiments assigned to opposing team (those that didn't chat)
const opposingTeamRegiments = computed(() => {
  return allRegiments.value.filter(reg => !chattingRegiments.value.has(reg)).sort()
})

function analyzeTeams() {
  // Get all regiments that appear in team chat for this round
  const chatRegiments = new Set()
  
  logStore.chatMessages.forEach(msg => {
    if (msg.roundId === logStore.selectedRoundId && msg.regiment !== 'Uncategorized') {
      chatRegiments.add(msg.regiment)
    }
  })
  
  chattingRegiments.value = chatRegiments
  analysisComplete.value = true
}

function applyAssignments() {
  // Assign chatting regiments to user's team
  userTeamRegiments.value.forEach(regiment => {
    logStore.setRegimentTeam(regiment, userTeam.value, logStore.selectedRoundId)
  })
  
  // Conditionally assign non-chatting regiments
  if (autoAssignOpposing.value) {
    // Assign non-chatting regiments to opposing team
    opposingTeamRegiments.value.forEach(regiment => {
      logStore.setRegimentTeam(regiment, opposingTeam.value, logStore.selectedRoundId)
    })
  }
  // If autoAssignOpposing is false, non-chatting regiments remain unassigned
  
  // Close dialog and reset
  dialog.value = false
  resetAnalysis()
}

function resetAnalysis() {
  analysisComplete.value = false
  chattingRegiments.value = new Set()
}

// Reset when dialog closes
function handleDialogClose() {
  if (!dialog.value) {
    resetAnalysis()
  }
}
</script>

<style scoped>
.text-blue {
  color: rgb(33, 150, 243);
}

.text-red {
  color: rgb(244, 67, 54);
}
</style>
