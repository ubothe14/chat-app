import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { chatAPI, videoAPI, getFullImageUrl, type Conversation, type Message, type User } from '../services/api_service'
import { socketService } from '../services/socket_service'
import { 
  StreamCall, 
  SpeakerLayout, 
  CallControls,
  StreamTheme
} from '@stream-io/video-react-sdk'
import { Smile, Plus } from 'lucide-react'

interface ChatWindowProps {
  selectedConversation: Conversation | null
  currentUserId: string | null
  currentUser?: any | null
  onBack?: () => void
  isMobile?: boolean
  videoClient?: any
  onStartCall: (data: { conversationId: string, userName: string, userAvatar?: string, participants: string[] }) => void
  activeCall?: any
  setActiveCall?: (call: any) => void
}

function formatMessageTime(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

function formatDateSeparator(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function shouldShowDateSeparator(messages: Message[], index: number): string | null {
  if (index === 0) return formatDateSeparator(messages[0].createdAt)
  const prev = new Date(messages[index - 1].createdAt)
  const curr = new Date(messages[index].createdAt)
  if (prev.toDateString() !== curr.toDateString()) {
    return formatDateSeparator(messages[index].createdAt)
  }
  return null
}

function MessageAvatar({ user }: { user?: User | string }) {
  if (!user || typeof user === 'string') {
    return (
      <div className="w-[32px] h-[32px] rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-500 flex-shrink-0 mt-1 shadow-sm">
        ?
      </div>
    )
  }
  
  const avatarUrl = user.avatar ? getFullImageUrl(user.avatar) : null
  
  return (
    <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-sm border border-white/50">
      {avatarUrl ? (
        <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-wa-primary">
          {user.name?.charAt(0) || 'U'}
        </div>
      )}
    </div>
  )
}

function ChatHeaderAvatar({ isGroup, status, avatar }: { isGroup: boolean; status?: string; avatar?: string }) {
  const isVerified = status === 'verified' || status === 'pending'
  const isUnverified = status === 'unverified'
  
  return (
    <div className="relative w-[40px] h-[40px] flex-shrink-0">
      <div className="w-full h-full rounded-full overflow-hidden bg-wa-bg-input">
        {avatar ? (
          <img src={getFullImageUrl(avatar) || undefined} className="w-full h-full object-cover" alt="" />
        ) : (
          <svg viewBox="0 0 212 212" width="40" height="40">
            <path fill="#6b7b8d" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
            {isGroup ? (
              <>
                <path fill="#cfd4d6" d="M88.274 148.462c-.18-3.478-.737-6.937-1.652-10.307 4.14-.893 8.417-1.372 12.795-1.372 4.443 0 8.782.493 12.975 1.412-.92 3.38-1.48 6.85-1.66 10.34a45.85 45.85 0 0 1-11.315 1.427 45.8 45.8 0 0 1-11.143-1.5z" />
                <path fill="#cfd4d6" d="M99.417 125.317c-2.108 0-4.155-.2-6.127-.588C81.6 122.512 73.2 113.91 73.2 103.35c0-11.726 9.5-21.235 21.217-21.235 11.717 0 21.217 9.51 21.217 21.235 0 10.56-8.4 19.162-20.09 21.379a30.3 30.3 0 0 1-6.127.588z" />
                <path fill="#cfd4d6" d="M149.543 161.064a58.275 58.275 0 0 0-5.013-5.157C134.16 146.28 120.867 141 106.39 141h-1.363c-12.398.143-23.753 4.263-32.803 11.212l.003.003a58.186 58.186 0 0 0-5.01 5.153 104.13 104.13 0 0 0 39.092 7.588 104.244 104.244 0 0 0 43.234-3.892z" />
              </>
            ) : (
              <>
                <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-22.632-22.851c-9.653-5.901-20.347-9.018-31.342-9.135-11.108.117-21.854 3.241-31.545 9.148a62.81 62.81 0 0 0-22.634 22.853 89.488 89.488 0 0 0 54.164 18.257 89.488 89.488 0 0 0 53.989-18.272z" />
                <path fill="#cfd4d6" d="M106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 30.513-38.089C144.028 65.326 126.914 48 106.002 48S67.975 65.326 67.975 86.674a38.272 38.272 0 0 0 30.513 38.089A39.66 39.66 0 0 0 106.002 125.5z" />
              </>
            )}
          </svg>
        )}
      </div>
      {(isVerified || isUnverified) && (
        <span style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isVerified ? '#16a34a' : '#f59e0b',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          zIndex: 1,
        }}>
          {isVerified ? '✓' : '!'}
        </span>
      )}
    </div>
  )
}

export default function ChatWindow({ 
  selectedConversation, 
  currentUserId, 
  currentUser, 
  onBack, 
  isMobile,
  videoClient,
  onStartCall,
  activeCall,
  setActiveCall
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingStatus, setTypingStatus] = useState<{ userId: string; userName: string } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const chatMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const prevConvId = useRef<string | null>(null)
  const typingTimeoutRef = useRef<any>(null)

  const getSenderId = (sender: User | string | undefined): string => {
    if (!sender) return ''
    return typeof sender === 'string' ? sender : (sender._id || sender.id || '')
  }

  const getSenderName = (sender: User | string | undefined): string => {
    if (!sender) return 'Unknown'
    return typeof sender === 'string' ? 'User' : (sender.name || 'User')
  }

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current) {
      if (force) {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'auto' });
      } else {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }

  function getConversationName(): string {
    if (!selectedConversation) return ''
    if (selectedConversation.isGroup && selectedConversation.groupName) return selectedConversation.groupName
    const other = selectedConversation.participants.find((p: User) => p._id !== currentUserId)
    return other?.name || 'Unknown'
  }



  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([])
      return
    }

    const isNewConv = prevConvId.current !== selectedConversation._id
    prevConvId.current = selectedConversation._id

    // Join room
    socketService.joinChat(selectedConversation._id)

    const fetchMessages = async () => {
      if (isNewConv) setLoadingMessages(true)
      try {
        const response = await chatAPI.getMessages(selectedConversation!._id)
        const msgs = (response.messages || []).filter((m: Message) => !m.updatedAt || m.type !== 'image')
        setMessages(msgs)
        if (isNewConv) {
          setTimeout(() => scrollToBottom(true), 100)
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()

    const handleIncomingMessage = (msg: any) => {
      if (msg.conversationId === selectedConversation._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => scrollToBottom(), 50)
      }
    }

    const handleTypingEvent = (data: any) => {
      if (data.conversationId === selectedConversation._id && data.userId !== currentUserId) {
        setTypingStatus({ userId: data.userId, userName: data.userName })
      }
    }

    const handleStopTypingEvent = (data: any) => {
      if (data.conversationId === selectedConversation._id) {
        setTypingStatus(null)
      }
    }

    // Listen for real-time messages
    socketService.onNewMessage(handleIncomingMessage)
    socketService.onTyping(handleTypingEvent)
    socketService.onStopTyping(handleStopTypingEvent)

    chatAPI.markAsRead(selectedConversation._id).catch(() => {})

    return () => {
      socketService.offNewMessage(handleIncomingMessage)
      socketService.offTyping(handleTypingEvent)
      socketService.offStopTyping(handleStopTypingEvent)
      socketService.leaveChat(selectedConversation._id)
    }
  }, [selectedConversation?._id, refetchTrigger, videoClient, currentUserId])

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatAPI.reactToMessage(messageId, emoji)
      setReactionMenuId(null)
      setRefetchTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Failed to react:', err)
    }
  }

  const handleToggleSelect = (messageId: string) => {
    if (!isSelectionMode) setIsSelectionMode(true)
    setSelectedIds(prev => 
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    )
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} messages?`)) return
    
    try {
      await chatAPI.deleteMessagesBulk(selectedIds)
      setSelectedIds([])
      setIsSelectionMode(false)
      setRefetchTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Failed to delete bulk:', err)
    }
  }

  // Scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  // Close menus on outside click and Escape key
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (attachRef.current && !attachRef.current.contains(target)) setShowAttachMenu(false)
      if (chatMenuRef.current && !chatMenuRef.current.contains(target)) setShowChatMenu(false)
      
      // Close reaction menu if clicking outside of it and not on a trigger button
      if (reactionMenuId && !target.closest('.reaction-picker-panel') && !target.closest('.reaction-btn-trigger')) {
        setReactionMenuId(null)
      }
    }

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAttachMenu(false)
        setShowChatMenu(false)
        setReactionMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [reactionMenuId])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation?._id || sendingMessage) return

    const text = messageInput.trim()
    setMessageInput('')
    setSendingMessage(true)

    try {
      const response = await chatAPI.sendMessage(selectedConversation._id, text)
      // Add the sent message to local state immediately
      if (response.message) {
        setMessages(prev => [...prev, response.message])
        socketService.emitSendMessage({ ...response.message, conversationId: selectedConversation._id })
      }
      setTimeout(() => scrollToBottom(), 50)
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessageInput(text) // Restore input on failure
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
      // Stop typing on send
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      socketService.emitStopTyping(selectedConversation?._id || '', currentUserId || '')
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)

    if (!selectedConversation?._id || !currentUserId) return

    // Emit typing
    socketService.emitTyping(selectedConversation._id, currentUserId, currentUser?.name || 'Someone')

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitStopTyping(selectedConversation._id, currentUserId)
    }, 2000)
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, send file name as a text message (full file upload would need multipart)
      const emoji = type === 'image' ? '📷' : '📄'
      setMessageInput(`${emoji} ${file.name}`)
      setShowAttachMenu(false)
    }
    e.target.value = ''
  }

  const openDocumentInput = () => fileInputRef.current?.click()
  const openImageInput = () => imageInputRef.current?.click()
  type AttachOptionType = 'document' | 'image' | 'camera' | 'contact' | 'poll'
  const handleAttachOptionClick = (type: AttachOptionType) => {
    switch (type) {
      case 'document': openDocumentInput(); break
      case 'image': openImageInput(); break
      case 'camera': console.log('Camera — requires device camera access'); break
      case 'contact': console.log('Contact sharing — Coming soon!'); break
      case 'poll': console.log('Poll creation — Coming soon!'); break
    }
  }

  const initiateVideoCall = async () => {
    if (!videoClient || !selectedConversation?._id) {
      console.warn('❌ Video Error: Client not ready');
      return
    }

    try {
      console.log('Syncing participants...');
      const participants = selectedConversation.participants.map(p => p._id || p.id || '');
      await videoAPI.syncUsers(participants);

      console.log('Preparing call...');
      const call = videoClient.call('default', selectedConversation._id)
      await call.getOrCreate({
        data: {
          members: participants.map(id => ({ user_id: id })),
          custom: { conversationName: getConversationName() }
        }
      })

      // Show our "Calling..." overlay
      const otherUser = selectedConversation.participants.find(p => p._id !== currentUserId)
      onStartCall({
        conversationId: selectedConversation._id,
        userName: otherUser?.name || 'User',
        userAvatar: otherUser?.avatar ? (getFullImageUrl(otherUser.avatar) ?? undefined) : undefined,
        participants: selectedConversation.participants.map(p => p._id || p.id || '')
      })
      
      // We join immediately but hide behind overlay until accepted? 
      // Actually, better to join only when accepted or just join and let the overlay cover it.
      // Let's join and let the overlay manage the view.
      await call.join()
      setActiveCall(call)

    } catch (err: any) {
      console.error('❌ Call initiation failed:', err)
    }
  }



  const attachOptions = [
    {
      label: 'Document', color: '#7f66ff',
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.5 9H15v2.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V12H9.5c-.83 0-1.5-.67-1.5-1.5S8.67 9 9.5 9H12V6.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V9h2.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>,
      type: 'document',
    },
    {
      label: 'Photos & Videos', color: '#007bfc',
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>,
      type: 'image',
    },
    {
      label: 'Camera', color: '#ff2e74',
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><circle cx="12" cy="12" r="3.2" /><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" /></svg>,
      type: 'camera',
    },
    {
      label: 'Contact', color: '#009688',
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
      type: 'contact',
    },
    {
      label: 'Poll', color: '#ffab00',
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>,
      type: 'poll',
    },
  ]

  const chatMenuItems = [
    {
      label: 'Contact info',
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
      action: () => console.log('Contact info panel'),
    },
    {
      label: 'Select messages',
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>,
      action: () => console.log('Select messages mode'),
    },
    { divider: true },
    {
      label: 'Clear chat',
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>,
      action: () => { setMessages([]); setShowChatMenu(false) },
    },
  ]

  // Empty state
  if (!selectedConversation) {
    return (
      <div className="flex-1 bg-transparent flex flex-col items-center justify-center relative">
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-[#0f74ff]" />
        <div className="text-center max-w-[500px] px-6">
          <div className="mb-[28px] flex justify-center">
            <div className="w-[260px] h-[260px] relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#c7d2e0] opacity-20" />
              <svg viewBox="0 0 83 83" width="100" height="100" fill="none">
                <path d="M58.942 26.283H24.058A3.058 3.058 0 0 0 21 29.342v26.316A3.058 3.058 0 0 0 24.058 58.7h6.647l3.529 4.854a1 1 0 0 0 1.616 0l3.53-4.854h6.646l3.53 4.854a1 1 0 0 0 1.615 0l3.53-4.854h2.24A3.058 3.058 0 0 0 62 55.658V29.342a3.058 3.058 0 0 0-3.058-3.059z" fill="#364147" />
                <rect x="28" y="35" width="27" height="3" rx="1.5" fill="#64748b" opacity=".4" />
                <rect x="28" y="41" width="20" height="3" rx="1.5" fill="#64748b" opacity=".4" />
                <rect x="28" y="47" width="24" height="3" rx="1.5" fill="#64748b" opacity=".4" />
              </svg>
            </div>
          </div>
          <h1 className="text-[32px] font-light text-[#0f172a] tracking-[-0.5px] mb-[14px]">Socialize for Web</h1>
          <p className="text-[#64748b] text-[14px] leading-[20px] mb-[36px]">Send and receive messages in real-time. Select a conversation from the sidebar or start a new chat to begin.</p>
          <div className="mt-[44px] flex items-center justify-center gap-[6px] text-[#64748b] text-[13px]">
            <svg viewBox="0 0 14 18" width="12" height="14" fill="#64748b"><path d="M7 1a4 4 0 0 1 4 4v3H3V5a4 4 0 0 1 4-4zm-5 8h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" /></svg>
            <span>Your personal messages are end-to-end encrypted</span>
          </div>
        </div>
      </div>
    )
  }

  const conversationName = getConversationName()
  const otherParticipant = selectedConversation.participants?.find(p => p._id !== currentUserId)
  const headerStatus = selectedConversation.isGroup ? undefined : otherParticipant?.verificationStatus
  const headerAvatar = selectedConversation.isGroup ? selectedConversation.groupIcon : otherParticipant?.avatar

  return (
    <div className="flex-1 flex flex-col bg-wa-bg-chat h-full relative chat-bg-pattern overflow-hidden min-h-0">
      {/* Header */}
      <div className={`${isMobile ? 'h-[52px] px-[12px]' : 'h-[60px] px-[16px]'} bg-wa-bg-panel/90 backdrop-blur-xl border-b border-wa-separator flex items-center justify-between flex-shrink-0 z-20`}>
        <div className="flex items-center gap-[10px] md:gap-[15px] cursor-pointer min-w-0" onClick={() => setShowChatMenu(!showChatMenu)}>
          {isMobile && (
            <button onClick={(e) => { e.stopPropagation(); onBack?.() }} className="p-2 -ml-2 hover:bg-black/5 rounded-full">
              <svg viewBox="0 0 24 24" width="24" height="24" className="text-wa-text-primary"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            </button>
          )}
          <ChatHeaderAvatar 
            isGroup={selectedConversation.isGroup} 
            status={headerStatus} 
            avatar={headerAvatar || undefined}
          />
          <div className="min-w-0">
            <h2 className={`text-wa-text-primary ${isMobile ? 'text-[15px]' : 'text-[16px]'} font-semibold leading-tight truncate`}>{conversationName}</h2>
            <p className="text-wa-primary text-[12px] leading-normal truncate">
              {typingStatus ? (
                <span className="animate-pulse">{typingStatus.userName} typing...</span>
              ) : (
                <span className="text-wa-text-secondary">{selectedConversation.isGroup ? 'Group' : 'Socialize User'}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[8px] md:gap-[12px] flex-shrink-0">
          {/* Video Call Button */}
          <button 
            onClick={initiateVideoCall}
            className={`flex items-center bg-white border border-wa-border rounded-full hover:bg-blue-50 transition-all cursor-pointer shadow-sm active:scale-95 ${isMobile ? 'p-[8px]' : 'px-[14px] py-[7px]'}`}
            title="Start Video Call"
          >
            <svg viewBox="0 0 24 24" width={isMobile ? 18 : 20} height={isMobile ? 18 : 20} fill="#54656f" className="group-hover:fill-blue-600">
              <path d="M18 7l4-4V17l-4-4V7zM4 6h10c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z" />
            </svg>
            {!isMobile && <span className="text-wa-text-primary text-[14px] font-semibold ml-[8px]">Call</span>}
          </button>

          <div className="h-[24px] w-[1px] bg-wa-border mx-1" />

          <div className="flex items-center gap-[2px]">
            <button className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#aebac1] hover:text-[#54656f]" title="Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" /></svg>
            </button>
            
            {/* Chat three-dot menu */}
            <div className="relative" ref={chatMenuRef}>
              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${showChatMenu ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                title="Menu"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#aebac1"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
              </button>
              {showChatMenu && (
                <div className="absolute top-[48px] right-0 w-[240px] bg-white border border-wa-border rounded-xl shadow-xl py-[10px] z-50 animate-in fade-in zoom-in-95 duration-150">
                  {chatMenuItems.map((item, i) => (
                    'divider' in item ? (
                      <div key={i} className="h-[1px] bg-wa-separator my-[6px] mx-[12px]" />
                    ) : (
                      <button
                        key={i}
                        onClick={() => { item.action?.(); setShowChatMenu(false) }}
                        className="w-full px-[18px] py-[12px] flex items-center gap-[12px] text-left text-[14.5px] hover:bg-gray-50 transition-colors text-wa-text-primary"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && (
        <div className="absolute top-[60px] left-0 right-0 z-20 bg-white border-b border-wa-divider shadow-md px-[24px] py-[12px] flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-[16px]">
            <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]) }} className="p-[8px] hover:bg-gray-100 rounded-full text-wa-text-primary">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
            <span className="font-semibold text-wa-text-primary">{selectedIds.length} selected</span>
          </div>
          <button 
            disabled={selectedIds.length === 0}
            onClick={handleDeleteSelected}
            className="bg-red-500 hover:bg-red-600 text-white px-[16px] py-[8px] rounded-[24px] text-[14px] font-semibold disabled:opacity-50 transition-all flex items-center gap-[8px]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Delete
          </button>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto chat-pattern-bg shadow-inner min-h-0"
        style={{ padding: '16px 12px 20px 12px' }} // T: 16, H: 12, B: 20
      >
        <div className="w-full py-[12px]">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-[40px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e0e7ff] border-t-[#4f46e5]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[60px]">
              <div className="bg-[#dbeafe] rounded-[8px] px-[16px] py-[8px] text-[13px] text-[#475569]">
                <svg viewBox="0 0 14 18" width="10" height="12" fill="#475569" className="inline mr-[6px]"><path d="M7 1a4 4 0 0 1 4 4v3H3V5a4 4 0 0 1 4-4zm-5 8h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" /></svg>
                Messages are end-to-end encrypted. No one outside this chat can read them. Say hi to start the conversation! 👋
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const senderId = getSenderId(message.senderId)
              const isOwn = senderId === currentUserId
              const dateSep = shouldShowDateSeparator(messages, index)
              const isSelected = selectedIds.includes(message._id)
              const showAvatar = !isOwn && selectedConversation.isGroup

              // Grouping Logic
              const prevMsg = index > 0 ? messages[index - 1] : null
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null
              
              const isFirstOfGroup = !prevMsg || getSenderId(prevMsg.senderId) !== senderId || !!dateSep
              const isLastOfGroup = !nextMsg || getSenderId(nextMsg.senderId) !== senderId || !!shouldShowDateSeparator(messages, index + 1)
              
              const marginTop = isFirstOfGroup ? '10px' : '4px'
              const showTail = isLastOfGroup // As requested: Tail ONLY for the last message in a group

              return (
                <div key={message._id}>
                  {dateSep && (
                    <div className="flex justify-center my-[16px]">
                      <span className="bg-wa-bg-dark text-wa-text-secondary text-[12.5px] px-[12px] py-[4px] rounded-[8px] uppercase tracking-wide font-medium shadow-sm">{dateSep}</span>
                    </div>
                  )}
                  
                  {/* Message Row with Dynamic Spacing */}
                  <div 
                    className="group message-group relative flex flex-col animate-float-in"
                    style={{ marginTop: marginTop }}
                  >
                    <div 
                      className={`flex items-start gap-2 ${isOwn ? 'justify-end' : 'justify-start'} w-full transition-colors duration-200 ${isSelected ? 'bg-wa-primary/5' : ''}`}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        if (!isSelectionMode) setReactionMenuId(message._id)
                      }}
                    >
                      {/* Avatar on the Left for Group Chats - Only on first message of group */}
                      {showAvatar && (
                        <div className="flex-shrink-0 self-start" style={{ visibility: isFirstOfGroup ? 'visible' : 'hidden' }}>
                          <MessageAvatar user={message.senderId} />
                        </div>
                      )}

                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="flex items-center mr-[12px] self-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleToggleSelect(message._id)}
                            className="w-[18px] h-[18px] accent-wa-primary cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Message Content Container */}
                      <div className={`flex items-start gap-2 ${isMobile ? 'max-w-[88%]' : 'max-w-[75%]'} min-w-[65px] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* The Bubble */}
                        <div 
                          className={`relative glass-panel-bubble rounded-[16px] ${showTail ? (isOwn ? 'msg-out-tail rounded-tr-none' : 'msg-in-tail rounded-tl-none') : ''} ${isOwn ? 'bg-wa-bg-msg-out text-white' : 'bg-white text-wa-text-primary'}`}
                          style={{ 
                            padding: '6px 12px 8px 12px',
                            boxShadow: '0 1px 1.5px rgba(0,0,0,0.12)'
                          }}
                          onClick={() => isSelectionMode && handleToggleSelect(message._id)}
                        >
                          {/* Reaction Picker Popover */}
                          {reactionMenuId === message._id && (
                            <div className={`absolute -top-[52px] ${isOwn ? 'right-0' : 'left-0'} z-50 reaction-picker-panel p-1.5 rounded-full flex items-center gap-1 animate-in zoom-in-95 duration-200 origin-bottom shadow-2xl border border-white/50`}>
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button 
                                  key={emoji} 
                                  onClick={() => handleToggleReaction(message._id, emoji)}
                                  className="reaction-emoji-btn w-9 h-9 flex items-center justify-center text-[22px] rounded-full"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div className="w-[1px] h-6 bg-slate-200/50 mx-1" />
                              <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-wa-primary">
                                <Plus size={20} />
                              </button>
                            </div>
                          )}

                          {/* Sender Name (In group chats, first of group only) */}
                          {!isOwn && selectedConversation.isGroup && isFirstOfGroup && (
                            <div className="pt-0.5 pb-0.5">
                              <span className="text-[12.5px] font-bold text-wa-primary tracking-wide">
                                {getSenderName(message.senderId)}
                              </span>
                            </div>
                          )}

                          {/* Message Body */}
                          {message.deletedAt ? (
                            <div className="py-1 flex items-center gap-2 text-slate-400 italic text-[14px]">
                              <span>🚫</span>
                              This message was deleted
                            </div>
                          ) : (
                            <div className="relative bubble-text-wrap">
                              {message.text && (
                                <p className="text-[15px] leading-[1.4] whitespace-pre-wrap font-medium">
                                  {message.text}
                                  {/* Invisible spacer to reserve room for timestamp */}
                                  <span className="inline-block w-[65px] h-[10px]"></span>
                                </p>
                              )}
                              
                              {/* Integrated Time & Status (Absolute Bottom Right) */}
                              <div className={`absolute bottom-[-1px] right-[-6px] flex items-center gap-0.5 opacity-70`}>
                                <span className="text-[10px] uppercase font-bold tracking-tighter">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <svg viewBox="0 0 16 11" width="13" height="10" fill="currentColor">
                                    <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.345.14 l-.576.61a.515.515 0 0 0-.148.354c0 .134.057.262.157.357l2.96 2.87a.476.476 0 0 0 .329.141h.015a.472.472 0 0 0 .333-.156l7.186-8.76a.487.487 0 0 0 .108-.37.478.478 0 0 0-.198-.327l-.567-.465zM14.757.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.382.178l-6.19 7.636-.436-.454.612-.751 6.19-7.636a.493.493 0 0 0 .108-.37.478.478 0 0 0-.198-.327l-.567-.465z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Float-below Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className={`absolute -bottom-[10px] ${isOwn ? 'right-1' : 'left-1'} flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-slate-100 px-1 py-0.5 gap-0.5 scale-90`}>
                              {Array.from(new Set(message.reactions.map(r => r.emoji))).slice(0, 3).map(emoji => (
                                <span key={emoji} className="text-[12px]">{emoji}</span>
                              ))}
                              {message.reactions.length > 1 && (
                                <span className="text-[9px] font-black text-slate-500 ml-0.5">{message.reactions.length}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hover Quick Reaction Trigger */}
                        <button 
                          onClick={() => setReactionMenuId(message._id)}
                          className="reaction-btn-trigger w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-wa-primary hover:bg-wa-primary/5 transition-all bg-white shadow-sm border border-slate-100 mt-1"
                        >
                          <Smile size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {activeCall && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300">
           <StreamTheme>
             <StreamCall call={activeCall}>
               <SpeakerLayout />
               <CallControls onLeave={() => setActiveCall(null)} />
             </StreamCall>
           </StreamTheme>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={(e) => handleFileUpload(e, 'document')} />
      <input ref={imageInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'image')} />

      {/* Message Input Area */}
      <div className={`glass-panel flex items-center gap-[8px] flex-shrink-0 mt-0 rounded-xl ${isMobile ? 'm-1 mb-2 px-[8px] py-[6px]' : 'm-2 px-[14px] py-[10px]'}`}>
        {/* Plus / Attach with popup */}
        <div className="relative" ref={attachRef}>
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${showAttachMenu ? 'bg-wa-bg-hover rotate-[135deg]' : 'hover:bg-wa-bg-hover rotate-0'}`}
            title="Attach"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#64748b">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
          {showAttachMenu && (
            <div className="absolute bottom-[52px] left-0 bg-white rounded-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-[12px] z-50 w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex flex-col gap-[4px]">
                {attachOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAttachOptionClick(opt.type as AttachOptionType)}
                    className="flex items-center gap-[14px] px-[12px] py-[10px] rounded-[8px] hover:bg-wa-bg-hover transition-colors group"
                  >
                    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: opt.color }}>
                      {opt.icon}
                    </div>
                    <span className="text-wa-text-primary text-[14px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input container */}
        <div className="flex-1 flex items-center bg-white rounded-[12px] min-h-[44px] px-[12px] shadow-sm">
          {/* Emoji */}
          <div className="relative">
            <button
              className="w-[40px] h-[40px] flex items-center justify-center flex-shrink-0"
              title="Emoji"
              onClick={() => setMessageInput(prev => prev + '😊')}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-wa-text-muted)">
                <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm5.694 0c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm4.667-5.677A5.32 5.32 0 0 1 12 17.242a5.32 5.32 0 0 1-4.667-2.919.5.5 0 0 1 .878-.478 4.326 4.326 0 0 0 3.789 2.397 4.326 4.326 0 0 0 3.789-2.397.5.5 0 0 1 .878.478z" />
              </svg>
            </button>
          </div>

          {/* Text Input */}
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="flex-1 bg-transparent text-wa-text-primary text-[15.5px] py-[10px] focus:outline-none placeholder-wa-text-muted resize-none max-h-[120px] leading-[22px]"
            rows={1}
          />
        </div>

        {/* Send / Mic button */}
        <button
          onClick={messageInput.trim() ? handleSendMessage : undefined}
          disabled={sendingMessage}
          className={`w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${messageInput.trim() ? '' : 'hover:bg-wa-bg-hover'} ${sendingMessage ? 'opacity-50' : ''}`}
          title={messageInput.trim() ? 'Send message' : 'Voice message'}
        >
          {messageInput.trim() ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-wa-primary)">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-wa-text-muted)">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
