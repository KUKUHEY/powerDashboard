import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 在mock-server.js中添加历史数据
const YEARLY_POWER_DATA = {
  "2020": {
    "北京市": 3200, "天津市": 2500, "河北省": 3800, "山西省": 3400, "内蒙古自治区": 2800,
    "辽宁省": 4000, "吉林省": 2800, "黑龙江省": 3400, "上海市": 4300, "江苏省": 4700,
    "浙江省": 4400, "安徽省": 3700, "福建省": 3400, "江西省": 3100, "山东省": 4800,
    "河南省": 4200, "湖北省": 3800, "湖南省": 3600, "广东省": 5200, "广西壮族自治区": 3200,
    "海南省": 2200, "重庆市": 3400, "四川省": 4000, "贵州省": 2800, "云南省": 3100,
    "西藏自治区": 1500, "陕西省": 3500, "甘肃省": 2700, "青海省": 1900, "宁夏回族自治区": 2300,
    "新疆维吾尔自治区": 2600, "台湾省": 3800, "香港特别行政区": 2800, "澳门特别行政区": 1300
  },
  "2021": {
    "北京市": 3350, "天津市": 2650, "河北省": 3950, "山西省": 3550, "内蒙古自治区": 2950,
    "辽宁省": 4150, "吉林省": 2950, "黑龙江省": 3550, "上海市": 4450, "江苏省": 4850,
    "浙江省": 4550, "安徽省": 3850, "福建省": 3550, "江西省": 3250, "山东省": 4950,
    "河南省": 4350, "湖北省": 3950, "湖南省": 3750, "广东省": 5350, "广西壮族自治区": 3350,
    "海南省": 2350, "重庆市": 3550, "四川省": 4150, "贵州省": 2950, "云南省": 3250,
    "西藏自治区": 1600, "陕西省": 3650, "甘肃省": 2850, "青海省": 2000, "宁夏回族自治区": 2450,
    "新疆维吾尔自治区": 2750, "台湾省": 3950, "香港特别行政区": 2950, "澳门特别行政区": 1400
  },
  "2022": {
    "北京市": 3500, "天津市": 2800, "河北省": 4200, "山西省": 3800, "内蒙古自治区": 3200,
    "辽宁省": 4500, "吉林省": 3200, "黑龙江省": 3800, "上海市": 4800, "江苏省": 5200,
    "浙江省": 4900, "安徽省": 4100, "福建省": 3800, "江西省": 3500, "山东省": 5300,
    "河南省": 4700, "湖北省": 4200, "湖南省": 4000, "广东省": 5800, "广西壮族自治区": 3600,
    "海南省": 2500, "重庆市": 3800, "四川省": 4500, "贵州省": 3200, "云南省": 3500,
    "西藏自治区": 1800, "陕西省": 3900, "甘肃省": 3000, "青海省": 2200, "宁夏回族自治区": 2600,
    "新疆维吾尔自治区": 2900, "台湾省": 4200, "香港特别行政区": 3200, "澳门特别行政区": 1500
  },
  "2023": {
    "北京市": 3700, "天津市": 3000, "河北省": 4500, "山西省": 4050, "内蒙古自治区": 3450,
    "辽宁省": 4800, "吉林省": 3450, "黑龙江省": 4050, "上海市": 5100, "江苏省": 5500,
    "浙江省": 5200, "安徽省": 4350, "福建省": 4050, "江西省": 3750, "山东省": 5600,
    "河南省": 4950, "湖北省": 4450, "湖南省": 4250, "广东省": 6100, "广西壮族自治区": 3850,
    "海南省": 2700, "重庆市": 4050, "四川省": 4800, "贵州省": 3450, "云南省": 3750,
    "西藏自治区": 1950, "陕西省": 4150, "甘肃省": 3200, "青海省": 2350, "宁夏回族自治区": 2800,
    "新疆维吾尔自治区": 3100, "台湾省": 4450, "香港特别行政区": 3400, "澳门特别行政区": 1650
  },
  "2024": {
    "北京市": 3900, "天津市": 3200, "河北省": 4800, "山西省": 4300, "内蒙古自治区": 3700,
    "辽宁省": 5100, "吉林省": 3700, "黑龙江省": 4300, "上海市": 5400, "江苏省": 5800,
    "浙江省": 5500, "安徽省": 4600, "福建省": 4300, "江西省": 4000, "山东省": 5900,
    "河南省": 5200, "湖北省": 4700, "湖南省": 4500, "广东省": 6400, "广西壮族自治区": 4100,
    "海南省": 2900, "重庆市": 4300, "四川省": 5100, "贵州省": 3700, "云南省": 4000,
    "西藏自治区": 2100, "陕西省": 4400, "甘肃省": 3400, "青海省": 2500, "宁夏回族自治区": 3000,
    "新疆维吾尔自治区": 3300, "台湾省": 4700, "香港特别行政区": 3600, "澳门特别行政区": 1800
  }
};

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

// 在mock-server.js的setInterval后面添加
const DEVICE_COUNT = 1500;
let onlineDevices = Math.floor(DEVICE_COUNT * 0.97);

// 模拟设备状态变化
setInterval(() => {
  // 随机设备上下线
  const changeCount = Math.floor(Math.random() * 15);
  const shouldGoOnline = Math.random() > 0.4;

  if (shouldGoOnline) {
    onlineDevices = Math.min(DEVICE_COUNT, onlineDevices + changeCount);
  } else {
    onlineDevices = Math.max(0, onlineDevices - changeCount);
  }

  // 发送设备状态数据
  const deviceData = {
    online: onlineDevices,
    rate: (onlineDevices / DEVICE_COUNT * 100).toFixed(1)
  };

  io.emit('device_status', deviceData);
}, 10000); // 10秒更新一次


// 处理告警相关事件
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  // 处理年份数据请求
  socket.on('request_year_data', (year) => {
    if (YEARLY_POWER_DATA[year]) {
      const regionData = Object.entries(YEARLY_POWER_DATA[year]).map(([name, value]) => ({
        name,
        value: value + Math.round(Math.random() * 200 - 100) // 添加小幅随机波动
      }));

      socket.emit('year_data', { year, data: regionData });
      console.log(`发送 ${year} 年数据`);
    } else {
      socket.emit('year_data_error', { year, message: '该年份数据不存在' });
      console.log(`请求的年份数据不存在: ${year}`);
    }
  });

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
