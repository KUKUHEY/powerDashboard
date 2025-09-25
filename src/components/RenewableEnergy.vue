
<template>
  <div class="renewable-energy">
    <!-- 顶部统计摘要 -->
    <div class="energy-summary">
      <div class="summary-item">
        <div class="label">新能源占比</div>
        <div class="value">{{ renewablePercentage }}%</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: renewablePercentage + '%' }"></div>
        </div>
      </div>
      <div class="summary-item">
        <div class="label">总发电</div>
        <div class="value">{{ totalOutput }} MW</div>
        <div class="sub-label">容量: {{ totalCapacity }} MW</div>
      </div>
    </div>

    <!-- 紧凑型能源类型展示 -->
    <div class="compact-energy-types">
      <div v-for="type in energyTypes" :key="type.name" class="compact-energy-item">
        <div class="compact-header">
          <span class="type-badge" :style="{ backgroundColor: type.color }"></span>
          <span class="type-name">{{ type.name.substring(0, 2) }}</span>
          <span class="type-value">{{ type.value }} MW</span>
          <span class="trend-indicator" :class="getTrendClass(type.name)">
            {{ getTrendArrow(type.name) }}
          </span>
        </div>
        <div class="compact-progress">
          <div class="progress-text">利用率: {{ Math.round(type.value / type.capacity * 100) }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ 
              width: (type.value / type.capacity * 100) + '%',
              backgroundColor: type.color
            }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div class="compact-stats">
      <div class="stat-item">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ formattedDailyGeneration  }} MWh</div>
          <div class="stat-label">今日发电</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">🌿</div>
        <div class="stat-content">
          <div class="stat-value">{{ formattedCo2Reduction  }} 吨</div>
          <div class="stat-label">CO₂减排</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
// import { io } from 'socket.io-client';
import { useRenewableStore } from '../stores/renewable'
import { useWebSocketStore } from '../stores/websocket'

const renewableStore = useRenewableStore();
const wsStore = useWebSocketStore();

// 从 store 获取计算属性
const energyTypes = renewableStore.energyTypes
const totalCapacity = renewableStore.totalCapacity
const totalOutput = renewableStore.totalOutput
const renewablePercentage = renewableStore.renewablePercentage
const formattedDailyGeneration = renewableStore.formattedDailyGeneration
const formattedCo2Reduction = renewableStore.formattedCo2Reduction

// 获取趋势类和箭头
const getTrendClass = (type) => renewableStore.getTrend(type)
const getTrendArrow = (type) => renewableStore.getTrendArrow(type)


onMounted(() => {
  // 初始化新能源数据监听
  renewableStore.init()
});

onUnmounted(() => {
  // 清理事件监听
  wsStore.off("renewable_update", renewableStore.updateEnergyData)
});
</script>

<style scoped>
.renewable-energy {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.energy-summary {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.summary-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 8px;
  text-align: center;
}

.summary-item .label {
  font-size: 11px;
  color: #9eabb3;
  margin-bottom: 3px;
}

.summary-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.summary-item .sub-label {
  font-size: 10px;
  color: #9eabb3;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.compact-energy-types {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compact-energy-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 6px;
}

.compact-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.type-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-name {
  font-size: 11px;
  color: #e2e8f0;
  font-weight: 500;
  min-width: 20px;
}

.type-value {
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  flex: 1;
  text-align: right;
}

.trend-indicator {
  font-size: 12px;
  font-weight: bold;
  width: 12px;
  text-align: center;
}

.trend-indicator.up {
  color: #4CAF50;
}

.trend-indicator.down {
  color: #F44336;
}

.trend-indicator.stable {
  color: #FFC107;
}

.compact-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 10px;
  color: #9eabb3;
  min-width: 50px;
}

.compact-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
}

.stat-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  line-height: 1.2;
}

.stat-label {
  font-size: 9px;
  color: #9eabb3;
  line-height: 1.2;
}
</style>
