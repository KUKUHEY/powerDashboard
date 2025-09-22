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
import { io } from 'socket.io-client';

const chartContainer = ref(null);
let chartInstance = null;
let socket = null;
const hoverNode = ref(null);
const activeFilter = ref('all');

const topologyData = ref({
  nodes: [],
  links: []
});

// 在script setup部分添加固定位置数据
const fixedPositions = ref({
  // 发电厂节点 - 布置在左侧
  'plant-1': { x: 100, y: 80 },
  'plant-2': { x: 100, y: 160 },
  'plant-3': { x: 100, y: 240 },
  'plant-4': { x: 100, y: 320 },
  
  // 变电站节点 - 布置在中间
  'sub-1': { x: 300, y: 100 },
  'sub-2': { x: 300, y: 200 },
  'sub-3': { x: 300, y: 300 },
  'sub-4': { x: 400, y: 150 },
  'sub-5': { x: 400, y: 250 },
  
  // 负荷中心节点 - 布置在右侧
  'load-1': { x: 600, y: 80 },
  'load-2': { x: 600, y: 160 },
  'load-3': { x: 600, y: 240 },
  'load-4': { x: 600, y: 320 }
});


// 计算统计信息
const stats = computed(() => {
  const nodes = topologyData.value.nodes;
  return {
    normal: nodes.filter(n => n.status === 'normal').length,
    warning: nodes.filter(n => n.status === 'warning').length,
    error: nodes.filter(n => n.status === 'error').length
  };
});

// 筛选后的数据
const filteredData = computed(() => {
  if (activeFilter.value === 'all') return topologyData.value;

  const filteredNodes = topologyData.value.nodes.filter(node => 
    node.status === activeFilter.value
  );
  
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = topologyData.value.links.filter(link =>
    filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
  );

  return { nodes: filteredNodes, links: filteredLinks };
});

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;
  chartInstance = echarts.init(chartContainer.value);
  updateChart();
};

// 更新图表 - 简化版本
const updateChart = () => {
  if (!chartInstance || !topologyData.value.nodes.length) return;

  // 为每个节点设置固定位置
  const nodesWithFixedPositions = filteredData.value.nodes.map(node => {
    const fixedPos = fixedPositions.value[node.id];
    return {
      ...node,
      symbolSize: getCompactSymbolSize(node),
      itemStyle: {
        color: getNodeColor(node)
      },
      symbol: getNodeSymbol(node),
      x: fixedPos ? fixedPos.x : Math.random() * 500, // 备用随机位置
      y: fixedPos ? fixedPos.y : Math.random() * 300,
      fixed: true // 关键：固定节点位置
    };
  });


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
          color: getLinkColor(link),
          width: getLinkWidth(link) * 0.7,
          type: link.status === 'warning' ? 'dashed' : 'solid'
        }
      }))
    }]
  };

  chartInstance.setOption(option, true);

  // 添加鼠标事件
  chartInstance.off('mouseover');
  chartInstance.off('mouseout');
  
  chartInstance.on('mouseover', (params) => {
    if (params.dataType === 'node') {
      hoverNode.value = params.data;
    }
  });
  
  chartInstance.on('mouseout', () => {
    hoverNode.value = null;
  });
};

// 节点尺寸
const getCompactSymbolSize = (node) => {
  const baseSizes = {
    'thermal': 20, 'hydro': 18, 'wind': 16, 'solar': 16,
    'substation-500': 18, 'substation-220': 16, 'substation-110': 14,
    'load-center': 16
  };
  return baseSizes[node.category] || 15;
};

// 节点颜色和符号
const getNodeColor = (node) => {
  const colorMap = {
    'thermal': '#ff6b6b', 'hydro': '#4ecdc4', 'wind': '#74c0fc', 'solar': '#ffd43b',
    'substation-500': '#4ecdc4', 'substation-220': '#45b7d1', 'substation-110': '#f9c74f',
    'load-center': '#22c55e'
  };
  return colorMap[node.category] || '#999';
};

const getNodeSymbol = (node) => {
  const symbolMap = {
    'thermal': 'circle', 'hydro': 'circle', 'wind': 'circle', 'solar': 'circle',
    'substation-500': 'rect', 'substation-220': 'rect', 'substation-110': 'rect',
    'load-center': 'triangle'
  };
  return symbolMap[node.category] || 'circle';
};

const getLinkColor = (link) => {
  const colorMap = {
    'normal': 'rgba(255, 255, 255, 0.4)',
    'warning': '#eab308',
    'error': '#ef4444'
  };
  return colorMap[link.status] || '#fff';
};

const getLinkWidth = (link) => {
  return 0.8 + (link.value / 100) * 1.5;
};

// 控制功能
const zoomIn = () => {
  chartInstance?.dispatchAction({ type: 'zoom', scale: 1.2 });
};

const zoomOut = () => {
  chartInstance?.dispatchAction({ type: 'zoom', scale: 0.8 });
};

const resetView = () => {
  chartInstance?.dispatchAction({ type: 'restore' });
};

// 辅助函数
const getNodeType = (node) => {
  const typeMap = {
    'thermal': '火电', 'hydro': '水电', 'wind': '风电', 'solar': '光伏',
    'substation-500': '变电', 'substation-220': '变电', 'substation-110': '变电',
    'load-center': '负荷'
  };
  return typeMap[node.category] || '节点';
};

const formatStatus = (status) => {
  const statusMap = { normal: '正常', warning: '预警', error: '故障' };
  return statusMap[status] || status;
};

// WebSocket连接
const connectWebSocket = () => {
  socket = io("http://localhost:8081", {
    transports: ['websocket'],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("✅ 拓扑图连接成功");
    socket.emit('request_topology_data');
  });

  socket.on("topology_data", (data) => {
    topologyData.value = data;
    updateChart();
  });

  socket.on("topology_update", (data) => {
    topologyData.value = data;
    updateChart();
  });

  socket.on("connect_error", (err) => {
    console.error("❌ 连接错误:", err.message);
  });
};

// 初始化
onMounted(() => {
  initChart();
  connectWebSocket();
  window.addEventListener('resize', () => chartInstance?.resize());
});

onBeforeUnmount(() => {
  socket?.disconnect();
  chartInstance?.dispose();
});

// 监听筛选变化
watch(activeFilter, updateChart);
watch(topologyData, updateChart, { deep: true });
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