<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title class="bg-primary">
        <v-icon class="mr-2">mdi-account-edit</v-icon>
        Reassign Regiment
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="mb-3">
          <div class="text-subtitle-2 mb-1">Player:</div>
          <div class="text-h6">{{ playerName }}</div>
        </div>

        <div class="mb-3">
          <div class="text-subtitle-2 mb-1">Current Regiment:</div>
          <v-chip
            size="small"
            :color="currentRegiment === 'Uncategorized' ? 'warning' : 'primary'"
          >
            {{ currentRegiment }}
          </v-chip>
        </div>

        <v-divider class="my-3"></v-divider>

        <div class="text-subtitle-2 mb-2">New Regiment:</div>
        <v-combobox
          v-model="selectedRegiment"
          :items="availableRegiments"
          item-title="title"
          item-value="value"
          :return-object="false"
          label="Select or type regiment"
          density="comfortable"
          variant="outlined"
          placeholder="Select or type regiment"
          autofocus
          @keydown.enter="applyChange"
        >
          <template v-slot:prepend-inner>
            <v-icon>mdi-shield-account</v-icon>
          </template>
        </v-combobox>

        <v-alert type="info" variant="tonal" density="compact" class="mt-3">
          <div class="text-caption">
            This will update all respawn events for this player in the selected round.
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          @click="close"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          @click="applyChange"
          color="primary"
          variant="elevated"
          :disabled="!selectedRegiment || selectedRegiment === currentRegiment"
        >
          Apply
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

const dialog = ref(false)
const playerName = ref('')
const currentRegiment = ref('')
const selectedRegiment = ref(null)

// Get available regiments from parsing config
const availableRegiments = computed(() => {
  const config = logStore.getParsingConfig()
  const regiments = []
  
  // Add regiments from config
  Object.keys(config.regimentPatterns).forEach(regiment => {
    regiments.push({
      title: regiment,
      value: regiment
    })
  })
  
  // Add existing regiments from events
  const existingRegiments = new Set()
  logStore.events.forEach(event => {
    if (event.regiment && event.regiment !== 'Uncategorized') {
      existingRegiments.add(event.regiment)
    }
  })
  
  existingRegiments.forEach(regiment => {
    if (!regiments.find(r => r.value === regiment)) {
      regiments.push({
        title: regiment,
        value: regiment
      })
    }
  })
  
  // Sort alphabetically
  regiments.sort((a, b) => a.title.localeCompare(b.title))
  
  return regiments
})

// Watch dialog state to reset selected regiment
watch(dialog, (newVal) => {
  if (newVal) {
    selectedRegiment.value = null
  }
})

function open(player, regiment) {
  playerName.value = player
  currentRegiment.value = regiment
  selectedRegiment.value = null
  dialog.value = true
}

function close() {
  dialog.value = false
}

function applyChange() {
  if (!selectedRegiment.value || selectedRegiment.value === currentRegiment.value) {
    return
  }
  
  // Apply reassignment using the store method
  const changes = { [playerName.value]: selectedRegiment.value }
  logStore.applyRegimentReassignments(changes)
  
  close()
}

defineExpose({
  open
})
</script>
