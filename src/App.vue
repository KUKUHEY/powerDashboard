<template>
  <div class="background">
  <div class="dashboard">
    <!-- 顶部标题栏 -->
    <header class="header">
      <h1>智能电网监控大屏</h1>
      <div class="time">{{ currentTime }}</div>
    </header>

    <!-- 主体布局 -->
    <div class="main">
      <!-- 左侧 -->
      <div class="left">
        <section class="panel load-chart">
          <h2>实时电网负荷</h2>
          <PowerChart />
          <div class="panel-footer"></div>
        </section>
        <section class="panel alarm-list">
          <AlarmList />
          <div class="panel-footer"></div>
        </section>
      </div>

      <!-- 中间 -->
      <div class="center">
        <!-- 在线设备状态卡片 -->
          <DeviceStatus />
        <section class="panel">       
           <h2>全国电力分布图</h2>
           <HeatmapChart />
          <div class="panel-footer"></div>
        </section>
      </div>
      <!-- 右侧 -->
      <div class="right">
        <section class="panel">
          <!-- <h2>区域热力图</h2>
           <HeatmapChart /> -->
           <h2>电网拓扑图</h2>
           <GridTopology />
          <div class="panel-footer"></div>
        </section>
        <section class="panel">
          <h2>新能源接入情况</h2>
           <RenewableEnergy />
          <div class="panel-footer"></div>
        </section>
      </div>
    </div>
  </div>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import PowerChart from './components/PowerChart.vue';
import AlarmList from './components/AlarmList.vue';
import GridTopology from './components/GridTopology.vue';
import HeatmapChart from './components/HeatmapChart.vue';
import RenewableEnergy from './components/RenewableEnergy.vue';
import DeviceStatus from './components/DeviceStatus.vue';

const currentTime = ref('');

const updateTime = () => {
  currentTime.value = new Date().toLocaleString();
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);
});

</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('../public/images/image.png') no-repeat top center;
  background-size: cover; 
}

.dashboard {
  height: 100%; /* 仪表盘占满背景容器 */
  background-color: rgba(11, 19, 43, 0.8); /* 半透明背景 */
  color: #fff;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}


/* 顶部栏 */
.header {
  position: relative;
  height: 75px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url(../images/head_bg.png) no-repeat;
  background-size: 100% 100%;
}

.header h1 {
  font-size: 38px;
  color: #fff;
}

.header .time {
  position: absolute;
  font-size: 20px;
  right: 30px;
  top: 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 75px;
}

/* 主体三列 */
.main {
  display: flex;
  min-width: 1024px;
  max-width: 1920px;
  gap: 10px;
  padding: 10px 10px 0;
  height: calc(100% - 75px); 
}

/* 三列设置 */
.left, .center, .right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 0;
}

.left { flex: 2;}   

.center { 
  flex: 3;
  display: flex;
 } /* 中列占2份 */
.right { flex: 2; }  /* 右列占1份 */


/* 模块面板 */
.panel {
  position: relative;
  height: 310px;
  background: url(../images/line.png) rgba(255, 255, 255, 0.03);
  padding: 0 15px 40px;
  flex: 1;
  display: flex;
  border: 1px solid rgba(25, 186, 139, 0.17);
  flex-direction: column;
}

.panel::before {
  position: absolute;
  top: 0;
  left: 0;
  content: "";
  width: 10px;
  height: 10px;
  border-top: 2px solid #02a6b5;
  border-left: 2px solid #02a6b5;
}

.panel::after {
  position: absolute;
  top: 0;
  right: 0;
  content: "";
  width: 10px;
  height: 10px;
  border-top: 2px solid #02a6b5;
  border-right: 2px solid #02a6b5;
}

.panel .panel-footer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
}

.panel .panel-footer::before {
  position: absolute;
  bottom: 0;
  left: 0;
  content: "";
  width: 10px;
  height: 10px;
  border-bottom: 2px solid #02a6b5;
  border-left: 2px solid #02a6b5;
}

.panel .panel-footer::after {
  position: absolute;
  bottom: 0;
  right: 0;
  content: "";
  width: 10px;
  height: 10px;
  border-bottom: 2px solid #02a6b5;
  border-right: 2px solid #02a6b5;
}

.panel h2 {
  font-size: 16px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 5px;
}

.device-status-panel{
  flex: 1;
}

.center .panel:not(.device-status-panel) {
  flex: 4;
}
</style>
