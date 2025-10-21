<template>
  <v-footer class="bg-grey-darken-4 text-center d-flex flex-column">
    <div class="px-4 py-2 text-center w-100">
      <v-divider class="mb-4"></v-divider>
      
      <div class="text-body-2 mb-2">
        <strong>War of Rights</strong> and all related assets, logos, and trademarks are property of 
        <a 
          href="https://warofrights.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          class="text-primary"
        >
          Campfire Games
        </a>
      </div>
      
      <div class="text-caption text-grey-lighten-1">
        This is an unofficial fan-made tool and is not affiliated with or endorsed by Campfire Games.
      </div>
    </div>

    <v-divider></v-divider>

    <div class="px-4 py-3 bg-grey-darken-4 text-center w-100">
      <span class="text-caption">
        © {{ currentYear }} War of Rights Log Analyzer. All rights reserved.
      </span>
    </div>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
