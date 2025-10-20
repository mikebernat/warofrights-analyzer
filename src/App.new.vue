<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title @click="$router.push('/')" style="cursor: pointer;">
        <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
        War of Rights Log Analyzer
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="logStore.fileName" color="success" class="mr-2">
        <v-icon start>mdi-file-check</v-icon>
        {{ logStore.fileName }}
      </v-chip>
      <v-btn
        v-if="logStore.fileName && !isShareView"
        :disabled="logStore.selectedRoundId === null"
        @click="showShareModal = true"
        color="white"
        variant="text"
        prepend-icon="mdi-share-variant"
      >
        Share
      </v-btn>
    </v-app-bar>

    <!-- Share Modal -->
    <ShareModal v-model="showShareModal" />

    <v-main>
      <router-view />
    </v-main>

    <!-- Loading Overlay -->
    <v-overlay :model-value="logStore.loading" class="align-center justify-center">
      <v-card width="400">
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLogStore } from './stores/logStore'
import ShareModal from './components/ShareModal.vue'

const route = useRoute()
const logStore = useLogStore()
const showShareModal = ref(false)

const isShareView = computed(() => route.name === 'share')
</script>

<style scoped>
/* Global styles */
</style>
