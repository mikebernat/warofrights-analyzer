<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-chart-bar</v-icon>
      Regiment Player Respawn Ratio
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Average deaths per player in each regiment. Higher ratios suggest more aggressive combat engagement.
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
import { BarChart } from 'echarts/charts'
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
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const logStore = useLogStore()

const chartOption = computed(() => {
  const events = logStore.filteredEvents

  if (events.length === 0) {
    return {
      title: {
        text: 'No data available',
        left: 'center',
        top: 'center'
      }
    }
  }

  // Calculate respawns and unique players per regiment
  const regimentData = {}
  
  events.forEach(event => {
    if (!regimentData[event.regiment]) {
      regimentData[event.regiment] = {
        respawns: 0,
        players: new Set()
      }
    }
    regimentData[event.regiment].respawns++
    regimentData[event.regiment].players.add(event.player)
  })

  // Calculate ratio and prepare data
  const ratioData = Object.entries(regimentData)
    .filter(([regiment, data]) => data.players.size >= 1) // Include all regiments with at least 1 player
    .map(([regiment, data]) => ({
      regiment,
      ratio: data.respawns / data.players.size,
      respawns: data.respawns,
      players: data.players.size
    }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 20) // Top 20 regiments

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = ratioData[params[0].dataIndex]
        return `${data.regiment}<br/>` +
               `Ratio: ${data.ratio.toFixed(2)}<br/>` +
               `Respawns: ${data.respawns}<br/>` +
               `Players: ${data.players}`
      }
    },
    grid: {
      left: '15%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Respawns per Player',
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'category',
      data: ratioData.map(d => d.regiment).reverse(),
      axisLabel: {
        interval: 0,
        fontSize: 11
      }
    },
    series: [
      {
        name: 'Respawns per Player',
        type: 'bar',
        data: ratioData.map(d => ({
          value: parseFloat(d.ratio.toFixed(1)),
          itemStyle: {
            color: logStore.getTeamColor(logStore.getRegimentTeam(d.regiment, logStore.selectedRoundId))
          }
        })).reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: (params) => params.value.toFixed(1)
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }
})
</script>
