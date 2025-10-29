<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chat</v-icon>
      Team Chat
      <v-spacer></v-spacer>
      <v-chip size="small" color="primary">
        {{ filteredChatMessages.length }} messages
      </v-chip>
    </v-card-title>

    <v-card-subtitle class="pt-2">
      <v-alert type="info" variant="text" density="compact">
        <v-icon start size="small">mdi-information</v-icon>
        Only team chat is available in game logs.
      </v-alert>
    </v-card-subtitle>

    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="filteredChatMessages"
        :items-per-page="25"
        :items-per-page-options="[10, 25, 50, 100, -1]"
        density="comfortable"
        class="elevation-1"
      >
        <template v-slot:item.time="{ item }">
          <span class="text-no-wrap">{{ formatTime(item.time) }}</span>
        </template>

        <template v-slot:item.player="{ item }">
          <span class="font-weight-medium">{{ item.player }}</span>
        </template>

        <template v-slot:item.regiment="{ item }">
          <v-chip
            size="small"
            :color="getRegimentColor(item.regiment)"
            variant="tonal"
            class="clickable-regiment"
            @click="openRegimentSelector(item.player, item.regiment)"
            :title="`Click to reassign ${item.player} from ${item.regiment}`"
          >
            {{ item.regiment }}
          </v-chip>
        </template>

        <template v-slot:item.message="{ item }">
          <span class="text-body-2">{{ item.message }}</span>
        </template>

        <template v-slot:no-data>
          <div class="text-center pa-4">
            <v-icon size="48" color="grey">mdi-chat-remove</v-icon>
            <p class="text-h6 mt-2">No chat messages found</p>
            <p class="text-body-2 text-medium-emphasis">
              Team chat messages will appear here when available in the log file.
            </p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Regiment Selector Dialog -->
    <RegimentSelectorDialog ref="regimentDialog" />
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLogStore } from '../stores/logStore'
import RegimentSelectorDialog from './RegimentSelectorDialog.vue'

const logStore = useLogStore()
const regimentDialog = ref(null)

const headers = [
  { title: 'Time', key: 'time', sortable: true, width: '120px' },
  { title: 'Player', key: 'player', sortable: true },
  { title: 'Regiment', key: 'regiment', sortable: true, width: '150px' },
  { title: 'Message', key: 'message', sortable: false }
]

// Filter chat messages based on selected round and time range
const filteredChatMessages = computed(() => {
  let messages = logStore.chatMessages

  // Filter by selected round
  if (logStore.selectedRoundId !== null) {
    messages = messages.filter(msg => msg.roundId === logStore.selectedRoundId)
  }

  // Filter by time range
  messages = messages.filter(msg => 
    msg.time >= logStore.timeRange[0] && msg.time <= logStore.timeRange[1]
  )

  // Filter by search text (player name, regiment, or message content)
  if (logStore.filterText) {
    const searchLower = logStore.filterText.toLowerCase()
    messages = messages.filter(msg =>
      msg.player.toLowerCase().includes(searchLower) ||
      msg.regiment.toLowerCase().includes(searchLower) ||
      msg.message.toLowerCase().includes(searchLower)
    )
  }

  return messages
})

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function openRegimentSelector(playerName, currentRegiment) {
  if (regimentDialog.value) {
    regimentDialog.value.open(playerName, currentRegiment)
  }
}

function getRegimentColor(regiment) {
  if (regiment === 'Uncategorized') return 'grey'
  
  // Get team assignment for current round
  const team = logStore.getRegimentTeam(regiment, logStore.selectedRoundId)
  if (team === 'USA') return 'blue'
  if (team === 'CSA') return 'red'
  
  return 'primary'
}
</script>

<style scoped>
.text-no-wrap {
  white-space: nowrap;
}

.clickable-regiment {
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.clickable-regiment:hover {
  transform: scale(1.05);
  opacity: 0.9;
}
</style>
