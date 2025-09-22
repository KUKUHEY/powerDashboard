import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    online: 1453,
    rate: 96.9,
    prevOnline: 1453
  }),

  actions: {
    init() {
      const wsStore = useWebSocketStore()
      wsStore.on('device_status', this.updateStatus)
    },

    updateStatus(data) {
      this.prevOnline = this.online
      this.online = data.online
      this.rate = data.rate
    }
  },

  getters: {
    trendClass: (state) => {
      if (state.online > state.prevOnline) return 'trend-up'
      if (state.online < state.prevOnline) return 'trend-down'
      return 'trend-stable'
    },

    trendIcon: (state) => {
      if (state.online > state.prevOnline) return '↗'
      if (state.online < state.prevOnline) return '↘'
      return '→'
    }
  }
})