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
        </section>
        <section class="panel alarm-list">
          <AlarmList />
        </section>
      </div>

      <!-- 中间 -->
      <div class="center">
        <section class="panel">
          <h2>电网拓扑图</h2>
           <GridTopology />
        </section>
      </div>

      <!-- 右侧 -->
      <div class="right">
        <section class="panel">
          <h2>区域热力图</h2>
          <!-- <div class="placeholder">Heatmap Here</div> -->
           <HeatmapChart />
        </section>
        <section class="panel">
          <h2>新能源接入情况</h2>
          <!-- <div class="placeholder">Renewable Data Here</div> -->
           <RenewableEnergy />
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
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('../public/images/image.png') no-repeat center center;
  background-size: cover; /* 背景铺满 */
  overflow: hidden;
}

.dashboard {
   height: 100%; /* 仪表盘占满背景容器 */
  background-color: rgba(11, 19, 43, 0.9); /* 半透明背景 */
  color: #fff;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}


/* 顶部栏 */
.header {
  height: 60px;
  background-color: #1c2541;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 15px;
  border-bottom: 2px solid #3a506b;
  flex-shrink: 0;
}

.time {
  font-size: 15px;
  color: #9eabb3;
}

/* 主体三列 */
.main {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  height: calc(100% - 60px); /* 减去顶部栏高度 */
  /* overflow-x: hidden; */
}

/* 三列设置 */
.left, .center, .right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 0;
}

.left { 
  flex: 1;

}   /* 左列占1份 */
.center { flex: 2; } /* 中列占2份 */
.right { flex: 1; }  /* 右列占1份 */


/* 模块面板 */
.panel {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  /* min-height: 0;  */
  /* 关键：防止溢出导致滚动条 */
  box-sizing: border-box;
}

.panel h2 {
  font-size: 16px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 5px;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

 .alarm-list{
  min-height: 0;
 }

</style>
