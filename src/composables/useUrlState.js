import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/**
 * Composable for syncing state with URL query parameters
 * Allows sharing filtered views without creating new share links
 */
export function useUrlState(logStore) {
  const router = useRouter()
  const route = useRoute()

  /**
   * Sync store state to URL parameters
   */
  function syncToUrl() {
    const query = {}

    // Time range
    if (logStore.timeRange && logStore.timeRange.length === 2) {
      query.timeStart = logStore.timeRange[0]
      query.timeEnd = logStore.timeRange[1]
    }

    // Filter text
    if (logStore.filterText) {
      query.filter = logStore.filterText
    }

    // Selected round
    if (logStore.selectedRoundId !== null) {
      query.round = logStore.selectedRoundId
    }

    // Update URL without adding to history
    router.replace({ query })
  }

  /**
   * Load state from URL parameters
   */
  function loadFromUrl() {
    const query = route.query

    // Time range
    if (query.timeStart !== undefined && query.timeEnd !== undefined) {
      const timeStart = parseInt(query.timeStart)
      const timeEnd = parseInt(query.timeEnd)
      if (!isNaN(timeStart) && !isNaN(timeEnd)) {
        logStore.setTimeRange([timeStart, timeEnd])
      }
    }

    // Filter text
    if (query.filter) {
      logStore.filterText = query.filter
    }

    // Selected round
    if (query.round !== undefined) {
      const roundId = parseInt(query.round)
      if (!isNaN(roundId)) {
        logStore.selectedRoundId = roundId
      }
    }
  }

  /**
   * Watch for changes and sync to URL
   */
  function setupWatchers() {
    // Watch time range
    watch(() => logStore.timeRange, () => {
      syncToUrl()
    }, { deep: true })

    // Watch filter text
    watch(() => logStore.filterText, () => {
      syncToUrl()
    })

    // Watch selected round
    watch(() => logStore.selectedRoundId, () => {
      syncToUrl()
    })
  }

  return {
    syncToUrl,
    loadFromUrl,
    setupWatchers
  }
}
