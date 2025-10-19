<template>
  <div class="time-slider-container">
    <v-label class="time-range-label">
      <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
      Time Range: {{ formatTime(localRange[0]) }} - {{ formatTime(localRange[1]) }}
    </v-label>
    <div class="slider-wrapper">
      <v-range-slider
        v-model="localRange"
        :min="bounds[0]"
        :max="bounds[1]"
        :step="1"
        color="primary"
        track-color="grey"
        thumb-label="always"
        @update:model-value="updateRange"
      >
        <template v-slot:thumb-label="{ modelValue }">
          {{ formatTime(modelValue) }}
        </template>
      </v-range-slider>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()

const bounds = computed(() => logStore.timeBounds)
const localRange = ref([...logStore.timeRange])

// Watch for store changes
watch(() => logStore.timeRange, (newRange) => {
  localRange.value = [...newRange]
}, { deep: true })

// Watch for bounds changes (when new data is loaded)
watch(bounds, (newBounds) => {
  localRange.value = [...newBounds]
  logStore.setTimeRange([...newBounds])
}, { immediate: true })

const updateRange = (value) => {
  logStore.setTimeRange(value)
}

const formatTime = (seconds) => {
  return logStore.formatTime(seconds, true)
}
</script>

<style scoped>
.time-slider-container {
  padding-top: 10px;
  padding-left: 40px;
  padding-right: 40px;
}

.time-range-label {
  display: block;
  margin-bottom: 18px;
  font-size: 14px;
}

.slider-wrapper {
  padding-top: 20px;
}
</style>
