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
        当前显示: {{ selectedYear }}年数据 | 全国总负荷: {{ formatNumber(totalLoad) }} MW
      </div>
    </div>

    <!-- 地图容器 -->
    <div ref="chartRef" class="chart"></div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import { io } from "socket.io-client";

const chartRef = ref(null);
let chartInstance = null; 
let socket = null; 
const selectedYear = ref("2023");
const chartData = ref([]);
const loading = ref(false);

const availableYears = ["2020", "2021", "2022", "2023", "2024"];

// 计算总负荷
const totalLoad = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.value, 0);
});

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
    loading.value = false;
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    tooltip: {
      trigger: "item",
      formatter: params => {
        return `${params.name}<br/>负荷: ${formatNumber(params.value || 0)} MW<br/>占比: ${((params.value / totalLoad.value) * 100).toFixed(1)}%`;
      }
    },
    visualMap: {
      min: 1000,
      max: 6500,
      left: "left",
      bottom: "10%",
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
  if (selectedYear.value === year) return;
  
  selectedYear.value = year;
  loading.value = true;
  
  // 检查socket是否已连接
  if (socket && socket.connected) {
    socket.emit('request_year_data', year);
  } else {
    console.error("WebSocket未连接");
    loading.value = false;
    
    // 模拟数据作为备选方案
    setTimeout(() => {
      generateMockData(year);
      loading.value = false;
    }, 500);
  }
};

// 生成模拟数据（备选方案）
const generateMockData = (year) => {
  const baseData = {
    "2020": 3000, "2021": 3200, "2022": 3500, "2023": 3800, "2024": 4000
  };
  
  const baseValue = baseData[year] || 3500;
  
  const mockData = [
    { name: "北京市", value: Math.round(baseValue * 0.9 + Math.random() * 500) },
    { name: "天津市", value: Math.round(baseValue * 0.7 + Math.random() * 400) },
    { name: "河北省", value: Math.round(baseValue * 1.2 + Math.random() * 600) },
    { name: "山西省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
    { name: "内蒙古自治区", value: Math.round(baseValue * 0.8 + Math.random() * 400) },
    { name: "辽宁省", value: Math.round(baseValue * 1.3 + Math.random() * 600) },
    { name: "吉林省", value: Math.round(baseValue * 0.9 + Math.random() * 400) },
    { name: "黑龙江省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
    { name: "上海市", value: Math.round(baseValue * 1.4 + Math.random() * 700) },
    { name: "江苏省", value: Math.round(baseValue * 1.5 + Math.random() * 800) },
    // 可以继续添加其他省份...
  ];
  
  chartData.value = mockData;
  updateChart();
};

// 处理年份数据
const handleYearData = (data) => {
  chartData.value = data;
  updateChart();
  loading.value = false;
};

onMounted(async () => {
  await initChart();

  try {
    socket = io("http://localhost:8081", { 
      transports: ["websocket"],
      withCredentials: true,
      timeout: 5000
    });

    socket.on("connect", () => {
      console.log("✅ 区域数据WebSocket连接成功");
      // 初始加载当前选中年份的数据
      selectYear(selectedYear.value);
    });

    socket.on("year_data", (data) => {
      if (data.year === selectedYear.value) {
        handleYearData(data.data);
      }
    });

    socket.on("year_data_error", (error) => {
      console.error("数据加载错误:", error);
      loading.value = false;
      // 使用模拟数据作为备选
      generateMockData(selectedYear.value);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ 区域数据连接错误:", err.message);
      loading.value = false;
      // 使用模拟数据作为备选
      generateMockData(selectedYear.value);
    });

    // 设置连接超时
    setTimeout(() => {
      if (!socket?.connected) {
        console.warn("WebSocket连接超时，使用模拟数据");
        generateMockData(selectedYear.value);
      }
    }, 3000);

  } catch (error) {
    console.error("WebSocket初始化失败:", error);
    generateMockData(selectedYear.value);
  }

  window.addEventListener("resize", () => {
    chartInstance && chartInstance.resize();
  });
});

onBeforeUnmount(() => {
  if (socket) {
    socket.disconnect();
  }
  if (chartInstance) {
    chartInstance.dispose();
  }
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
  min-height: 400px;
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