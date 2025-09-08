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
