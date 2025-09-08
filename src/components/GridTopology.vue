<template>
  <div class="topology-container">
    <div class="topology-controls">
      <button @click="zoomIn" class="control-btn">+ 放大</button>
      <button @click="zoomOut" class="control-btn">- 缩小</button>
      <button @click="resetView" class="control-btn">重置视图</button>
      <div class="status-legend">
        <span><span class="status-dot normal"></span> 正常</span>
        <span><span class="status-dot warning"></span> 预警</span>
        <span><span class="status-dot error"></span> 故障</span>
      </div>
    </div>
    
    <div class="topology-svg-container" ref="svgContainer">
      <svg 
        :width="svgWidth" 
        :height="svgHeight"
        :viewBox="viewBox"
        @click="handleSvgClick"
      >
        <!-- 背景网格 -->
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- 输电线路 -->
        <g>
          <line v-for="(line, index) in lines" :key="index"
                :x1="line.from.x" :y1="line.from.y"
                :x2="line.to.x" :y2="line.to.y"
                :stroke="getLineColor(line)"
                :stroke-width="line.load > 80 ? 3 : 2"
                :stroke-dasharray="line.status === 'warning' ? '5,5' : 'none'"
                class="power-line"
          />
          <circle v-for="(line, index) in lines" :key="'load' + index"
                  :cx="(line.from.x + line.to.x) / 2"
                  :cy="(line.from.y + line.to.y) / 2"
                  r="10"
                  fill="rgba(11, 19, 43, 0.8)"
          >
            <title>线路负荷: {{ line.load }}%</title>
          </circle>
          <text v-for="(line, index) in lines" :key="'text' + index"
                :x="(line.from.x + line.to.x) / 2"
                :y="(line.from.y + line.to.y) / 2 + 4"
                text-anchor="middle"
                fill="#fff"
                font-size="10"
          >
            {{ line.load }}%
          </text>
        </g>
        
        <!-- 变电站节点 -->
        <g>
          <g v-for="(substation, index) in substations" :key="index"
             :transform="`translate(${substation.x}, ${substation.y})`"
             class="substation-node"
             @click.stop="selectNode('substation', index)"
          >
            <rect x="-30" y="-20" width="60" height="40" 
                  rx="5" 
                  :fill="getNodeColor(substation.status)"
                  :stroke="substation === selectedNode ? '#00ffff' : 'rgba(255,255,255,0.3)'"
                  :stroke-width="substation === selectedNode ? 2 : 1"
            />
            <text x="0" y="5" text-anchor="middle" fill="#fff" font-size="12">{{ substation.name }}</text>
            <title>{{ substation.name }} - 状态: {{ formatStatus(substation.status) }}</title>
          </g>
        </g>
        
        <!-- 发电站节点 -->
        <g>
          <g v-for="(plant, index) in powerPlants" :key="index"
             :transform="`translate(${plant.x}, ${plant.y})`"
             class="power-plant-node"
             @click.stop="selectNode('plant', index)"
          >
            <circle cx="0" cy="0" r="25" 
                  :fill="getNodeColor(plant.status)"
                  :stroke="plant === selectedNode ? '#00ffff' : 'rgba(255,255,255,0.3)'"
                  :stroke-width="plant === selectedNode ? 2 : 1"
            />
            <text x="0" y="5" text-anchor="middle" fill="#fff" font-size="12">{{ plant.name }}</text>
            <title>{{ plant.name }} - 状态: {{ formatStatus(plant.status) }} - 出力: {{ plant.output }}MW</title>
          </g>
        </g>
        
        <!-- 负载中心节点 -->
        <g>
          <g v-for="(load, index) in loadCenters" :key="index"
             :transform="`translate(${load.x}, ${load.y})`"
             class="load-center-node"
             @click.stop="selectNode('load', index)"
          >
            <polygon points="0,-20 20,10 -20,10" 
                  :fill="getNodeColor(load.status)"
                  :stroke="load === selectedNode ? '#00ffff' : 'rgba(255,255,255,0.3)'"
                  :stroke-width="load === selectedNode ? 2 : 1"
            />
            <text x="0" y="25" text-anchor="middle" fill="#fff" font-size="12">{{ load.name }}</text>
            <title>{{ load.name }} - 状态: {{ formatStatus(load.status) }} - 负载: {{ load.load }}MW</title>
          </g>
        </g>
      </svg>
    </div>
    
    <!-- 节点详情信息 -->
    <div v-if="selectedNode" class="node-details">
      <h3>{{ selectedNode.name }} 详情</h3>
      <div class="detail-item"><span>类型:</span> {{ getNodeType() }}</div>
      <div class="detail-item"><span>状态:</span> <span :class="`status-label ${selectedNode.status}`">{{ formatStatus(selectedNode.status) }}</span></div>
      <div v-if="selectedNode.output" class="detail-item"><span>当前出力:</span> {{ selectedNode.output }} MW</div>
      <div v-if="selectedNode.load" class="detail-item"><span>当前负载:</span> {{ selectedNode.load }} MW</div>
      <div class="detail-item"><span>最后更新:</span> {{ selectedNode.lastUpdate }}</div>
      <button @click="deselectNode" class="close-details">关闭详情</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { io } from 'socket.io-client';

// 拓扑图尺寸和缩放控制
const svgWidth = ref(800);
const svgHeight = ref(500);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const viewBox = ref(`${-svgWidth.value/2} ${-svgHeight.value/2} ${svgWidth.value} ${svgHeight.value}`);
const svgContainer = ref(null);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// 节点选择状态
const selectedNode = ref(null);

// 电网拓扑数据
const powerPlants = ref([
  { id: 1, name: '发电站A', x: -300, y: -150, status: 'normal', output: 850, lastUpdate: '' },
  { id: 2, name: '发电站B', x: -300, y: 150, status: 'normal', output: 620, lastUpdate: '' }
]);

const substations = ref([
  { id: 1, name: '变电站1', x: -100, y: -100, status: 'normal', lastUpdate: '' },
  { id: 2, name: '变电站2', x: -100, y: 0, status: 'warning', lastUpdate: '' },
  { id: 3, name: '变电站3', x: -100, y: 100, status: 'normal', lastUpdate: '' }
]);

const loadCenters = ref([
  { id: 1, name: '负荷中心A', x: 200, y: -150, status: 'normal', load: 420, lastUpdate: '' },
  { id: 2, name: '负荷中心B', x: 200, y: 0, status: 'normal', load: 380, lastUpdate: '' },
  { id: 3, name: '负荷中心C', x: 200, y: 150, status: 'error', load: 510, lastUpdate: '' }
]);

const lines = ref([
  // 发电站到变电站
  { from: { x: -300, y: -150 }, to: { x: -100, y: -100 }, status: 'normal', load: 65 },
  { from: { x: -300, y: 150 }, to: { x: -100, y: 100 }, status: 'normal', load: 58 },
  { from: { x: -300, y: 150 }, to: { x: -100, y: 0 }, status: 'warning', load: 89 },
  
  // 变电站之间
  { from: { x: -100, y: -100 }, to: { x: -100, y: 0 }, status: 'normal', load: 42 },
  { from: { x: -100, y: 0 }, to: { x: -100, y: 100 }, status: 'normal', load: 35 },
  
  // 变电站到负荷中心
  { from: { x: -100, y: -100 }, to: { x: 200, y: -150 }, status: 'normal', load: 52 },
  { from: { x: -100, y: 0 }, to: { x: 200, y: 0 }, status: 'normal', load: 68 },
  { from: { x: -100, y: 100 }, to: { x: 200, y: 150 }, status: 'error', load: 92 }
]);

// 缩放控制函数
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.1, 2);
  updateViewBox();
};

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.1, 0.5);
  updateViewBox();
};

const resetView = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  updateViewBox();
};

const updateViewBox = () => {
  const newWidth = svgWidth.value / scale.value;
  const newHeight = svgHeight.value / scale.value;
  const newX = -newWidth / 2 + translateX.value;
  const newY = -newHeight / 2 + translateY.value;
  viewBox.value = `${newX} ${newY} ${newWidth} ${newHeight}`;
};

// 拖拽相关函数
const handleMouseDown = (e) => {
  if (e.target.tagName === 'svg') {
    isDragging.value = true;
    dragStart.value = {
      x: e.clientX - translateX.value,
      y: e.clientY - translateY.value
    };
    svgContainer.value.style.cursor = 'grabbing';
  }
};

const handleMouseMove = (e) => {
  if (isDragging.value) {
    translateX.value = e.clientX - dragStart.value.x;
    translateY.value = e.clientY - dragStart.value.y;
    updateViewBox();
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  svgContainer.value.style.cursor = 'grab';
};

// 节点选择函数
const selectNode = (type, index) => {
  if (type === 'plant') {
    selectedNode.value = powerPlants.value[index];
  } else if (type === 'substation') {
    selectedNode.value = substations.value[index];
  } else if (type === 'load') {
    selectedNode.value = loadCenters.value[index];
  }
};

const deselectNode = () => {
  selectedNode.value = null;
};

const handleSvgClick = () => {
  deselectNode();
};

// 格式化状态显示
const formatStatus = (status) => {
  const statusMap = {
    normal: '正常',
    warning: '预警',
    error: '故障'
  };
  return statusMap[status] || status;
};

// 获取节点颜色
const getNodeColor = (status) => {
  const colorMap = {
    normal: 'rgba(0, 204, 102, 0.7)',
    warning: 'rgba(255, 153, 0, 0.7)',
    error: 'rgba(255, 68, 68, 0.7)'
  };
  return colorMap[status] || 'rgba(100, 100, 100, 0.7)';
};

// 获取线路颜色
const getLineColor = (line) => {
  if (line.status === 'error') return 'rgba(255, 68, 68, 0.8)';
  if (line.status === 'warning') return 'rgba(255, 153, 0, 0.8)';
  
  // 正常状态下根据负载调整颜色
  if (line.load > 70) return 'rgba(255, 204, 0, 0.8)';
  return 'rgba(0, 204, 102, 0.8)';
};

// 获取节点类型
const getNodeType = () => {
  if (powerPlants.value.includes(selectedNode.value)) return '发电站';
  if (substations.value.includes(selectedNode.value)) return '变电站';
  if (loadCenters.value.includes(selectedNode.value)) return '负荷中心';
  return '未知';
};

// 模拟数据更新
const updateNodeStatus = () => {
  const now = new Date().toLocaleTimeString();
  
  // 随机更新一些节点状态
  if (Math.random() > 0.7) {
    const randomPlant = powerPlants.value[Math.floor(Math.random() * powerPlants.value.length)];
    randomPlant.output = Math.floor(Math.random() * 300) + 500;
    randomPlant.lastUpdate = now;
  }
  
  if (Math.random() > 0.7) {
    const randomLoad = loadCenters.value[Math.floor(Math.random() * loadCenters.value.length)];
    randomLoad.load = Math.floor(Math.random() * 200) + 300;
    randomLoad.lastUpdate = now;
  }
  
  // 随机更新线路负载
  lines.value.forEach(line => {
    if (Math.random() > 0.7) {
      line.load = Math.min(100, Math.max(30, line.load + (Math.random() * 10 - 5)));
      // 根据负载自动更新状态
      if (line.load > 90) {
        line.status = 'error';
      } else if (line.load > 75) {
        line.status = 'warning';
      } else {
        line.status = 'normal';
      }
    }
  });
};

// 初始化事件监听
onMounted(() => {
  const container = svgContainer.value;
  container.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  // 每5秒更新一次数据
  setInterval(updateNodeStatus, 5000);
  
  // 初始化最后更新时间
  const now = new Date().toLocaleTimeString();
  [...powerPlants.value, ...substations.value, ...loadCenters.value].forEach(node => {
    node.lastUpdate = now;
  });
});

// 清理事件监听
const cleanup = () => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

// 监听组件卸载
watch(() => true, cleanup, { once: true });
</script>

<style scoped>
.topology-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.topology-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
}

.control-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.status-legend {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #9eabb3;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}

.status-dot.normal { background-color: rgba(0, 204, 102, 0.8); }
.status-dot.warning { background-color: rgba(255, 153, 0, 0.8); }
.status-dot.error { background-color: rgba(255, 68, 68, 0.8); }

.topology-svg-container {
  flex: 1;
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.power-line {
  transition: all 1s ease;
}

.substation-node, .power-plant-node, .load-center-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.substation-node:hover, .power-plant-node:hover, .load-center-node:hover {
  filter: brightness(1.3);
  transform: scale(1.05);
}

.node-details {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(11, 19, 43, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 15px;
  width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.node-details h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #e2e8f0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.detail-item span:first-child {
  color: #cbd5e1;
}

.status-label {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
}

.status-label.normal { background-color: rgba(0, 204, 102, 0.7); }
.status-label.warning { background-color: rgba(255, 153, 0, 0.7); }
.status-label.error { background-color: rgba(255, 68, 68, 0.7); }

.close-details {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  padding: 5px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 12px;
}

.close-details:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
