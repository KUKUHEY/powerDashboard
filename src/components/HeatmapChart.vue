<template>
  <div class="regional-power-chart">
    <!-- 年份选择器 -->
    <div class="year-selector">
      <div class="year-buttons">
        <button 
          v-for="year in availableYears" 
          :key="year"
          :class="{ active: selectedYear === year }"
          @click="selectYear(year)"
        >
          {{ year }}年
        </button>
      </div>
      <div class="year-info" v-if="selectedYear">
        当前显示: {{ selectedYear }}年数据 | 全国总负荷: {{ formattedTotalLoad }} MW
      </div>
    </div>

    <!-- 地图容器 -->
    <div ref="chartRef" class="chart"></div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount,watch } from "vue";
import * as echarts from "echarts";
import { useHeatmapStore } from '../stores/heatmap'
import { useWebSocketStore } from '../stores/websocket'

const chartRef = ref(null);
let chartInstance = null; 
const heatmapStore = useHeatmapStore()
const wsStore = useWebSocketStore()

// 从 store 获取状态
const availableYears = computed(() => heatmapStore.availableYears)
const selectedYear = computed(() => heatmapStore.selectedYear)
const chartData = computed(() => heatmapStore.chartData)
const loading = computed(() => heatmapStore.loading)
const formattedTotalLoad = computed(() => heatmapStore.formattedTotalLoad)
const status = computed(() => heatmapStore.status)

// 数字格式化
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);

  try {
    const geoJson = await fetch(
      "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
    ).then(res => res.json());

    echarts.registerMap("china", geoJson);
    updateChart();
  } catch (error) {
    console.error("地图数据加载失败:", error);
    heatmapStore.handleConnectError(error);
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance || !heatmapStore.hasData) return;

  const option = {
    tooltip: {
      trigger: "item",
      formatter: params => {
        const value = params.value || 0
        const percentage = heatmapStore.totalLoad > 0 ? 
          ((value / heatmapStore.totalLoad) * 100).toFixed(1) : 0
        return `${params.name}<br/>负荷: ${formatNumber(value)} MW<br/>占比: ${percentage}%`}
    },
    visualMap: {
      min: 1000,
      max: 6500,
      left: "left",
      bottom: "20%",
      text: ["高负荷", "低负荷"],
      inRange: { 
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', 
                '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] 
      },
      textStyle: { color: "#fff" }
    },
    series: [
      {
        name: "电力负荷",
        type: "map",
        map: "china",
        roam: true,
        emphasis: {
          label: {
            show: true,
            color: "#fff"
          }
        },
        itemStyle: {
          areaColor: "#0f172a",
          borderColor: "#404a59"
        },
        data: chartData.value
      }
    ]
  };

  chartInstance.setOption(option);
};

// 选择年份
const selectYear = (year) => {
  heatmapStore.selectYear(year);
};

// 监听数据变化，自动更新图表
watch(chartData, () => {
  updateChart()
}, { deep: true });

// 监听加载状态变化
watch(loading, (newLoading) => {
  if (!newLoading && heatmapStore.hasData) {
    updateChart();
  }
});

onMounted(async () => {
  await initChart();

  // 初始化热力图数据监听
  heatmapStore.init();

  window.addEventListener("resize", () => {
    chartInstance && chartInstance.resize();
  });
});

onBeforeUnmount(() => {
  // 清理事件监听
  wsStore.off('year_data', heatmapStore.handleYearData);
  wsStore.off('year_data_error', heatmapStore.handleYearDataError);
  wsStore.off('connect_error', heatmapStore.handleConnectError);

  if (chartInstance) {
    chartInstance.dispose();
  }

   window.removeEventListener("resize", () => {
    chartInstance && chartInstance.resize()
  });

});
</script>

<style scoped>
.regional-power-chart {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.year-selector {
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.year-selector h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #fff;
}

.year-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.year-buttons button {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.year-buttons button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.year-buttons button.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

.year-info {
  font-size: 12px;
  color: #94a3b8;
}

.chart {
  flex: 1;
  min-height: 500px;
  height: 600px;

}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  border-radius: 4px;
  color: #fff;
}
</style>