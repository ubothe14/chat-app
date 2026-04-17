import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

class SocketService {
  private socket: Socket | null = null
  private listenerQueue: Array<{ event: string, callback: (data: any) => void }> = []
  private emitQueue: Array<{ event: string, data: any }> = []

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      // Still re-join rooms just in case
      this.socket.emit('join', userId);
      return
    }

    const token = localStorage.getItem('authToken')
    console.log('📡 Attempting socket connection...', { userId, hasToken: !!token });

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token }
    })

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server. Socket ID:', this.socket?.id)
      this.socket?.emit('join', userId)
      
      // Apply queued listeners
      this.listenerQueue.forEach(({ event, callback }) => {
        console.log(`👂 Applying queued listener: ${event}`);
        this.socket?.on(event, callback)
      })
      this.listenerQueue = []

      // Apply queued emits
      this.emitQueue.forEach(({ event, data }) => {
        console.log(`📤 Sending queued emit: ${event}`);
        this.socket?.emit(event, data)
      })
      this.emitQueue = []
    })

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server. Reason:', reason)
    })
  }

  private emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.log(`📦 Queuing emit: ${event}`);
      this.emitQueue.push({ event, data })
    }
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
    this.emit('join-chat', conversationId)
  }

  leaveChat(conversationId: string) {
    this.emit('leave-chat', conversationId)
  }

  emitTyping(conversationId: string, userId: string, userName: string) {
    this.emit('typing', { conversationId, userId, userName })
  }

  emitStopTyping(conversationId: string, userId: string) {
    this.emit('stop-typing', { conversationId, userId })
  }

  emitSendMessage(message: any) {
    this.emit('send-message', message)
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

  onConversationUpdated(callback: (conversation: any) => void) {
    this.on('conversation-updated', callback)
  }

  offConversationUpdated(callback: (conversation: any) => void) {
    this.off('conversation-updated', callback)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.listenerQueue = []
  }
}

export const socketService = new SocketService()
