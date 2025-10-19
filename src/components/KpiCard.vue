<template>
  <v-card height="100%">
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-counter</v-icon>
      Total Respawns
    </v-card-title>
    <v-card-text class="text-center">
      <div class="text-h2 font-weight-bold primary--text">
        {{ logStore.totalRespawns.toLocaleString() }}
      </div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        <v-chip size="small" class="mr-1">
          <v-icon start size="small">mdi-account-group</v-icon>
          {{ logStore.filteredStats.players }} Players
        </v-chip>
        <v-chip size="small">
          <v-icon start size="small">mdi-shield</v-icon>
          {{ logStore.filteredStats.regiments }} Regiments
        </v-chip>
      </div>
      <v-divider class="my-3"></v-divider>
      <div class="text-caption text-medium-emphasis">
        <div><strong>Map:</strong> {{ logStore.filteredStats.maps.join(', ') || 'None' }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
</script>
