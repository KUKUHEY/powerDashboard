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
const loadData = ref(Array(24).fill(0)); // 初始化24小时数据

// 初始化图表
const initChart = () => {
  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  const option = {
    title: { 
      text: "实时电网负荷", 
      textStyle: { color: "#fff" } 
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        return `时间: ${params[0].name}<br/>负荷: ${params[0].value}MW`;
      }
    },
    xAxis: { 
      type: "category", 
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#6b7b8c' } },
      axisLabel: { color: '#9eabb3' }
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
    console.log("📡 收到数据:", data);
    // 更新数据：移除最旧的数据，添加新数据
    loadData.value.shift();
    loadData.value.push(data.load);
    
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
  height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
</style>
