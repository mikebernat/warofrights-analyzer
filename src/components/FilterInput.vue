<template>
  <v-text-field
    v-model="filterText"
    label="Filter by Player or Regiment"
    prepend-inner-icon="mdi-filter"
    clearable
    density="comfortable"
    variant="outlined"
    hint="Search for player names or regiments"
    persistent-hint
    @update:model-value="updateFilter"
  ></v-text-field>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const filterText = ref(logStore.filterText)

watch(() => logStore.filterText, (newValue) => {
  filterText.value = newValue
})

const updateFilter = (value) => {
  logStore.setFilterText(value || '')
}
</script>
