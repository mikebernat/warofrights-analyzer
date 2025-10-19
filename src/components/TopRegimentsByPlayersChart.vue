<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-account-group</v-icon>
      Top Regiments by Player Count
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Regiments ranked by number of unique players. Larger regiments have more participants.
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
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useLogStore } from '../stores/logStore'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
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

  // Count unique players per regiment
  const regimentPlayers = {}
  
  events.forEach(event => {
    if (!regimentPlayers[event.regiment]) {
      regimentPlayers[event.regiment] = new Set()
    }
    regimentPlayers[event.regiment].add(event.player)
  })

  // Convert to array and get top 10
  const topRegiments = Object.entries(regimentPlayers)
    .map(([regiment, players]) => ({
      regiment,
      playerCount: players.size
    }))
    .sort((a, b) => b.playerCount - a.playerCount)
    .slice(0, 10)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const param = params[0]
        return `${param.name}<br/>Players: ${param.value}`
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
      name: 'Player Count',
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'category',
      data: topRegiments.map(r => r.regiment).reverse(),
      axisLabel: {
        interval: 0,
        fontSize: 11
      }
    },
    series: [
      {
        name: 'Player Count',
        type: 'bar',
        data: topRegiments.map(r => ({
          value: r.playerCount,
          itemStyle: {
            color: logStore.getTeamColor(logStore.getRegimentTeam(r.regiment, logStore.selectedRoundId))
          }
        })).reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }
})
</script>
