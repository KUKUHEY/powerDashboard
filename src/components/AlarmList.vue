<template>
  <div class="alarm-list-container">
    <div class="alarm-header">
      <h2>告警列表</h2>
      <div class="alarm-stats">
        <span class="total">总计: {{ alarms.length }}</span>
        <span class="unhandled">未处理: {{ unhandledCount }}</span>
      </div>
    </div>
    
    <div class="alarm-filters">
      <button 
        :class="{ active: filter === 'all' }" 
        @click="filter = 'all'"
      >
        全部
      </button>
      <button 
        :class="{ active: filter === 'unhandled' }" 
        @click="filter = 'unhandled'"
      >
        未处理
      </button>
      <button 
        :class="{ active: filter === 'handled' }" 
        @click="filter = 'handled'"
      >
        已处理
      </button>
    </div>
    
    <div class="alarm-items">
      <div class="alarm-item" 
           v-for="alarm in filteredAlarms" 
           :key="alarm.id"
           :class="{ 
             'level-high': alarm.level === 'high',
             'level-critical': alarm.level === 'critical',
             'handled': alarm.handled 
           }">
        <div class="alarm-level">
          <span v-if="alarm.level === 'critical'">紧急</span>
          <span v-if="alarm.level === 'high'">高</span>
        </div>
        <div class="alarm-content">
          <div class="alarm-message">{{ alarm.message }}</div>
          <div class="alarm-time">
            {{ formatTime(alarm.timestamp) }}
          </div>
        </div>
        <div class="alarm-actions">
          <button 
            v-if="!alarm.handled"
            @click="handleAlarm(alarm.id)"
          >
            标记为已处理
          </button>
          <span v-else class="handled-label">已处理</span>
        </div>
      </div>
      
      <div class="no-alarms" v-if="filteredAlarms.length === 0">
        暂无告警
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted,onUnmounted } from 'vue';
// import { io } from 'socket.io-client';
import { useAlarmStore } from '../stores/alarm';
import { useWebSocketStore } from '../stores/websocket';

const alarmStore = useAlarmStore();
const wsStore = useWebSocketStore();

// 计算属性
const alarms = computed(() => alarmStore.alarms);
const unhandledCount = computed(() => alarmStore.unhandledCount);
const filteredAlarms = computed(() => alarmStore.filteredAlarms);
const filter = computed({
  get: () => alarmStore.filter,
  set: (value) => alarmStore.setFilter(value)
})

// 方法
// 格式化时间显示
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const handleAlarm = (alarmId) => {
  alarmStore.handleAlarm(alarmId);
}

// const alarms = ref([]);
// const filter = ref('all');
// let socket = null;

// 计算未处理告警数量
// const unhandledCount = computed(() => {
//   return alarms.value.filter(alarm => !alarm.handled).length;
// });

// 根据筛选条件过滤告警
// const filteredAlarms = computed(() => {
//   if (filter.value === 'unhandled') {
//     return alarms.value.filter(alarm => !alarm.handled);
//   } else if (filter.value === 'handled') {
//     return alarms.value.filter(alarm => alarm.handled);
//   }
//   // 默认显示所有，按时间倒序排列
//   return [...alarms.value].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
// });



// 标记告警为已处理
// const handleAlarm = (alarmId) => {
//   socket.emit('handle_alarm', alarmId);
// };

// onMounted(() => {
//   // 连接到服务器
//   socket = io("http://localhost:8081", {
//     transports: ['websocket'],
//     withCredentials: true
//   });
  
//   // 监听连接事件
//   socket.on('connect', () => {
//     console.log('✅ 已连接到告警服务器');
//     // 请求历史告警
//     socket.emit('request_alarm_history');
//   });
  
//   // 监听新告警
//   socket.on('alarm', (alarm) => {
//     console.log('收到新告警:', alarm);
//     alarms.value.unshift(alarm); // 添加到数组开头
//   });
  
//   // 接收历史告警
//   socket.on('alarm_history', (history) => {
//     console.log('收到历史告警:', history);
//     alarms.value = history;
//   });
  
//   // 监听告警状态更新
//   socket.on('alarm_updated', (updatedAlarm) => {
//     const index = alarms.value.findIndex(a => a.id === updatedAlarm.id);
//     if (index !== -1) {
//       alarms.value[index] = updatedAlarm;
//     }
//   });
  
//   // 监听连接错误
//   socket.on('connect_error', (err) => {
//     console.error('❌ 告警服务器连接错误:', err);
//   });
// });

onMounted(() => {
  // 初始化 WebSocket 连接
  wsStore.connect()
  // 初始化告警监听
  alarmStore.init()
})

onUnmounted(() => {
  // 清理事件监听
  wsStore.off('alarm', alarmStore.addAlarm)
  wsStore.off('alarm_history', alarmStore.setAlarms)
  wsStore.off('alarm_updated', alarmStore.updateAlarm)
})
</script>

<style scoped>
.alarm-list-container {
  /* background: rgba(15, 23, 42, 0.8); */
  /* border-radius: 6px; */
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.alarm-header h2 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.alarm-stats {
  display: flex;
  gap: 15px;
  font-size: 14px;
}

.total {
  color: #fff;
}

.unhandled {
  color: #f87171;
  font-weight: bold;
}

.alarm-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.alarm-filters button {
  background: rgba(71, 85, 105, 0.4);
  border: none;
  color: #fff;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.alarm-filters button.active {
  background: rgb(41, 88, 163);
}

.alarm-filters button:hover:not(.active) {
  background: rgba(71, 85, 105, 0.6);
}

.alarm-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px;
}

.alarm-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  background: rgba(30, 41, 59, 0.5);
  border-left: 4px solid transparent;
  transition: transform 0.2s;
}

.alarm-item:hover {
  transform: translateX(3px);
}

.alarm-item.level-high {
  border-left-color: #fbbf24;
}

.alarm-item.level-critical {
  border-left-color: #ef4444;
  background: rgba(127, 29, 29, 0.2);
}

.alarm-item.handled {
  opacity: 0.7;
}

.alarm-level {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}

.alarm-level span {
  padding: 2px 8px;
  border-radius: 3px;
  display: inline-block;
}

.alarm-level span:nth-child(1) {
  background: #ef4444;
}

.alarm-level span:nth-child(2) {
  background: #fbbf24;
}

.alarm-content {
  flex: 1;
  margin: 0 15px;
}

.alarm-message {
  font-size: 15px;
  margin-bottom: 4px;
}

.alarm-time {
  font-size: 12px;
  color: #94a3b8;
}

.alarm-actions {
  min-width: 100px;
  text-align: right;
}

.alarm-actions button {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 4px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.alarm-actions button:hover {
  background: #2563eb;
}

.handled-label {
  font-size: 13px;
  color: #6ee7b7;
}

.no-alarms {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}

/* 滚动条样式优化 */
.alarm-items::-webkit-scrollbar {
  width: 6px;
}

.alarm-items::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

.alarm-items::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.alarm-items::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.8);
}
</style>
    