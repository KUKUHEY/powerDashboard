import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export const useRenewableStore = defineStore('renewable', {
  state: () => ({
    energyData: {
      solar: 125.8,
      wind: 283.5,
      hydro: 156.2,
      biomass: 45.3
    },
    // 装机容量 (MW)
    capacities: {
      solar: 200,
      wind: 350,
      hydro: 180,
      biomass: 60
    },
    // 趋势状态
    trends: {
      solar: 'stable',
      wind: 'stable',
      hydro: 'stable',
      biomass: 'stable'
    },
    // 今日累计发电量 (MWh)
    dailyGeneration: 0,
    // CO₂减排量 (吨)
    co2Reduction: 0,
    // 上一次的数据用于计算趋势
    prevEnergyData: {}
  }),

  actions: {
    init() {
      const wsStore = useWebSocketStore()
      wsStore.on("renewable_update", this.updateEnergyData)

      // 初始化上一次数据
      this.prevEnergyData = { ...this.energyData }
    },

    updateEnergyData(data) {
      // 更新趋势
      this.updateTrends(data)

      // 更新当前数据
      this.energyData = {
        solar: data.solar,
        wind: data.wind,
        hydro: data.hydro,
        biomass: data.biomass
      }

      if (data.capacity) {
        this.capacities = data.capacity
      }

      // 更新累计数据
      this.updateAccumulatedData()
    },

    updateTrends(newData) {
      Object.keys(newData).forEach(key => {
        if (key in this.energyData) {
          const change = newData[key] - this.energyData[key]
          if (change > 0.5) {
            this.trends[key] = 'up'
          } else if (change < -0.5) {
            this.trends[key] = 'down'
          } else {
            this.trends[key] = 'stable'
          }
        }
      })
      this.prevEnergyData = { ...this.energyData }
    },

    updateAccumulatedData() {
      // 每10秒更新一次，将功率转换为电量 (MW -> MWh/10s)
      const hoursIn10Seconds = 10 / 3600
      const totalOutput = this.totalOutput
      const energyGenerated = totalOutput * hoursIn10Seconds

      this.dailyGeneration = parseFloat((this.dailyGeneration + energyGenerated).toFixed(1))

      // 计算CO₂减排量 (假设每MWh减排0.8吨CO₂)
      const co2ReductionPerMWh = 0.8
      this.co2Reduction = parseFloat((this.dailyGeneration * co2ReductionPerMWh).toFixed(1))
    },

    getTrend(type) {
      const keyMap = {
        '太阳能': 'solar',
        '风能': 'wind',
        '水电': 'hydro',
        '生物质': 'biomass'
      }
      return this.trends[keyMap[type]] || 'stable'
    },

    getTrendArrow(type) {
      const trend = this.getTrend(type)
      switch (trend) {
        case 'up': return '↑'
        case 'down': return '↓'
        default: return '→'
      }
    }
  },

  getters: {
    energyTypes: (state) => [
      {
        name: '太阳能',
        value: state.energyData.solar,
        capacity: state.capacities.solar,
        color: '#FFD700'
      },
      {
        name: '风能',
        value: state.energyData.wind,
        capacity: state.capacities.wind,
        color: '#87CEEB'
      },
      {
        name: '水电',
        value: state.energyData.hydro,
        capacity: state.capacities.hydro,
        color: '#4169E1'
      },
      {
        name: '生物质',
        value: state.energyData.biomass,
        capacity: state.capacities.biomass,
        color: '#32CD32'
      }
    ],

    totalCapacity: (state) => {
      return Object.values(state.capacities).reduce((sum, cap) => sum + cap, 0)
    },

    totalOutput: (state) => {
      return Object.values(state.energyData).reduce((sum, output) => sum + output, 0)
    },

    renewablePercentage: (state) => {
      return Math.round((state.totalOutput / state.totalCapacity) * 100)
    },

    formattedDailyGeneration: (state) => {
      return state.dailyGeneration.toFixed(1)
    },

    formattedCo2Reduction: (state) => {
      return state.co2Reduction.toFixed(1)
    }
  }
})