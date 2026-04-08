import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

class SocketService {
  private socket: Socket | null = null
  private listenerQueue: Array<{ event: string, callback: (data: any) => void }> = []

  connect(userId: string) {
    if (this.socket) return

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('🔌 Connected to socket server')
      this.socket?.emit('join', userId)
      
      // Apply queued listeners
      this.listenerQueue.forEach(({ event, callback }) => {
        this.socket?.on(event, callback)
      })
      this.listenerQueue = []
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server')
    })
  }

  private on(event: string, callback: (data: any) => void) {
    if (this.socket?.connected) {
      this.socket.on(event, callback)
    } else {
      this.listenerQueue.push({ event, callback })
    }
  }

  private off(event: string, callback: (data: any) => void) {
    this.socket?.off(event, callback)
    this.listenerQueue = this.listenerQueue.filter(l => l.event !== event || l.callback !== callback)
  }

  joinChat(conversationId: string) {
    this.socket?.emit('join-chat', conversationId)
  }

  leaveChat(conversationId: string) {
    this.socket?.emit('leave-chat', conversationId)
  }

  emitTyping(conversationId: string, userId: string, userName: string) {
    this.socket?.emit('typing', { conversationId, userId, userName })
  }

  emitStopTyping(conversationId: string, userId: string) {
    this.socket?.emit('stop-typing', { conversationId, userId })
  }

  emitSendMessage(message: any) {
    this.socket?.emit('send-message', message)
  }

  onNewMessage(callback: (message: any) => void) {
    this.on('new-message', callback)
  }

  offNewMessage(callback: (message: any) => void) {
    this.off('new-message', callback)
  }

  onTyping(callback: (data: any) => void) {
    this.on('typing', callback)
  }

  offTyping(callback: (data: any) => void) {
    this.off('typing', callback)
  }

  onStopTyping(callback: (data: any) => void) {
    this.on('stop-typing', callback)
  }

  offStopTyping(callback: (data: any) => void) {
    this.off('stop-typing', callback)
  }

  onUserStatus(callback: (data: { userId: string, status: 'online' | 'offline' }) => void) {
    this.on('user-status', callback)
  }

  offUserStatus(callback: (data: { userId: string, status: 'online' | 'offline' }) => void) {
    this.off('user-status', callback)
  }

  // Video Call Signaling
  emitStartCall(data: { conversationId: string, userId: string, userName: string, userAvatar?: string, participants: string[] }) {
    this.socket?.emit('start-call', data)
  }

  emitAcceptCall(conversationId: string, userId: string, participants: string[]) {
    this.socket?.emit('accept-call', { conversationId, userId, participants })
  }

  emitRejectCall(conversationId: string, userId: string, participants: string[]) {
    this.socket?.emit('reject-call', { conversationId, userId, participants })
  }

  onIncomingCall(callback: (data: any) => void) {
    this.on('incoming-call', callback)
  }

  onCallAccepted(callback: (data: any) => void) {
    this.on('call-accepted', callback)
  }

  onCallRejected(callback: (data: any) => void) {
    this.on('call-rejected', callback)
  }

  offIncomingCall(callback: (data: any) => void) {
    this.off('incoming-call', callback)
  }

  offCallAccepted(callback: (data: any) => void) {
    this.off('call-accepted', callback)
  }

  offCallRejected(callback: (data: any) => void) {
    this.off('call-rejected', callback)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.listenerQueue = []
  }
}

export const socketService = new SocketService()
