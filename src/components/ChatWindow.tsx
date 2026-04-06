import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { chatAPI } from '../services/api'
import type { Conversation } from '../App'

interface ApiMessage {
  _id: string
  conversationId: string
  senderId: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  text: string
  type: string
  edited: boolean
  editedAt: string | null
  deletedAt: string | null
  readBy: Array<{ userId: string; readAt: string }>
  createdAt: string
}

interface ChatWindowProps {
  selectedConversation: Conversation | null
  currentUserId: string
  currentUserVerified?: boolean
  verificationStatus?: 'pending' | 'verified' | 'unverified'
  onVerify: () => void
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function shouldShowDateSeparator(messages: ApiMessage[], index: number): string | null {
  if (index === 0) return formatDateSeparator(messages[0].createdAt)
  const prev = new Date(messages[index - 1].createdAt)
  const curr = new Date(messages[index].createdAt)
  if (prev.toDateString() !== curr.toDateString()) {
    return formatDateSeparator(messages[index].createdAt)
  }
  return null
}

function ChatHeaderAvatar({ isGroup, verified }: { isGroup: boolean; verified?: boolean }) {
  return (
    <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden flex-shrink-0">
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
      {verified !== undefined && (
        <span style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: verified ? '#16a34a' : '#f59e0b',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 700,
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px rgba(15,23,42,0.12)',
        }}>
          {verified ? '✓' : '!'}
        </span>
      )}
    </div>
  )
}

export default function ChatWindow({ selectedConversation, currentUserId, currentUserVerified, verificationStatus, onVerify }: ChatWindowProps) {
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [showEmojiHint, setShowEmojiHint] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const chatMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const prevConvId = useRef<string | null>(null)

  const scrollToBottom = (force = false) => {
    if (force) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Get conversation display name
  function getConversationName(): string {
    if (!selectedConversation) return ''
    if (selectedConversation.isGroup && selectedConversation.groupName) return selectedConversation.groupName
    const other = selectedConversation.participants.find(p => p._id !== currentUserId)
    return other?.name || 'Unknown'
  }

  function getOtherParticipant() {
    if (!selectedConversation) return null
    return selectedConversation.participants.find(p => p._id !== currentUserId) || selectedConversation.participants[0]
  }

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([])
      return
    }

    const isNewConv = prevConvId.current !== selectedConversation._id
    prevConvId.current = selectedConversation._id

    async function fetchMessages() {
      if (isNewConv) setLoadingMessages(true)
      try {
        const response = await chatAPI.getMessages(selectedConversation!._id)
        const msgs = (response.messages || []).filter((m: ApiMessage) => !m.deletedAt)
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

    // Mark as read
    chatAPI.markAsRead(selectedConversation._id).catch(() => {})

    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [selectedConversation?._id])

  // Scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttachMenu(false)
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target as Node)) setShowChatMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation?._id || sendingMessage) return

    const text = messageInput.trim()
    setMessageInput('')
    setSendingMessage(true)

    try {
      const response = await chatAPI.sendMessage(selectedConversation._id, text)
      // Add the sent message to local state immediately
      setMessages(prev => [...prev, response.data])
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
    }
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
      case 'camera': alert('Camera — requires device camera access'); break
      case 'contact': alert('Contact sharing — Coming soon!'); break
      case 'poll': alert('Poll creation — Coming soon!'); break
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
      action: () => alert('Contact info panel'),
    },
    {
      label: 'Select messages',
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>,
      action: () => alert('Select messages mode'),
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
      <div className="flex-1 bg-[#eff6ff] flex flex-col items-center justify-center relative">
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
  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex flex-col flex-1 h-screen min-w-0">
      {/* Chat Header */}
      <div className="h-[60px] bg-[#eff6ff] flex items-center justify-between px-[16px] flex-shrink-0">
        <div className="flex items-center gap-[12px] min-w-0 cursor-pointer">
          <ChatHeaderAvatar isGroup={selectedConversation.isGroup} verified={currentUserVerified} />
          <div className="min-w-0">
            <h2 className="text-[#0f172a] text-[16px] leading-[21px] truncate">{conversationName}</h2>
            <p className="text-[#64748b] text-[13px] leading-[20px] truncate">
              {selectedConversation.isGroup ? 'click here for group info' : otherParticipant?.email || 'click here for contact info'}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-col items-end gap-[2px] text-right mr-[8px]">
            <span className={`text-[12px] font-semibold ${currentUserVerified ? 'text-[#16a34a]' : 'text-[#b45309]'}`}>
              {verificationStatus === 'verified' ? 'Verified student' : verificationStatus === 'pending' ? 'Verification pending' : 'Unverified student'}
            </span>
            {verificationStatus !== 'verified' && (
              <button
                onClick={onVerify}
                className="text-[#0f74ff] text-[12px] font-semibold hover:underline"
                type="button"
              >
                Admin verify student
              </button>
            )}
          </div>

          <div className="flex items-center gap-[2px]">
            <button className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#dbeafe] transition-colors" title="Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#aebac1"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" /></svg>
            </button>
            {/* Chat three-dot menu */}
            <div className="relative" ref={chatMenuRef}>
              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${showChatMenu ? 'bg-[#dbeafe]' : 'hover:bg-[#dbeafe]'}`}
                title="Menu"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#aebac1"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
              </button>
              {showChatMenu && (
                <div className="absolute top-[44px] right-0 w-[240px] bg-[#ffffff] border border-[#dbeafe] rounded-[16px] shadow-[0_16px_40px_rgba(15,23,42,0.14)] py-[10px] z-50">
                  {chatMenuItems.map((item, i) => (
                    'divider' in item ? (
                      <div key={i} className="h-[1px] bg-[#eff6ff] my-[6px] mx-[12px]" />
                    ) : (
                      <button
                        key={i}
                        onClick={() => { item.action?.(); setShowChatMenu(false) }}
                        className="w-full px-[18px] py-[12px] flex items-center gap-[12px] text-left text-[14.5px] hover:bg-[#eff6ff] transition-colors text-[#0f172a]"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto wa-chat-bg">
        <div className="max-w-[920px] mx-auto px-[63px] py-[12px]">
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
              const isOwn = message.senderId?._id === currentUserId
              const dateSep = shouldShowDateSeparator(messages, index)
              const isRead = message.readBy?.some(r => r.userId !== currentUserId)

              return (
                <div key={message._id}>
                  {dateSep && (
                    <div className="flex justify-center my-[12px]">
                      <span className="date-chip">{dateSep}</span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-[2px]`}>
                    <div className={`relative max-w-[65%] rounded-[7.5px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isOwn ? 'bg-[#dbeafe]' : 'bg-[#eff6ff]'
                      } ${index === 0 && isOwn ? 'msg-out rounded-tr-none' : ''} ${index === 0 && !isOwn ? 'msg-in rounded-tl-none' : ''}`}>

                      {/* Show sender name in group chats */}
                      {!isOwn && selectedConversation.isGroup && (
                        <div className="px-[9px] pt-[5px]">
                          <span className="text-[12.5px] font-semibold text-[#0f74ff]">{message.senderId?.name}</span>
                        </div>
                      )}

                      {message.text && (
                        <div className="px-[9px] pt-[6px] pb-[8px]">
                          <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words text-[#0f172a]">{message.text}</p>
                        </div>
                      )}
                      <div className={`flex items-center justify-end gap-[3px] pr-[8px] pb-[5px] ${message.text ? '-mt-[2px]' : 'px-[8px]'}`}>
                        {message.edited && (
                          <span className="text-[10px] text-[#94a3b8] italic mr-[2px]">edited</span>
                        )}
                        <span className="text-[11px] text-[#64748b] leading-[15px]">{formatMessageTime(message.createdAt)}</span>
                        {isOwn && (
                          <svg viewBox="0 0 16 11" width="16" height="11" fill={isRead ? '#3b82f6' : '#8696a0'} className="ml-[1px]">
                            <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.345.14l-.576.61a.515.515 0 0 0-.148.354c0 .134.057.262.157.357l2.96 2.87a.476.476 0 0 0 .329.141h.015a.472.472 0 0 0 .333-.156l7.186-8.76a.487.487 0 0 0 .108-.37.478.478 0 0 0-.198-.327l-.567-.465zM14.757.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.382.178l-6.19 7.636-.436-.454.612-.751 6.19-7.636a.493.493 0 0 0 .108-.37.478.478 0 0 0-.198-.327l-.567-.465z" />
                          </svg>
                        )}
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

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={(e) => handleFileUpload(e, 'document')} />
      <input ref={imageInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'image')} />

      {/* Message Input Area */}
      <div className="bg-[#eff6ff] border-t border-[#dbeafe] flex items-center px-[14px] py-[10px] gap-[8px] flex-shrink-0">
        {/* Plus / Attach with popup */}
        <div className="relative" ref={attachRef}>
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${showAttachMenu ? 'bg-[#dbeafe] rotate-[135deg]' : 'hover:bg-[#dbeafe] rotate-0'}`}
            title="Attach"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#64748b">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
          {showAttachMenu && (
            <div className="absolute bottom-[52px] left-0 bg-[#ffffff] rounded-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-[12px] z-50 w-[200px]">
              <div className="flex flex-col gap-[4px]">
                {attachOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAttachOptionClick(opt.type as AttachOptionType)}
                    className="flex items-center gap-[14px] px-[12px] py-[10px] rounded-[8px] hover:bg-[#dbeafe] transition-colors group"
                  >
                    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: opt.color }}>
                      {opt.icon}
                    </div>
                    <span className="text-[#0f172a] text-[14px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input container */}
        <div className="flex-1 flex items-center bg-[#ffffff] border border-[#dbeafe] rounded-[20px] min-h-[48px] px-[12px]">
          {/* Emoji */}
          <div className="relative">
            <button
              className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0"
              title="Emoji"
              onMouseEnter={() => setShowEmojiHint(true)}
              onMouseLeave={() => setShowEmojiHint(false)}
              onClick={() => setMessageInput(prev => prev + '😊')}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="#64748b">
                <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm5.694 0c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm4.667-5.677A5.32 5.32 0 0 1 12 17.242a5.32 5.32 0 0 1-4.667-2.919.5.5 0 0 1 .878-.478 4.326 4.326 0 0 0 3.789 2.397 4.326 4.326 0 0 0 3.789-2.397.5.5 0 0 1 .878.478z" />
              </svg>
            </button>
            {showEmojiHint && (
              <div className="absolute bottom-[48px] left-1/2 -translate-x-1/2 bg-[#e2e8f0] text-[#0f172a] text-[12px] px-[8px] py-[4px] rounded whitespace-nowrap shadow-lg">
                Click to add emoji
              </div>
            )}
          </div>

          {/* Text Input */}
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="flex-1 bg-transparent text-[#0f172a] text-[15px] py-[12px] pr-[12px] focus:outline-none placeholder-[#94a3b8] resize-none max-h-[120px] leading-[20px]"
            rows={1}
          />
        </div>

        {/* Send / Mic button */}
        <button
          onClick={messageInput.trim() ? handleSendMessage : undefined}
          disabled={sendingMessage}
          className={`w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 hover:bg-[#dbeafe] ${sendingMessage ? 'opacity-50' : ''}`}
          title={messageInput.trim() ? 'Send message' : 'Voice message'}
        >
          {messageInput.trim() ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#00a884">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#64748b">
              <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.531c0 3.531-2.942 6.002-6.238 6.002s-6.238-2.471-6.238-6.002H4.761c0 3.885 3.118 7.06 6.938 7.53v3.707h2.6v-3.707c3.82-.47 6.938-3.645 6.938-7.53h-1.999v-.001h-2.001z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
