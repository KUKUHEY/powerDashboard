
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
          <div class="stat-value">{{ dailyGeneration }} MWh</div>
          <div class="stat-label">今日发电</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">🌿</div>
        <div class="stat-content">
          <div class="stat-value">{{ co2Reduction }} 吨</div>
          <div class="stat-label">CO₂减排</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const energyData = ref({
  solar: 125.8,
  wind: 283.5,
  hydro: 156.2,
  biomass: 45.3
});

// 装机容量 (MW)
const capacities = ref({
  solar: 200,
  wind: 350,
  hydro: 180,
  biomass: 60
});

// 记录上一次的数据用于计算趋势
const prevEnergyData = ref({...energyData.value});

// 趋势状态
const trends = ref({
  solar: 'stable',
  wind: 'stable',
  hydro: 'stable',
  biomass: 'stable'
});

// 今日累计发电量 (MWh)
const dailyGeneration = ref(0);
// CO₂减排量 (吨)
const co2Reduction = ref(0);

let socket = null;
let updateInterval = null;

const energyTypes = computed(() => [
  { 
    name: '太阳能', 
    value: energyData.value.solar, 
    capacity: capacities.value.solar,
    color: '#FFD700'
  },
  { 
    name: '风能', 
    value: energyData.value.wind, 
    capacity: capacities.value.wind,
    color: '#87CEEB'
  },
  { 
    name: '水电', 
    value: energyData.value.hydro, 
    capacity: capacities.value.hydro,
    color: '#4169E1'
  },
  { 
    name: '生物质', 
    value: energyData.value.biomass, 
    capacity: capacities.value.biomass,
    color: '#32CD32'
  }
]);

const totalCapacity = computed(() => {
  return Object.values(capacities.value).reduce((sum, cap) => sum + cap, 0);
});

const totalOutput = computed(() => {
  return Object.values(energyData.value).reduce((sum, output) => sum + output, 0);
});

const renewablePercentage = computed(() => {
  return Math.round((totalOutput.value / totalCapacity.value) * 100);
});

// 监听数据变化，计算趋势
watch(energyData, (newData, oldData) => {
  Object.keys(newData).forEach(key => {
    const change = newData[key] - oldData[key];
    if (change > 0.5) {
      trends.value[key] = 'up';
    } else if (change < -0.5) {
      trends.value[key] = 'down';
    } else {
      trends.value[key] = 'stable';
    }
  });
  prevEnergyData.value = {...oldData};
}, { deep: true });

const getTrendClass = (type) => {
  const key = type === '太阳能' ? 'solar' : 
             type === '风能' ? 'wind' :
             type === '水电' ? 'hydro' : 'biomass';
  return trends.value[key];
};

const getTrendArrow = (type) => {
  const key = type === '太阳能' ? 'solar' : 
             type === '风能' ? 'wind' :
             type === '水电' ? 'hydro' : 'biomass';
  
  switch(trends.value[key]) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};

// 更新累计发电量和减排量
const updateAccumulatedData = () => {
  // 每10秒更新一次，将功率转换为电量 (MW -> MWh/10s)
  const hoursIn10Seconds = 10 / 3600;
  const energyGenerated = totalOutput.value * hoursIn10Seconds;
  
  dailyGeneration.value = parseFloat((dailyGeneration.value + energyGenerated).toFixed(1));
  
  // 计算CO₂减排量 (假设每MWh减排0.8吨CO₂)
  const co2ReductionPerMWh = 0.8;
  co2Reduction.value = parseFloat((dailyGeneration.value * co2ReductionPerMWh).toFixed(1));
};

onMounted(() => {
  socket = io("http://localhost:8081", {
    transports: ['websocket'],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("✅ 新能源数据连接成功");
  });

  socket.on("renewable_update", (data) => {
    energyData.value = {
      solar: data.solar,
      wind: data.wind,
      hydro: data.hydro,
      biomass: data.biomass
    };
    
    if (data.capacity) {
      capacities.value = data.capacity;
    }
  });

  updateInterval = setInterval(updateAccumulatedData, 10000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (socket) {
    socket.disconnect();
  }
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
