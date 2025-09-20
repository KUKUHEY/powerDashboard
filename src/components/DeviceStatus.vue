<template>
  <div class="device-status">
    <div class="device-value">
      <ul>
        <li>{{ formatNumber(deviceData.online) }}</li>
        <li>{{ deviceData.rate }}%</li>
      </ul>
    </div>
    
    <div class="device-title">
      <ul>
        <li>在线设备</li>
        <li>在线率</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const deviceData = ref({
  online: 1453,
  rate: 96.9
});

let socket = null;
let prevOnline = 1453;

// 数字格式化
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 计算趋势
const trendClass = computed(() => {
  if (deviceData.value.online > prevOnline) return 'trend-up';
  if (deviceData.value.online < prevOnline) return 'trend-down';
  return 'trend-stable';
});

const trendIcon = computed(() => {
  if (deviceData.value.online > prevOnline) return '↗';
  if (deviceData.value.online < prevOnline) return '↘';
  return '→';
});

onMounted(() => {
  socket = io("http://localhost:8081", {
    transports: ['websocket'],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("✅ 设备状态连接成功");
  });

  socket.on("device_status", (data) => {
    prevOnline = deviceData.value.online;
    deviceData.value = {
      online: data.online,
      rate: data.rate
    };
  });
});

onUnmounted(() => {
  socket && socket.disconnect();
});
</script>

<style scoped>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

li{
  list-style: none;
}

/* 声明字体*/
@font-face {
  font-family: electronicFont;
  src: url(../font/DS-DIGIT.TTF);
}

.device-status {
  background: rgba(58, 87, 173, 0.1);
  padding: 15px;
}

.device-value {
  position: relative;
  border: 1px solid rgba(25, 186, 139, 0.17);
}

.device-value::before{
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 30px;
  height: 10px;
  border-top: 2px solid #02a6b5;
  border-left: 2px solid #02a6b5;
}

.device-value::after{
  position: absolute;
  content: "";
  bottom: 0;
  right: 0;
  width: 30px;
  height: 10px;
  border-bottom: 2px solid #02a6b5;
  border-right: 2px solid #02a6b5;
}

.device-value ul{
  display: flex;
}

.device-value ul li{
  position: relative;
  height: 80px;
  text-align: center;
  flex: 1;
  line-height: 80px;
  font-size: 60px;
  color: #ffeb7b;
  font-family: electronicFont;
}

.device-value ul li:first-child::after{
  content: "";
  position: absolute;
  height: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  right: 0;
  top: 25%;
}

.device-title ul{
  display: flex;
}

.device-title ul li{
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  padding-top: 10px;
}
</style>