<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-account-star</v-icon>
      Top 10 Players by Total Respawns
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Individual players ranked by total deaths. Most active combatants in the round.
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
  const topPlayers = logStore.topPlayers

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Respawns'
    },
    yAxis: {
      type: 'category',
      data: topPlayers.map(p => truncateName(p.player)).reverse(),
      axisLabel: {
        interval: 0,
        fontSize: 10
      }
    },
    series: [
      {
        name: 'Respawns',
        type: 'bar',
        data: topPlayers.map(p => ({
          value: p.count,
          itemStyle: {
            // Use selected round for team color, or null if viewing all rounds
            color: logStore.getTeamColor(logStore.getRegimentTeam(p.regiment, logStore.selectedRoundId))
          }
        })).reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }
})

const truncateName = (name) => {
  return name.length > 30 ? name.substring(0, 27) + '...' : name
}
</script>
