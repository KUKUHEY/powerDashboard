<template>
  <div ref="chartRef" class="chart">
    <div v-if="powerStore.status.type === 'error'" class="chart-error">
      {{ powerStore.status.message }}
    </div>
    <div v-else-if="powerStore.status.type === 'empty'" class="chart-empty">
      {{ powerStore.status.message }}
    </div>
    <div v-else-if="powerStore.status.type === 'loading'" class="chart-loading">
      {{ powerStore.status.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import * as echarts from "echarts"
import { usePowerStore } from '../stores/power'
import { useWebSocketStore } from '../stores/websocket'

const chartRef = ref(null)
let chartInstance = null

const powerStore = usePowerStore()
const wsStore = useWebSocketStore()

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance || !powerStore.hasData) return

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        return `时间: ${params[0].name}<br/>负荷: ${params[0].value}MW`
      }
    },
    xAxis: { 
      type: "category", 
      data: powerStore.timeData,
      axisLine: { lineStyle: { color: '#6b7b8c' } },
      axisLabel: { 
        color: '#9eabb3',
        formatter: function(value) {
          // 只显示分钟和秒，避免过于拥挤
          const date = new Date(value);
          return date.toLocaleTimeString();
        }
      }
    },
    yAxis: { 
      type: "value",
      name: '负荷 (MW)',
      nameTextStyle: { color: '#9eabb3' },
      axisLine: { lineStyle: { color: '#6b7b8c' } },
      axisLabel: { color: '#9eabb3' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{ 
      type: "line", 
      data: powerStore.loadData,
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#e60012'
      },
      itemStyle: {
        color: '#e60012'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(230, 0, 18, 0.3)' },
          { offset: 1, color: 'rgba(230, 0, 18, 0.1)' }
        ])
      }
    }]
  }
  
  chartInstance.setOption(option)
}

// 监听数据变化，自动更新图表
watch(() => powerStore.loadData, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  
  // 初始化 WebSocket 连接
  // wsStore.connect()
  // 初始化数据监听
  powerStore.init()
  
  window.addEventListener("resize", () => {
    chartInstance && chartInstance.resize()
  })
})

onBeforeUnmount(() => {
  // 清理事件监听
  wsStore.off('update', powerStore.addDataPoint)
  wsStore.off('connect', powerStore.handleConnect)
  wsStore.off('connect_error', powerStore.handleConnectError)
  wsStore.off('disconnect', powerStore.handleDisconnect)
  
  chartInstance && chartInstance.dispose()
  window.removeEventListener("resize", () => {
    chartInstance && chartInstance.resize();
  });
})
</script>

<style scoped>
.chart {
  width: 100%;
  min-height: 300px; 
  height: auto;
  border-radius: 4px;
  position: relative;
}

.chart-error,
.chart-empty,
.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  text-align: center;
}

.chart-error {
  color: #f87171;
}

.chart-loading {
  color: #60a5fa;
}
</style>