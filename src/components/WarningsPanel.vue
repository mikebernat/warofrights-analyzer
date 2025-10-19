<template>
  <v-card v-if="!dismissed">
    <v-card-title class="bg-warning d-flex align-center">
      <v-icon class="mr-2">mdi-alert</v-icon>
      Warnings
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="dismissed = true"
      ></v-btn>
    </v-card-title>
    <v-card-text>
      <v-list density="compact">
        <v-list-item
          v-for="(warning, index) in displayWarnings"
          :key="index"
          :prepend-icon="getWarningIcon(warning.type)"
        >
          <v-list-item-title>{{ warning.message }}</v-list-item-title>
          <template v-slot:append>
            <v-chip size="x-small" :color="getWarningColor(warning.type)">
              {{ warning.type }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useLogStore } from '../stores/logStore'

const props = defineProps({
  warnings: {
    type: Array,
    default: () => []
  }
})

const logStore = useLogStore()
const dismissed = ref(false)

// Use provided warnings or fall back to store warnings
const displayWarnings = computed(() => props.warnings.length > 0 ? props.warnings : logStore.warnings)

// Reset dismissed state when warnings change
watch(() => displayWarnings.value, () => {
  dismissed.value = false
}, { deep: true })

const getWarningIcon = (type) => {
  switch (type) {
    case 'incomplete':
      return 'mdi-alert-circle'
    case 'pseudo':
      return 'mdi-information'
    default:
      return 'mdi-alert'
  }
}

const getWarningColor = (type) => {
  switch (type) {
    case 'incomplete':
      return 'warning'
    case 'pseudo':
      return 'info'
    default:
      return 'error'
  }
}
</script>
