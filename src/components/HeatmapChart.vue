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

// 初始化图表
const initChart = async () => {
  chartInstance = echarts.init(chartRef.value);

  const geoJson = await fetch(
    "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
  ).then(res => res.json());

  echarts.registerMap("china", geoJson);

  chartInstance.setOption({
    title: {
      text: "区域电力负荷热力图",
      left: "center",
      textStyle: { color: "#fff", fontSize: 16 }
    },
    tooltip: {
      trigger: "item",
      formatter: params => `${params.name}<br/>负荷: ${params.value || 0} MW`
    },
    visualMap: {
      min: 0,
      max: 5000,
      left: "left",
      bottom: "10%",
      text: ["高负荷", "低负荷"],
      inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', 
                '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] },
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
          areaColor: "#0f172a", // 默认区域颜色
          borderColor: "#404a59"
        },
        // label: { show: false, color: "#fff" },
        data: []
      }
    ]
  });

  window.addEventListener("resize", () => {
    chartInstance.resize();
  });
};

onMounted(async () => {
  await initChart();

  socket = io("http://localhost:8081", { transports: ["websocket"] });

  socket.on("connect", () => {
    console.log("✅ Heatmap WebSocket connected:", socket.id);
  });

  socket.on("heatmapUpdate", (data) => {
    console.log("📡 热力图数据:", data);
    chartInstance.setOption({
      series: [{ data }]
    });
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Heatmap WebSocket connect_error:", err.message);
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
  height: 100%;
}
</style>
