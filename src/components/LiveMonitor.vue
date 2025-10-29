<template>
  <div>
    <!-- File Selection (when not monitoring) -->
    <div v-if="!isMonitoring">
      <v-alert type="info" variant="tonal" class="mb-4">
        <div class="text-body-2">
          <v-icon size="small" class="mr-1">mdi-information</v-icon>
          Select your active game.log file to monitor it in real-time as new events are logged.
        </div>
        <div class="text-caption mt-2">
          <strong>Browser Support:</strong> File System Access API requires Chrome/Edge 86+
        </div>
      </v-alert>

      <!-- Windows Hard Link Instructions -->
      <v-alert type="warning" variant="tonal" class="mb-4">
        <div class="text-body-2 font-weight-bold mb-2">
          <v-icon size="small" class="mr-1">mdi-microsoft-windows</v-icon>
          Windows Users: Hard Link Required
        </div>
        <div class="text-body-2 mb-2">
          Windows restricts browser access to files in <code>Program Files</code>. You must create a hard link to your game.log file in your Documents folder.
        </div>
        
        <v-expansion-panels class="mt-3">
          <v-expansion-panel>
            <v-expansion-panel-title class="text-body-2">
              <v-icon size="small" class="mr-2">mdi-help-circle</v-icon>
              <strong>How to create a hard link (click to expand)</strong>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-2 mt-2">
                <p class="mb-2"><strong>Step 1:</strong> Open Command Prompt as Administrator</p>
                <ul class="mb-3">
                  <li>Press <kbd>Win + X</kbd></li>
                  <li>Select "Terminal (Admin)" or "Command Prompt (Admin)"</li>
                </ul>

                <p class="mb-2"><strong>Step 2:</strong> Run this command (replace <code>&lt;YourUsername&gt;</code> with your Windows username):</p>
                <v-card variant="outlined" class="pa-4 mb-3 command-box">
                  <div class="command-text mb-3">
                    <div class="mb-1"><strong>mklink /H</strong></div>
                    <div class="ml-4 mb-1">"<span class="text-success">C:\Users\&lt;YourUsername&gt;\Documents\game.log</span>"</div>
                    <div class="ml-4">"<span class="text-info">C:\Program Files (x86)\Steam\steamapps\common\War of Rights\WarOfRights\Saved\Logs\game.log</span>"</div>
                  </div>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    @click="copyHardLinkCommand"
                    block
                  >
                    <v-icon start size="small">mdi-content-copy</v-icon>
                    Copy Command to Clipboard
                  </v-btn>
                </v-card>

                <p class="mb-2"><strong>Step 3:</strong> Select the hard link file when monitoring:</p>
                <code class="text-caption">C:\Users\&lt;YourUsername&gt;\Documents\game.log</code>

                <v-divider class="my-3"></v-divider>

                <p class="text-caption text-medium-emphasis mb-1">
                  <v-icon size="x-small" class="mr-1">mdi-information</v-icon>
                  <strong>What is a hard link?</strong>
                </p>
                <p class="text-caption text-medium-emphasis">
                  A hard link is like a mirror of the original file. Any changes to the game.log are instantly reflected in the hard link. It doesn't duplicate the file or use extra disk space.
                </p>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-alert>

      <v-btn
        color="primary"
        size="large"
        block
        @click="selectFile"
        :disabled="!isFileSystemAccessSupported"
      >
        <v-icon start>mdi-file-search</v-icon>
        Select game.log File
      </v-btn>

      <v-alert v-if="!isFileSystemAccessSupported" type="warning" class="mt-4">
        Your browser doesn't support the File System Access API. Please use Chrome or Edge 86+.
      </v-alert>

      <v-alert v-if="copySuccess" type="success" variant="tonal" class="mt-4" closable @click:close="copySuccess = false">
        Command copied to clipboard!
      </v-alert>
    </div>

    <!-- Monitoring Active - Compact Status Bar -->
    <div v-else>
      <v-alert type="success" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-bold">
              <v-icon size="small" class="mr-1">mdi-eye-check</v-icon>
              Live Monitoring: {{ fileName }}
            </div>
            <div class="text-caption mt-1">
              Updates every {{ pollInterval / 1000 }}s • {{ totalEvents }} events • {{ fileSize }}
            </div>
          </div>
          <div class="d-flex align-center gap-2">
            <v-btn
              icon="mdi-cog"
              size="small"
              variant="text"
              @click="showSettings = !showSettings"
            ></v-btn>
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              @click="stopMonitoring"
            >
              <v-icon start size="small">mdi-stop</v-icon>
              Stop
            </v-btn>
          </div>
        </div>
      </v-alert>

      <!-- Settings Panel (collapsible) -->
      <v-expand-transition>
        <v-card v-show="showSettings" variant="outlined" class="mb-4">
          <v-card-text>
            <v-slider
              v-model="pollInterval"
              :min="1000"
              :max="10000"
              :step="1000"
              label="Poll Interval"
              thumb-label
              @update:model-value="updatePollInterval"
            >
              <template v-slot:append>
                <v-chip size="small">{{ pollInterval / 1000 }}s</v-chip>
              </template>
            </v-slider>
          </v-card-text>
        </v-card>
      </v-expand-transition>
    </div>

    <!-- Error Display -->
    <v-alert v-if="error" type="error" class="mt-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

// State
const isMonitoring = ref(false)
const fileHandle = ref(null)
const fileName = ref('')
const error = ref(null)
const pollInterval = ref(2000) // 2 seconds default
const pollTimer = ref(null)
const lastFileSize = ref(0)
const showSettings = ref(false)
const copySuccess = ref(false)

// Browser support check
const isFileSystemAccessSupported = computed(() => {
  return 'showOpenFilePicker' in window
})

// Computed values from store
const totalEvents = computed(() => logStore.events.length)
const totalRounds = computed(() => logStore.rounds.length)

// File size formatting
const fileSize = computed(() => {
  if (lastFileSize.value === 0) return '0 KB'
  const kb = lastFileSize.value / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
})

/**
 * Copy hard link command to clipboard
 */
async function copyHardLinkCommand() {
  try {
    const command = 'mklink /H "C:\\Users\\<YourUsername>\\Documents\\game.log" "C:\\Program Files (x86)\\Steam\\steamapps\\common\\War of Rights\\WarOfRights\\Saved\\Logs\\game.log"'
    await navigator.clipboard.writeText(command)
    copySuccess.value = true
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy command:', err)
    error.value = 'Failed to copy command to clipboard'
  }
}

/**
 * Select file using File System Access API
 */
async function selectFile() {
  try {
    error.value = null
    
    // Request file access
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Log Files',
          accept: { 'text/plain': ['.log'] }
        }
      ],
      multiple: false
    })

    fileHandle.value = handle
    fileName.value = handle.name

    // Start monitoring
    await startMonitoring()
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = `Failed to select file: ${err.message}`
      console.error('File selection error:', err)
    }
  }
}

/**
 * Start monitoring the selected file
 */
async function startMonitoring() {
  try {
    // Reset state
    lastFileSize.value = 0

    // Initialize live monitoring in store
    await logStore.startLiveMonitoring(fileName.value)

    // Verify monitoring is still active (component might have unmounted)
    if (!logStore.isLiveMonitoring) {
      console.log('Monitoring was stopped before initialization completed')
      return
    }

    // Set monitoring flag BEFORE reading file
    isMonitoring.value = true

    // Read initial file content
    await checkForUpdates()

    // Start polling
    pollTimer.value = setInterval(checkForUpdates, pollInterval.value)
  } catch (err) {
    error.value = `Failed to start monitoring: ${err.message}`
    console.error('Monitoring start error:', err)
    stopMonitoring()
  }
}

/**
 * Check for file updates
 */
async function checkForUpdates() {
  try {
    if (!fileHandle.value) return
    
    // Check if monitoring is still active
    if (!logStore.isLiveMonitoring || !isMonitoring.value) {
      console.log('Monitoring stopped, skipping update check')
      return
    }

    // Get file
    const file = await fileHandle.value.getFile()
    const currentSize = file.size

    // Check if file has grown
    if (currentSize > lastFileSize.value) {
      // Read only the new content
      const newContent = await file.slice(lastFileSize.value, currentSize).text()
      
      // Process new content (only if still monitoring)
      if (logStore.isLiveMonitoring) {
        await logStore.processLiveUpdate(newContent)
        lastFileSize.value = currentSize
      }
    } else if (currentSize < lastFileSize.value) {
      // File was truncated or replaced - restart from beginning
      console.log('File was reset, restarting monitoring...')
      lastFileSize.value = 0
      if (logStore.isLiveMonitoring) {
        await logStore.resetLiveMonitoring()
        await checkForUpdates()
      }
    }
  } catch (err) {
    // Only show error if we're still supposed to be monitoring
    if (isMonitoring.value) {
      error.value = `Error reading file: ${err.message}`
      console.error('File read error:', err)
    }
  }
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
  isMonitoring.value = false
  
  // Only stop if monitoring is active
  if (logStore.isLiveMonitoring) {
    logStore.stopLiveMonitoring()
  }
}

/**
 * Update poll interval
 */
function updatePollInterval() {
  if (isMonitoring.value && pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = setInterval(checkForUpdates, pollInterval.value)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}

.v-theme--dark code {
  background-color: rgba(255, 255, 255, 0.05);
}

kbd {
  background-color: #f7f7f7;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: #333;
  display: inline-block;
  font-family: monospace;
  font-size: 0.85em;
  padding: 2px 6px;
  white-space: nowrap;
}

.v-theme--dark kbd {
  background-color: #2d2d2d;
  border-color: #555;
  color: #ddd;
}

.command-box {
  background-color: rgba(0, 0, 0, 0.02);
  border: 2px solid rgba(var(--v-theme-primary), 0.3) !important;
}

.v-theme--dark .command-box {
  background-color: rgba(255, 255, 255, 0.02);
}

.command-text {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.6;
}

.command-text strong {
  color: rgb(var(--v-theme-primary));
}
</style>
