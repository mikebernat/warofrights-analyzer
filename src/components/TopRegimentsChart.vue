<template>
  <v-card>
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-shield-star</v-icon>
      Top 10 Regiments by Total Respawns
    </v-card-title>
    <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
      Regiments ranked by total deaths. Higher respawns may indicate aggressive playstyle or heavy combat.
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
  const topRegiments = logStore.topRegiments

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
      data: topRegiments.map(r => r.regiment).reverse(),
      axisLabel: {
        interval: 0,
        fontSize: 11
      }
    },
    series: [
      {
        name: 'Respawns',
        type: 'bar',
        data: topRegiments.map(r => ({
          value: r.count,
          itemStyle: {
            // Use selected round for team color, or null if viewing all rounds
            color: logStore.getTeamColor(logStore.getRegimentTeam(r.regiment, logStore.selectedRoundId))
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
</script>
