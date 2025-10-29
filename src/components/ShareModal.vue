<template>
  <v-dialog v-model="dialog" max-width="800" scrollable persistent>
    <v-card>
      <v-card-title class="bg-primary">
        <v-icon class="mr-2">mdi-share-variant</v-icon>
        Share Analysis
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- Step 1: Privacy Notice -->
        <div v-if="step === 1">
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="text-h6 mb-2">📊 What gets shared?</div>
            <p class="mb-2">
              Sharing this analysis will save a snapshot of the <strong>currently selected round</strong> to our server.
              This allows others to view the same data you're seeing.
            </p>
            <p class="mb-0">
              ✅ Shared analyses expire after <strong>30 days</strong> and are automatically deleted.
            </p>
          </v-alert>

          <v-expansion-panels class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-shield-lock</v-icon>
                <strong>Privacy Information</strong>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-2 mt-2">
                  <strong>What IS included:</strong>
                </p>
                <ul class="mb-3">
                  <li>Player names and regiment assignments</li>
                  <li>Respawn events (time, player, regiment)</li>
                  <li>Round information (map, duration, winner)</li>
                  <li>Team assignments (which regiments are USA/CSA)</li>
                  <li>Manual reassignments you've made</li>
                </ul>
                <p class="mb-2">
                  <strong>What is NOT included:</strong>
                </p>
                <ul class="mb-3">
                  <li>The original log file</li>
                  <li>IP addresses or system information</li>
                  <li>Any data from other rounds</li>
                  <li>Your browser's local storage or cache</li>
                </ul>

                <v-divider class="my-3"></v-divider>

                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon size="small" class="mr-2">mdi-code-json</v-icon>
                      Data Preview
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-textarea
                        :model-value="previewData"
                        readonly
                        rows="15"
                        variant="outlined"
                        density="compact"
                        class="mt-2"
                        style="font-family: monospace; font-size: 12px;"
                      ></v-textarea>
                      <v-chip size="small" class="mt-2">
                        {{ dataStats.events }} events • {{ dataStats.players }} players • {{ (dataStats.size / 1024).toFixed(2) }} KB
                      </v-chip>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <!-- Step 2: Loading -->
        <div v-else-if="step === 2" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          ></v-progress-circular>
          <div class="text-h6">Creating share link...</div>
          <div class="text-caption text-medium-emphasis">This may take a moment</div>
        </div>

        <!-- Step 3: Success -->
        <div v-else-if="step === 3">
          <v-alert type="success" variant="tonal" class="mb-4">
            <div class="text-h6 mb-2">✅ Share Link Created!</div>
            <p class="mb-0">Your analysis has been saved and can now be shared with others.</p>
          </v-alert>

          <v-text-field
            :model-value="shareUrl"
            label="Share URL"
            readonly
            variant="outlined"
            density="comfortable"
            class="mb-3"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyToClipboard"
          >
            <template v-slot:prepend-inner>
              <v-icon color="primary">mdi-link</v-icon>
            </template>
          </v-text-field>

          <v-alert type="info" variant="text" density="compact">
            <v-icon start>mdi-clock-outline</v-icon>
            Expires: {{ formatExpiration(expiresAt) }}
          </v-alert>
        </div>

        <!-- Step 4: Error -->
        <div v-else-if="step === 4">
          <v-alert type="error" variant="tonal" class="mb-4">
            <div class="text-h6 mb-2">❌ Error Creating Share</div>
            <p class="mb-0">{{ errorMessage }}</p>
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="step === 1"
          @click="closeDialog"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="step === 1"
          @click="createShare"
          color="primary"
          variant="elevated"
        >
          Create Share Link
        </v-btn>
        <v-btn
          v-if="step === 3"
          @click="copyAndClose"
          color="primary"
          variant="elevated"
        >
          Copy & Close
        </v-btn>
        <v-btn
          v-if="step === 4"
          @click="closeDialog"
          variant="text"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLogStore } from '../stores/logStore'
import { shareAPI } from '../services/api'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const logStore = useLogStore()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const step = ref(1) // 1: preview, 2: loading, 3: success, 4: error
const shareUrl = ref('')
const expiresAt = ref('')
const errorMessage = ref('')
const copied = ref(false)

// Generate preview data
const analysisData = computed(() => {
  if (!logStore.selectedRoundId) return null

  // Get events for selected round only
  const roundEvents = logStore.events.filter(e => e.roundId === logStore.selectedRoundId)
  
  // Get round info
  const round = logStore.rounds.find(r => r.id === logStore.selectedRoundId)
  
  // Get team assignments for this round
  const teamAssignments = {}
  const regiments = new Set(roundEvents.map(e => e.regiment))
  regiments.forEach(regiment => {
    const team = logStore.getRegimentTeam(regiment, logStore.selectedRoundId)
    if (team) {
      teamAssignments[regiment] = team
    }
  })

  // Get player sessions for selected round only
  const roundPlayerSessions = logStore.playerSessions.filter(s => s.roundId === logStore.selectedRoundId)
  
  // Get chat messages for selected round only
  const roundChatMessages = logStore.chatMessages.filter(msg => msg.roundId === logStore.selectedRoundId)

  return {
    events: roundEvents,
    roundInfo: round,
    teamAssignments,
    manualReassignments: logStore.manualReassignments,
    parsingConfig: logStore.getParsingConfig(),
    playerSessions: roundPlayerSessions,
    chatMessages: roundChatMessages
  }
})

const previewData = computed(() => {
  if (!analysisData.value) return ''
  return JSON.stringify(analysisData.value, null, 2)
})

const dataStats = computed(() => {
  if (!analysisData.value) return { events: 0, players: 0, size: 0 }
  
  const players = new Set(analysisData.value.events.map(e => e.player))
  const size = new Blob([previewData.value]).size
  
  return {
    events: analysisData.value.events.length,
    players: players.size,
    size
  }
})

// Reset state when dialog opens
watch(dialog, (newVal) => {
  if (newVal) {
    step.value = 1
    shareUrl.value = ''
    expiresAt.value = ''
    errorMessage.value = ''
    copied.value = false
  }
})

async function createShare() {
  step.value = 2
  
  try {
    const response = await shareAPI.createShare(analysisData.value)
    
    // Generate full URL
    const baseUrl = window.location.origin
    shareUrl.value = `${baseUrl}/share/${response.shareId}`
    expiresAt.value = response.expiresAt
    
    step.value = 3
  } catch (error) {
    console.error('Error creating share:', error)
    errorMessage.value = error.response?.data?.error || error.message || 'Failed to create share link'
    step.value = 4
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function copyAndClose() {
  copyToClipboard()
  setTimeout(() => {
    closeDialog()
  }, 500)
}

function closeDialog() {
  dialog.value = false
}

function formatExpiration(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
}
</script>

<style scoped>
ul {
  padding-left: 20px;
}

ul li {
  margin-bottom: 4px;
}
</style>
