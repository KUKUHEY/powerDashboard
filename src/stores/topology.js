import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export const useTopologyStore = defineStore('topology', {
  state: () => ({
    topologyData: {
      nodes: [],
      links: []
    },
    activeFilter: 'all',
    hoverNode: null,
    isLoading: false,
    error: null,
    // 固定位置数据
    fixedPositions: {
      // 发电厂节点 - 布置在左侧
      'plant-1': { x: 100, y: 80 },
      'plant-2': { x: 100, y: 160 },
      'plant-3': { x: 100, y: 240 },
      'plant-4': { x: 100, y: 320 },

      // 变电站节点 - 布置在中间
      'sub-1': { x: 300, y: 100 },
      'sub-2': { x: 300, y: 200 },
      'sub-3': { x: 300, y: 300 },
      'sub-4': { x: 400, y: 150 },
      'sub-5': { x: 400, y: 250 },

      // 负荷中心节点 - 布置在右侧
      'load-1': { x: 600, y: 80 },
      'load-2': { x: 600, y: 160 },
      'load-3': { x: 600, y: 240 },
      'load-4': { x: 600, y: 320 }
    }
  }),

  actions: {
    init() {
      const wsStore = useWebSocketStore()

      // 监听拓扑数据
      wsStore.on("topology_data", this.setTopologyData)
      wsStore.on("topology_update", this.setTopologyData)

      // 监听连接状态
      wsStore.on("connect_error", this.handleConnectError)

      // 请求拓扑数据
      wsStore.emit('request_topology_data')
    },

    setTopologyData(data) {
      this.topologyData = data
      this.isLoading = false
      this.error = null
    },

    handleConnectError(error) {
      this.isLoading = false
      this.error = `连接错误: ${error.message}`
    },

    setActiveFilter(filter) {
      this.activeFilter = filter
    },

    setHoverNode(node) {
      this.hoverNode = node
    },

    clearHoverNode() {
      this.hoverNode = null
    },

    // 获取节点固定位置
    getNodePosition(nodeId) {
      return this.fixedPositions[nodeId] || { x: Math.random() * 500, y: Math.random() * 300 }
    }
  },

  getters: {
    // 计算统计信息
    stats: (state) => {
      const nodes = state.topologyData.nodes
      return {
        normal: nodes.filter(n => n.status === 'normal').length,
        warning: nodes.filter(n => n.status === 'warning').length,
        error: nodes.filter(n => n.status === 'error').length
      }
    },

    // 筛选后的数据
    filteredData: (state) => {
      if (state.activeFilter === 'all') return state.topologyData

      const filteredNodes = state.topologyData.nodes.filter(node =>
        node.status === state.activeFilter
      )

      const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
      const filteredLinks = state.topologyData.links.filter(link =>
        filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
      )

      return { nodes: filteredNodes, links: filteredLinks }
    },

    // 获取节点类型名称
    getNodeType: () => (node) => {
      const typeMap = {
        'thermal': '火电', 'hydro': '水电', 'wind': '风电', 'solar': '光伏',
        'substation-500': '变电', 'substation-220': '变电', 'substation-110': '变电',
        'load-center': '负荷'
      }
      return typeMap[node.category] || '节点'
    },

    // 格式化状态显示
    formatStatus: () => (status) => {
      const statusMap = { normal: '正常', warning: '预警', error: '故障' }
      return statusMap[status] || status
    },

    // 获取节点颜色
    getNodeColor: () => (node) => {
      const colorMap = {
        'thermal': '#ff6b6b', 'hydro': '#4ecdc4', 'wind': '#74c0fc', 'solar': '#ffd43b',
        'substation-500': '#4ecdc4', 'substation-220': '#45b7d1', 'substation-110': '#f9c74f',
        'load-center': '#22c55e'
      }
      return colorMap[node.category] || '#999'
    },

    // 获取节点符号
    getNodeSymbol: () => (node) => {
      const symbolMap = {
        'thermal': 'circle', 'hydro': 'circle', 'wind': 'circle', 'solar': 'circle',
        'substation-500': 'rect', 'substation-220': 'rect', 'substation-110': 'rect',
        'load-center': 'triangle'
      }
      return symbolMap[node.category] || 'circle'
    },

    // 获取连接线颜色
    getLinkColor: () => (link) => {
      const colorMap = {
        'normal': 'rgba(255, 255, 255, 0.4)',
        'warning': '#eab308',
        'error': '#ef4444'
      }
      return colorMap[link.status] || '#fff'
    },

    // 获取连接线宽度
    getLinkWidth: () => (link) => {
      return 0.8 + (link.value / 100) * 1.5
    },

    // 获取紧凑型节点尺寸
    getCompactSymbolSize: () => (node) => {
      const baseSizes = {
        'thermal': 20, 'hydro': 18, 'wind': 16, 'solar': 16,
        'substation-500': 18, 'substation-220': 16, 'substation-110': 14,
        'load-center': 16
      }
      return baseSizes[node.category] || 15
    }
  }
})