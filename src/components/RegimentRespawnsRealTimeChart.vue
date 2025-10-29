<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-chart-line</v-icon>
      Regiment Respawns (Real-Time)
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Non-cumulative respawns per minute for all regiments. Top 5 most active regiments are pre-selected. Click legend to toggle visibility.
    </v-card-subtitle>
    <v-card-text>
      <v-chart :option="chartOption" autoresize style="height: 400px" />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useLogStore } from '../stores/logStore'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const logStore = useLogStore()

const colors = [
  '#1976D2', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
  '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#F44336',
  '#3F51B5', '#8BC34A', '#FFC107', '#673AB7', '#009688'
]

const chartOption = computed(() => {
  const regimentTimeline = logStore.regimentTimeline

  if (regimentTimeline.length === 0) {
    return {
      title: {
        text: 'No data available',
        left: 'center',
        top: 'center'
      }
    }
  }

  // Create time buckets for all regiments
  const bucketSize = 60 // 1 minute buckets
  
  // Create fixed time range from round start to end
  const roundStart = logStore.timeOffset
  const roundEnd = logStore.timeRange[1]
  
  // Generate all time buckets from start to end
  const allTimeBuckets = []
  for (let time = roundStart; time <= roundEnd; time += bucketSize) {
    allTimeBuckets.push(time)
  }

  // Build series for each regiment
  const series = regimentTimeline.map((regiment, index) => {
    const buckets = {}
    
    regiment.data.forEach(event => {
      // Align event time to nearest bucket that exists in allTimeBuckets
      const bucket = Math.floor((event.time - roundStart) / bucketSize) * bucketSize + roundStart
      buckets[bucket] = (buckets[bucket] || 0) + 1
    })

    // Create non-cumulative data (actual respawns per time bucket)
    const data = allTimeBuckets.map(time => {
      return buckets[time] || 0
    })

    return {
      name: regiment.regiment,
      type: 'line',
      data: data,
      smooth: true,
      itemStyle: {
        color: colors[index % colors.length]
      },
      // Only show top 5 by default
      selected: regiment.isTop5
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: regimentTimeline.map(r => r.regiment),
      bottom: 0,
      type: 'scroll',
      textStyle: {
        color: '#E0E0E0' // Light gray text for better contrast
      },
      pageTextStyle: {
        color: '#E0E0E0'
      },
      selected: regimentTimeline.reduce((acc, r) => {
        acc[r.regiment] = r.isTop5
        return acc
      }, {})
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allTimeBuckets.map(t => formatTime(t)),
      axisLabel: {
        rotate: 45,
        interval: Math.floor(allTimeBuckets.length / 10) || 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'Respawns per Minute'
    },
    series: series
  }
})

const formatTime = (seconds) => {
  return logStore.formatTime(seconds, true).substring(0, 5) // Show HH:MM only
}
</script>
