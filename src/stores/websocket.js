import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    socket: null,
    isConnected: false,
    connectionError: null,
    pendingEmits: [] // 存储连接建立前需要发送的消息
  }),

  actions: {
    connect() {
      try {
        // 如果已经连接，直接返回
        if (this.isConnected && this.socket) {
          return this.socket;
        }
        // 如果正在连接中，也直接返回
        if (this.socket && !this.isConnected) {
          return this.socket;
        }

        console.log('正在建立 WebSocket 连接...');

        this.socket = io('http://localhost:8081', {
          transports: ['websocket'],
          withCredentials: true,
          timeout: 10000
        });

        this.socket.on('connect', () => {
          this.isConnected = true
          this.connectionError = null
          console.log('✅ WebSocket connected')

          // 发送所有等待中的消息
          this.flushPendingEmits()
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false
          this.connectionError = error.message
          console.error('❌ WebSocket connection error:', error.message)

          // 5秒后尝试重连
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('尝试重新连接...')
              this.connect()
            }
          }, 5000)
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false
          console.log('WebSocket disconnected:', reason)

          // 如果是非主动断开，尝试重连
          if (reason !== 'io client disconnect') {
            setTimeout(() => {
              if (!this.isConnected) {
                console.log('尝试重新连接...')
                this.connect()
              }
            }, 3000)
          }
        });

        return this.socket
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error)
        this.connectionError = error.message

        // 5秒后尝试重连
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('尝试重新连接...')
            this.connect()
          }
        }, 5000)

        throw error
      }
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
        this.pendingEmits = []
      }
    },

    emit(event, data) {
      if (this.socket && this.isConnected) {
        this.socket.emit(event, data)
      } else {
        console.warn(`WebSocket 未连接，消息已加入队列: ${event}`)
        // 将消息加入等待队列
        this.pendingEmits.push({ event, data })

        // 如果没有连接，尝试建立连接
        if (!this.socket) {
          this.connect()
        }
      }
    },

    // 发送所有等待中的消息
    flushPendingEmits() {
      while (this.pendingEmits.length > 0) {
        const { event, data } = this.pendingEmits.shift()
        if (this.socket && this.isConnected) {
          this.socket.emit(event, data)
          console.log(`发送等待中的消息: ${event}`)
        }
      }
    },

    on(event, callback) {
      if (this.socket) {
        this.socket.on(event, callback)
        return () => this.socket.off(event, callback)
      }
      return () => { }
    },

    off(event, callback) {
      if (this.socket) {
        this.socket.off(event, callback)
      }
    }
  },

  getters: {
    connectionStatus: (state) => {
      if (state.isConnected) return 'connected'
      if (state.connectionError) return 'error'
      return 'disconnected'
    }
  }
})