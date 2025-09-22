import { defineStore } from "pinia";
import { useWebSocketStore } from './websocket';

export const useAlarmStore = defineStore('alarm', {
  state: () => ({
    alarms: [],
    filter: 'all',
    unhandledCount: 0,
  }),

  actions: {
    init() {
      const wsStore = useWebSocketStore();

      // 请求历史告警
      wsStore.emit('request_alarm_history')

      // 监听新告警
      wsStore.on('alarm', this.addAlarm)

      // 监听历史告警
      wsStore.on('alarm_history', this.setAlarms)

      // 监听告警状态更新
      wsStore.on('alarm_updated', this.updateAlarm)
    },

    addAlarm(alarm) {
      this.alarms.unshift(alarm)
      this.updateUnhandledCount()
    },

    setAlarms(alarms) {
      this.alarms = alarms
      this.updateUnhandledCount()
    },

    updateAlarm(updatedAlarm) {
      const index = this.alarms.findIndex(a => a.id === updatedAlarm.id)
      if (index !== -1) {
        this.alarms[index] = updatedAlarm
        this.updateUnhandledCount()
      }
    },

    handleAlarm(alarmId) {
      const wsStore = useWebSocketStore()
      wsStore.emit('handle_alarm', alarmId)
    },

    updateUnhandledCount() {
      this.unhandledCount = this.alarms.filter(alarm => !alarm.handled).length
    },

    setFilter(newFilter) {
      this.filter = newFilter
    }
  },

  getters: {
    filteredAlarms: (state) => {
      if (state.filter === 'unhandled') {
        return state.alarms.filter(alarm => !alarm.handled)
      } else if (state.filter === 'handled') {
        return state.alarms.filter(alarm => alarm.handled)
      }
      // 默认显示所有，按时间倒序排列
      return [...state.alarms].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  }
})