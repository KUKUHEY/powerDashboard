<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import { io } from "socket.io-client";

const chartRef = ref(null);
let chartInstance = null;
let socket = null;
const timeData = ref([]);
const maxDataPoints = 30;
const loadData = ref([]); // 初始化24小时数据

// 初始化图表
const initChart = () => {
  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        return `时间: ${params[0].name}<br/>负荷: ${params[0].value}MW`;
      }
    },
    xAxis: { 
      type: "category", 
      data: timeData.value,
      axisLine: { lineStyle: { color: '#6b7b8c' } },
      axisLabel: { 
        color: '#9eabb3',
        formatter: function(value) {
          // 只显示分钟和秒，避免过于拥挤
          return value.substring(11, 19);
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
      data: loadData.value,
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
  };
  
  chartInstance.setOption(option);
};

onMounted(() => {
  initChart();

  // 连接 WebSocket
  socket = io("http://localhost:8081", {
  transports: ['websocket'], // 明确传输方式
  withCredentials: true, // 如果需要凭证
});

  socket.on("connect", () => {
    console.log("✅ WebSocket connected:");
  });

  socket.on("connect_error", (err) => {
    console.error("❌ WebSocket connect_error:", err.message);
  });

  socket.on("update", (data) => {
    timeData.value.push(data.timestamp);
    loadData.value.push(data.load);
    
    if (timeData.value.length > maxDataPoints) {
      timeData.value.shift();
      loadData.value.shift();
    }

    updateChart();
  });

  window.addEventListener("resize", () => {
    chartInstance && chartInstance.resize();
  });
});

onBeforeUnmount(() => {
  socket && socket.disconnect();
  chartInstance && chartInstance.dispose();
});
</script>


<style scoped>
.chart {
  width: 100%;
  min-height: 300px; 
  height: auto;
  border-radius: 4px;
}
</style>
