import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    socket: null,
    isConnected: false,
    connectionError: null,
  }),

  actions: {
    connect() {
      try {
        this.socket = io('http://localhost:8081', {
          transports: ['websocket'],
          withCredentials: true,
        });

        this.socket.on('connect', () => {
          this.isConnected = true
          this.connectionError = null
          console.log('✅ WebSocket connected')
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false
          this.connectionError = error.message
          console.error('❌ WebSocket connection error:', error.message)
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false
          console.log('WebSocket disconnected')
        });

        return this.socket
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error)
        this.connectionError = error.message
        throw error
      }
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
      }
    },

    emit(event, data) {
      if (this.socket && this.isConnected) {
        this.socket.emit(event, data)
      } else {
        console.warn('Cannot emit - WebSocket not connected')
      }
    },

    on(event, callback) {
      if (this.socket) {
        this.socket.on(event, callback)
      }
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