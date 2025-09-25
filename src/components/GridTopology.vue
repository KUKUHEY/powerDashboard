<template>
  <div class="grid-topology-compact">
    <!-- 紧凑型控制栏 -->
    <div class="compact-controls">
      <div class="controls-left">
        <div class="mini-buttons">
          <button @click="zoomIn" class="mini-btn" title="放大">➕</button>
          <button @click="zoomOut" class="mini-btn" title="缩小">➖</button>
          <button @click="resetView" class="mini-btn" title="重置">🔄</button>
        </div>
      </div>
      
      <div class="controls-right">
        <div class="status-indicators">
          <span class="status-dot normal"></span>
          <span class="status-count">{{ stats.normal }}</span>
          <span class="status-dot warning"></span>
          <span class="status-count">{{ stats.warning }}</span>
          <span class="status-dot error"></span>
          <span class="status-count">{{ stats.error }}</span>
        </div>
        
        <select v-model="activeFilter" class="filter-select">
          <option value="all">全部状态</option>
          <option value="normal">正常</option>
          <option value="warning">预警</option>
          <option value="error">故障</option>
        </select>
      </div>
    </div>

    <!-- 拓扑图容器 -->
    <div ref="chartContainer" class="compact-chart-container"></div>

    <!-- 简化的节点提示 -->
    <div v-if="hoverNode" class="node-tooltip">
      <div class="tooltip-header">
        <strong>{{ hoverNode.name }}</strong>
        <span :class="['status-badge', hoverNode.status]">{{ formatStatus(hoverNode.status) }}</span>
      </div>
      <div class="tooltip-content">
        {{ getNodeType(hoverNode) }} · {{ hoverNode.value }}MW
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as echarts from 'echarts';
// import { io } from 'socket.io-client';
import { useTopologyStore } from '../stores/topology'
import { useWebSocketStore } from '../stores/websocket'

const chartContainer = ref(null)
let chartInstance = null
const topologyStore = useTopologyStore()
const wsStore = useWebSocketStore()

// 计算属性和方法从 store 获取
const hoverNode = computed(() => topologyStore.hoverNode)
const activeFilter = computed({
  get: () => topologyStore.activeFilter,
  set: (value) => topologyStore.setActiveFilter(value)
})
const stats = computed(() => topologyStore.stats)
const filteredData = computed(() => topologyStore.filteredData)

const formatStatus = topologyStore.formatStatus
const getNodeType = topologyStore.getNodeType

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return
  chartInstance = echarts.init(chartContainer.value)
  updateChart()
}

// 更新图表 - 简化版本
const updateChart = () => {
  if (!chartInstance || !filteredData.value.nodes.length) return

  // 为每个节点设置固定位置
  const nodesWithFixedPositions = filteredData.value.nodes.map(node => {
    const fixedPos = topologyStore.getNodePosition(node.id)
    return {
      ...node,
      symbolSize: topologyStore.getCompactSymbolSize(node),
      itemStyle: {
        color: topologyStore.getNodeColor(node)
      },
      symbol: topologyStore.getNodeSymbol(node),
      x: fixedPos.x,
      y: fixedPos.y,
      fixed: true // 关键：固定节点位置
    }
  })

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      show: false
    },
    series: [{
      type: 'graph',
      layout: null,
      force: null,
      roam: true,
      focusNodeAdjacency: true,
      label: {
        show: true,
        position: 'bottom',
        distance: 2,
        formatter: '{b}',
        fontSize: 8,
        color: '#fff'
      },
      edgeLabel: {
        show: false
      },
      lineStyle: {
        width: 1.5,
        curveness: 0.1,
        color: 'source'
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 2
        }
      },
      data: nodesWithFixedPositions,
      links: filteredData.value.links.map(link => ({
        ...link,
        lineStyle: {
          color: topologyStore.getLinkColor(link),
          width: topologyStore.getLinkWidth(link) * 0.7,
          type: link.status === 'warning' ? 'dashed' : 'solid'
        }
      }))
    }]
  }

  chartInstance.setOption(option, true)

  // 添加鼠标事件
  chartInstance.off('mouseover')
  chartInstance.off('mouseout')
  
  chartInstance.on('mouseover', (params) => {
    if (params.dataType === 'node') {
      topologyStore.setHoverNode(params.data)
    }
  })
  
  chartInstance.on('mouseout', () => {
    topologyStore.clearHoverNode()
  })
}

// 控制功能
const zoomIn = () => {
  chartInstance?.dispatchAction({ type: 'zoom', scale: 1.2 })
}

const zoomOut = () => {
  chartInstance?.dispatchAction({ type: 'zoom', scale: 0.8 })
}

const resetView = () => {
  chartInstance?.dispatchAction({ type: 'restore' })
}


// 初始化
onMounted(() => {
  initChart();
  // 初始化拓扑数据监听
  topologyStore.init();
  
  window.addEventListener('resize', () => chartInstance?.resize());
});

onBeforeUnmount(() => {
  // 清理事件监听
  wsStore.off("topology_data", topologyStore.setTopologyData);
  wsStore.off("topology_update", topologyStore.setTopologyData);
  wsStore.off("connect_error", topologyStore.handleConnectError);
  
  chartInstance?.dispose();
  window.removeEventListener('resize', () => chartInstance?.resize());
});

// 监听筛选变化和数据变化
watch(activeFilter, updateChart)
watch(() => topologyStore.topologyData, updateChart, { deep: true })
</script>

<style scoped>
.grid-topology-compact {
  height: 280px; /* 进一步减少高度 */
  position: relative;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 6px;
  overflow: hidden;
}

.compact-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-buttons {
  display: flex;
  gap: 4px;
}

.mini-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 3px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.normal { background: #22c55e; }
.status-dot.warning { background: #eab308; }
.status-dot.error { background: #ef4444; }

.status-count {
  font-size: 11px;
  color: #94a3b8;
  margin-right: 4px;
}

.filter-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 11px;
  cursor: pointer;
}

.filter-select option {
  background: rgba(30, 41, 59, 0.9);
  color: #fff;
}

.compact-chart-container {
  height: calc(100% - 40px); /* 只减去控制栏高度 */
  width: 100%;
}

.node-tooltip {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 11px;
  backdrop-filter: blur(5px);
  z-index: 100;
  max-width: 180px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.tooltip-header strong {
  color: #fff;
  font-size: 12px;
}

.tooltip-content {
  color: #94a3b8;
  font-size: 10px;
}

.status-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 500;
}

.status-badge.normal { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status-badge.warning { background: rgba(234, 179, 8, 0.2); color: #eab308; }
.status-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
</style>