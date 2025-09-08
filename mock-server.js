import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// 配置Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 告警配置
const ALARM_THRESHOLD = 4500; // 负荷告警阈值
let alarmHistory = []; // 存储告警历史

// 模拟负荷与告警
setInterval(() => {
  const load = Math.floor(Math.random() * 3000 + 2000);
  const status = Math.random() > 0.9 ? 'fault' : 'normal';
  const mockData = {
    timestamp: new Date().toISOString(),
    load,
    status
  };

  // 发送实时数据
  io.emit('update', mockData);
  console.log('发送数据:', mockData);

  // 检查告警
  let alarm = null;
  if (load > ALARM_THRESHOLD) {
    alarm = {
      id: Date.now(),
      type: 'load_exceed',
      message: `负荷过高: ${load}MW，超过阈值${ALARM_THRESHOLD}MW`,
      level: 'high',
      timestamp: mockData.timestamp,
      handled: false
    };
  } else if (status === 'fault') {
    alarm = {
      id: Date.now(),
      type: 'system_fault',
      message: '系统状态异常',
      level: 'critical',
      timestamp: mockData.timestamp,
      handled: false
    };
  }

  if (alarm) {
    alarmHistory.push(alarm);
    if (alarmHistory.length > 100) alarmHistory.shift();
    io.emit('alarm', alarm);
    console.log('触发告警:', alarm);
  }
}, 2000);

// 🔥 模拟区域热力图数据
setInterval(() => {
  const heatmapData = [
    { name: "北京市", value: Math.round(Math.random() * 5000) },
    { name: "上海市", value: Math.round(Math.random() * 5000) },
    { name: "广东省", value: Math.round(Math.random() * 5000) },
    { name: "四川省", value: Math.round(Math.random() * 5000) },
    { name: "山东省", value: Math.round(Math.random() * 5000) }
  ];
  io.emit("heatmapUpdate", heatmapData);
  console.log("发送热力图数据:", heatmapData);
}, 5000);

// 🔥 模拟新能源数据 - 更符合实际的缓慢变化
// 初始化基础值
let renewableBaseValues = {
  solar: 125,   // 初始太阳能发电量
  wind: 280,    // 初始风能发电量
  hydro: 150,   // 初始水电发电量
  biomass: 45  // 初始生物质发电量
};

// 装机容量 - 单位：MW
const installedCapacity = {
  solar: 200,   // 太阳能装机容量：200 MW
  wind: 350,    // 风能装机容量：350 MW
  hydro: 180,   // 水电装机容量：180 MW
  biomass: 60   // 生物质装机容量：60 MW
};

// 模拟昼夜影响的太阳能发电曲线
function getSolarOutput() {
  const now = new Date();
  const hour = now.getHours();

  // 模拟昼夜变化：6-18点有发电，中午最高
  if (hour >= 6 && hour <= 18) {
    // 中午12点达到峰值
    const peakTime = 12;
    const distanceFromPeak = Math.abs(hour - peakTime);
    const efficiency = 1 - (distanceFromPeak / 6); // 距离中午越远效率越低

    return Math.round(renewableBaseValues.solar * Math.max(0.2, efficiency));
  }

  return Math.round(renewableBaseValues.solar * 0.05); // 夜间少量发电（可能有储能）
}

// 模拟风能变化 - 相对稳定但有波动
function getWindOutput() {
  // 基于基础值的±15%波动
  const variation = (Math.random() * 0.3) - 0.15; // -15% 到 +15%
  return Math.round(renewableBaseValues.wind * (1 + variation));
}

// 模拟水电变化 - 相对稳定
function getHydroOutput() {
  // 水电相对稳定，只有±5%的波动
  const variation = (Math.random() * 0.1) - 0.05;
  return Math.round(renewableBaseValues.hydro * (1 + variation));
}

// 模拟生物质发电 - 非常稳定
function getBiomassOutput() {
  // 生物质发电非常稳定，只有±2%的波动
  const variation = (Math.random() * 0.04) - 0.02;
  return Math.round(renewableBaseValues.biomass * (1 + variation));
}

// 🔥 模拟新能源数据 - 缓慢的基础值变化
setInterval(() => {
  // 缓慢调整基础值（模拟季节变化或装机容量增加）
  if (Math.random() > 0.95) { // 5%的概率调整基础值
    renewableBaseValues.solar += (Math.random() > 0.5 ? 1 : -1) * 0.5;
    renewableBaseValues.wind += (Math.random() > 0.5 ? 1 : -1) * 0.3;

    // 确保不会出现负值
    renewableBaseValues.solar = Math.max(20, Math.min(installedCapacity.solar * 0.95, renewableBaseValues.solar));
    renewableBaseValues.wind = Math.max(30, Math.min(installedCapacity.wind * 0.95, renewableBaseValues.wind));
  }

  const renewableData = {
    solar: getSolarOutput(),
    wind: getWindOutput(),
    hydro: getHydroOutput(),
    biomass: getBiomassOutput(),
    capacity: installedCapacity // 同时发送装机容量数据
  };

  io.emit("renewable_update", renewableData);
  console.log("发送新能源数据:", renewableData);
}, 10000); // 改为10秒更新一次

// 处理告警相关事件
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  socket.on('request_alarm_history', () => {
    socket.emit('alarm_history', alarmHistory);
  });

  socket.on('handle_alarm', (alarmId) => {
    const alarm = alarmHistory.find(a => a.id === alarmId);
    if (alarm) {
      alarm.handled = true;
      io.emit('alarm_updated', alarm);
      console.log(`告警 ${alarmId} 已处理`);
    }
  });

  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

httpServer.listen(8081, () => {
  console.log('✅ Socket.io 服务已启动: http://localhost:8081');
  console.log('✅ CORS 已配置: 允许 http://localhost:5173');
});
