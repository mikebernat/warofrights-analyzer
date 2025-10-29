<template>
  <v-card class="mx-auto" max-width="800">
    <v-card-title class="text-h5">
      <v-icon class="mr-2">mdi-upload</v-icon>
      Upload Log Files
    </v-card-title>
    <v-card-text>
      <v-file-input
        v-model="file"
        label="Select War of Rights log file"
        accept=".log"
        prepend-icon="mdi-file-document"
        show-size
        @change="handleFileChange"
      ></v-file-input>

      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>

      <div class="mt-4">
        <p class="text-body-2 text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information</v-icon>
          Select a War of Rights game log file (.log) to analyze player respawn activity.
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Log files are typically located in:<br>
          &rarr; <code class="text-caption">C:\Program Files (x86)\Steam\steamapps\common\War of Rights\game.log</code><br>or<br></br>
          &rarr; <code class="text-caption">C:\Program Files (x86)\Steam\steamapps\common\War of Rights\logbackups\</code>
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const file = ref(null)
const error = ref(null)

const handleFileChange = async () => {
  // v-file-input returns the file directly (not an array) when multiple=false
  if (!file.value) return

  error.value = null

  try {
    // Handle both single file and array cases
    const fileToProcess = Array.isArray(file.value) ? file.value[0] : file.value
    await logStore.parseLogFile(fileToProcess)
  } catch (err) {
    error.value = 'Failed to parse log file. Please ensure it is a valid War of Rights log file.'
    console.error(err)
  }
}
</script>
