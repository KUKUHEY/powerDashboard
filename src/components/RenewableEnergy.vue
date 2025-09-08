<template>
  <div class="renewable-energy">
    <div class="energy-summary">
      <div class="summary-item">
        <div class="label">新能源占比</div>
        <div class="value">{{ renewablePercentage }}%</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: renewablePercentage + '%' }"></div>
        </div>
      </div>
      <div class="summary-item">
        <div class="label">总装机容量</div>
        <div class="value">{{ totalCapacity }} MW</div>
      </div>
    </div>
    
    <div class="energy-types">
      <div class="energy-type" v-for="type in energyTypes" :key="type.name">
        <div class="type-header">
          <span class="type-name">{{ type.name }}</span>
          <span class="type-value">{{ type.value }} MW</span>
        </div>
        <div class="type-progress">
          <div class="progress-fill" :style="{ 
            width: (type.value / type.capacity * 100) + '%',
            backgroundColor: type.color
          }"></div>
        </div>
        <div class="type-footer">
          <span>容量: {{ type.capacity }} MW</span>
          <span>利用率: {{ Math.round(type.value / type.capacity * 100) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { io } from 'socket.io-client';

const energyData = ref({
  solar: 0,
  wind: 0,
  hydro: 0,
  biomass: 0
});

const capacities = {
  solar: 2000,
  wind: 1500,
  hydro: 1000,
  biomass: 500
};

let socket = null;

const energyTypes = computed(() => [
  { 
    name: '太阳能', 
    value: energyData.value.solar, 
    capacity: capacities.solar,
    color: '#FFD700'
  },
  { 
    name: '风能', 
    value: energyData.value.wind, 
    capacity: capacities.wind,
    color: '#87CEEB'
  },
  { 
    name: '水电', 
    value: energyData.value.hydro, 
    capacity: capacities.hydro,
    color: '#4169E1'
  },
  { 
    name: '生物质', 
    value: energyData.value.biomass, 
    capacity: capacities.biomass,
    color: '#32CD32'
  }
]);

const totalCapacity = computed(() => {
  return Object.values(capacities).reduce((sum, cap) => sum + cap, 0);
});

const totalOutput = computed(() => {
  return Object.values(energyData.value).reduce((sum, output) => sum + output, 0);
});

const renewablePercentage = computed(() => {
  return Math.round((totalOutput.value / totalCapacity.value) * 100);
});

onMounted(() => {
  socket = io("http://localhost:8081", {
    transports: ['websocket'],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("✅ 新能源数据连接成功");
  });

  socket.on("renewable_update", (data) => {
    energyData.value = data;
  });

  // 初始模拟数据
  energyData.value = {
    solar: Math.floor(Math.random() * 1500 + 500),
    wind: Math.floor(Math.random() * 1200 + 300),
    hydro: Math.floor(Math.random() * 800 + 200),
    biomass: Math.floor(Math.random() * 400 + 100)
  };
});
</script>

<style scoped>
.renewable-energy {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.energy-summary {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 10px;
}

.summary-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.summary-item .label {
  font-size: 12px;
  color: #9eabb3;
  margin-bottom: 5px;
}

.summary-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.energy-types {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.energy-type {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 10px;
}

.type-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  color: #e2e8f0;
}

.type-value {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.type-progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.type-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9eabb3;
}
</style>
[file content end]