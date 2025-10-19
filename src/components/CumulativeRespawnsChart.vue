<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-chart-line-stacked</v-icon>
      Cumulative Respawns Over Time
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Running total of respawns from round start. Steeper slopes indicate higher death rates.
    </v-card-subtitle>
    <v-card-text>
      <v-chart :option="chartOption" autoresize style="height: 300px" />
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

const chartOption = computed(() => {
  const events = logStore.respawnsOverTime

  if (events.length === 0) {
    return {
      title: {
        text: 'No data available',
        left: 'center',
        top: 'center'
      }
    }
  }

  // Create fixed time range from round start to end
  const bucketSize = 30
  const roundStart = logStore.timeOffset
  const roundEnd = logStore.timeRange[1]
  
  // Generate all time buckets from start to end
  const allTimeBuckets = []
  for (let time = roundStart; time <= roundEnd; time += bucketSize) {
    allTimeBuckets.push(time)
  }

  // Group events by time buckets and team
  const buckets = {
    USA: {},
    CSA: {},
    Unknown: {}
  }

  events.forEach(event => {
    // Align event time to nearest bucket that exists in allTimeBuckets
    const bucket = Math.floor((event.time - roundStart) / bucketSize) * bucketSize + roundStart
    const team = logStore.getRegimentTeam(event.regiment, event.roundId) || 'Unknown'
    buckets[team][bucket] = (buckets[team][bucket] || 0) + 1
  })

  // Calculate cumulative values for each team
  const cumulativeData = {
    USA: [],
    CSA: [],
    Unknown: []
  }
  
  let cumulativeUSA = 0
  let cumulativeCSA = 0
  let cumulativeUnknown = 0
  
  allTimeBuckets.forEach(bucket => {
    cumulativeUSA += buckets.USA[bucket] || 0
    cumulativeCSA += buckets.CSA[bucket] || 0
    cumulativeUnknown += buckets.Unknown[bucket] || 0
    
    cumulativeData.USA.push(cumulativeUSA)
    cumulativeData.CSA.push(cumulativeCSA)
    cumulativeData.Unknown.push(cumulativeUnknown)
  })
  
  const timeLabels = allTimeBuckets.map(bucket => formatTime(bucket))

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['USA', 'CSA', 'Unknown']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeLabels,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(timeLabels.length / 10) || 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'Cumulative Respawns'
    },
    series: [
      {
        name: 'USA',
        type: 'line',
        data: cumulativeData.USA,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: logStore.getTeamColor('USA')
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'CSA',
        type: 'line',
        data: cumulativeData.CSA,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: logStore.getTeamColor('CSA')
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'Unknown',
        type: 'line',
        data: cumulativeData.Unknown,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: logStore.getTeamColor(null)
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }
})

const formatTime = (seconds) => {
  return logStore.formatTime(seconds, true)
}
</script>
