// src/stores/power.js
import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export const usePowerStore = defineStore('power', {
  state: () => ({
    timeData: [],
    loadData: [],
    maxDataPoints: 30, // 最大数据点数
    isLoading: false,
    error: null
  }),

  actions: {
    // 初始化数据监听
    init() {
      const wsStore = useWebSocketStore()

      // 监听实时数据更新
      wsStore.on('update', this.addDataPoint)

      // 监听连接状态变化
      wsStore.on('connect', this.handleConnect)
      wsStore.on('connect_error', this.handleConnectError)
      wsStore.on('disconnect', this.handleDisconnect)
    },

    // 添加数据点
    addDataPoint(data) {
      try {
        this.timeData.push(data.timestamp)
        this.loadData.push(data.load)

        // 保持数据点数量不超过最大值
        if (this.timeData.length > this.maxDataPoints) {
          this.timeData.shift()
          this.loadData.shift()
        }

        this.error = null
      } catch (error) {
        console.error('Error adding data point:', error)
        this.error = error.message
      }
    },

    // 处理连接成功
    handleConnect() {
      this.isLoading = false
      this.error = null
    },

    // 处理连接错误
    handleConnectError(error) {
      this.isLoading = false
      this.error = `连接错误: ${error.message}`
    },

    // 处理断开连接
    handleDisconnect() {
      this.isLoading = false
      this.error = '连接已断开'
    },

    // 设置最大数据点数
    setMaxDataPoints(maxPoints) {
      this.maxDataPoints = maxPoints

      // 如果当前数据量超过新设置的最大值，截断数据
      if (this.timeData.length > maxPoints) {
        this.timeData = this.timeData.slice(-maxPoints)
        this.loadData = this.loadData.slice(-maxPoints)
      }
    },

    // 清空数据
    clearData() {
      this.timeData = []
      this.loadData = []
    },

    // 获取最新数据点
    getLatestDataPoint() {
      if (this.loadData.length === 0) return null

      return {
        timestamp: this.timeData[this.timeData.length - 1],
        load: this.loadData[this.loadData.length - 1]
      }
    },

    // 获取数据统计信息
    getStatistics() {
      if (this.loadData.length === 0) return null

      const sum = this.loadData.reduce((a, b) => a + b, 0)
      const avg = sum / this.loadData.length
      const min = Math.min(...this.loadData)
      const max = Math.max(...this.loadData)

      return {
        count: this.loadData.length,
        average: parseFloat(avg.toFixed(2)),
        minimum: min,
        maximum: max,
        range: max - min
      }
    }
  },

  getters: {
    // 获取格式化后的数据（用于图表）
    chartData: (state) => {
      return {
        timeData: state.timeData,
        loadData: state.loadData
      }
    },

    // 检查是否有数据
    hasData: (state) => {
      return state.loadData.length > 0
    },

    // 获取数据点数量
    dataCount: (state) => {
      return state.loadData.length
    },

    // 获取连接状态信息
    status: (state) => {
      if (state.error) return { type: 'error', message: state.error }
      if (state.isLoading) return { type: 'loading', message: '加载中...' }
      if (state.loadData.length === 0) return { type: 'empty', message: '暂无数据' }
      return { type: 'success', message: `已加载 ${state.loadData.length} 个数据点` }
    }
  }
})