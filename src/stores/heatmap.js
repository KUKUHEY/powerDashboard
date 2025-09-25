import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export const useHeatmapStore = defineStore('heatmap', {
  state: () => ({
    selectedYear: '2024', // 默认选中2024年
    chartData: [],
    loading: false,
    error: null,
    availableYears: ["2020", "2021", "2022", "2023", "2024"],
    // 基础数据用于模拟
    baseData: {
      "2020": 3000, "2021": 3200, "2022": 3500, "2023": 3800, "2024": 4000
    }
  }),

  actions: {
    init() {
      const wsStore = useWebSocketStore()

      // 监听年份数据
      wsStore.on('year_data', this.handleYearData)
      wsStore.on('year_data_error', this.handleYearDataError)
      wsStore.on('connect_error', this.handleConnectError)

      // 初始加载数据
      this.selectYear(this.selectedYear)
    },

    // 选择年份
    selectYear(year) {
      if (this.selectedYear === year) return

      this.selectedYear = year
      this.loading = true

      const wsStore = useWebSocketStore()

      // 检查socket是否已连接
      if (wsStore.isConnected) {
        wsStore.emit('request_year_data', year)
      } else {
        console.error("WebSocket未连接，使用模拟数据")
        this.loading = false
        // 使用模拟数据作为备选方案
        setTimeout(() => {
          this.generateMockData(year)
        }, 500)
      }
    },

    // 处理年份数据
    handleYearData(data) {
      if (data.year === this.selectedYear) {
        this.chartData = data.data
        this.loading = false
        this.error = null
      }
    },

    // 处理年份数据错误
    handleYearDataError(error) {
      console.error("数据加载错误:", error)
      this.loading = false
      this.error = error.message
      // 使用模拟数据作为备选
      this.generateMockData(this.selectedYear)
    },

    // 处理连接错误
    handleConnectError(error) {
      console.error("连接错误:", error.message)
      this.loading = false
      this.error = error.message
      // 使用模拟数据作为备选
      this.generateMockData(this.selectedYear)
    },

    // 生成模拟数据（备选方案）
    generateMockData(year) {
      const baseValue = this.baseData[year] || 3500

      const mockData = [
        { name: "北京市", value: Math.round(baseValue * 0.9 + Math.random() * 500) },
        { name: "天津市", value: Math.round(baseValue * 0.7 + Math.random() * 400) },
        { name: "河北省", value: Math.round(baseValue * 1.2 + Math.random() * 600) },
        { name: "山西省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
        { name: "内蒙古自治区", value: Math.round(baseValue * 0.8 + Math.random() * 400) },
        { name: "辽宁省", value: Math.round(baseValue * 1.3 + Math.random() * 600) },
        { name: "吉林省", value: Math.round(baseValue * 0.9 + Math.random() * 400) },
        { name: "黑龙江省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
        { name: "上海市", value: Math.round(baseValue * 1.4 + Math.random() * 700) },
        { name: "江苏省", value: Math.round(baseValue * 1.5 + Math.random() * 800) },
        { name: "浙江省", value: Math.round(baseValue * 1.4 + Math.random() * 700) },
        { name: "安徽省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
        { name: "福建省", value: Math.round(baseValue * 1.0 + Math.random() * 400) },
        { name: "江西省", value: Math.round(baseValue * 0.9 + Math.random() * 400) },
        { name: "山东省", value: Math.round(baseValue * 1.5 + Math.random() * 800) },
        { name: "河南省", value: Math.round(baseValue * 1.3 + Math.random() * 600) },
        { name: "湖北省", value: Math.round(baseValue * 1.2 + Math.random() * 500) },
        { name: "湖南省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
        { name: "广东省", value: Math.round(baseValue * 1.6 + Math.random() * 900) },
        { name: "广西壮族自治区", value: Math.round(baseValue * 0.9 + Math.random() * 400) },
        { name: "海南省", value: Math.round(baseValue * 0.6 + Math.random() * 300) },
        { name: "重庆市", value: Math.round(baseValue * 1.0 + Math.random() * 400) },
        { name: "四川省", value: Math.round(baseValue * 1.2 + Math.random() * 600) },
        { name: "贵州省", value: Math.round(baseValue * 0.8 + Math.random() * 400) },
        { name: "云南省", value: Math.round(baseValue * 0.9 + Math.random() * 400) },
        { name: "西藏自治区", value: Math.round(baseValue * 0.4 + Math.random() * 200) },
        { name: "陕西省", value: Math.round(baseValue * 1.0 + Math.random() * 500) },
        { name: "甘肃省", value: Math.round(baseValue * 0.7 + Math.random() * 300) },
        { name: "青海省", value: Math.round(baseValue * 0.5 + Math.random() * 200) },
        { name: "宁夏回族自治区", value: Math.round(baseValue * 0.6 + Math.random() * 300) },
        { name: "新疆维吾尔自治区", value: Math.round(baseValue * 0.7 + Math.random() * 300) },
        { name: "台湾省", value: Math.round(baseValue * 1.1 + Math.random() * 500) },
        { name: "香港特别行政区", value: Math.round(baseValue * 0.8 + Math.random() * 400) },
        { name: "澳门特别行政区", value: Math.round(baseValue * 0.3 + Math.random() * 100) }
      ]

      this.chartData = mockData
      this.error = null
    },

    // 设置加载状态
    setLoading(loading) {
      this.loading = loading
    },

    // 清空错误
    clearError() {
      this.error = null
    }
  },

  getters: {
    // 计算总负荷
    totalLoad: (state) => {
      return state.chartData.reduce((sum, item) => sum + item.value, 0)
    },

    // 格式化总负荷
    formattedTotalLoad: (state) => {
      const total = state.chartData.reduce((sum, item) => sum + item.value, 0)
      return total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    // 检查是否有数据
    hasData: (state) => {
      return state.chartData.length > 0
    },

    // 获取状态信息
    status: (state) => {
      if (state.error) return { type: 'error', message: state.error }
      if (state.loading) return { type: 'loading', message: '加载中...' }
      if (state.chartData.length === 0) return { type: 'empty', message: '暂无数据' }
      return { type: 'success', message: `已加载 ${state.chartData.length} 个省份数据` }
    }
  }
})