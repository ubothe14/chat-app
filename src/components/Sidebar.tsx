import { useState, useEffect, useRef } from 'react'
import { userAPI, chatAPI, type Conversation, type User } from '../services/api_service'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conv: Conversation) => void
  onConversationCreated: (conv: Conversation) => void
  currentUserId: string
}

function PersonAvatar() {
  return (
    <svg viewBox="0 0 212 212" className="w-full h-full">
      <path fill="#6b7b8d" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
      <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-22.632-22.851c-9.653-5.901-20.347-9.018-31.342-9.135-11.108.117-21.854 3.241-31.545 9.148a62.81 62.81 0 0 0-22.634 22.853 89.488 89.488 0 0 0 54.164 18.257 89.488 89.488 0 0 0 53.989-18.272z" />
      <path fill="#cfd4d6" d="M106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 30.513-38.089C144.028 65.326 126.914 48 106.002 48S67.975 65.326 67.975 86.674a38.272 38.272 0 0 0 30.513 38.089A39.66 39.66 0 0 0 106.002 125.5z" />
    </svg>
  )
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export default function Sidebar({ conversations, selectedConversation, onSelectConversation, onConversationCreated, currentUserId }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [newChatSearch, setNewChatSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const filters = ['All', 'Unread', 'Groups']

  // Get the "other" participant in a 1-on-1 conversation
  function getOtherParticipant(conv: Conversation) {
    if (conv.isGroup) return null
    return conv.participants.find((p: User) => p._id !== currentUserId) || conv.participants[0]
  }

  // Get display name for conversation
  function getConversationName(conv: Conversation): string {
    if (conv.isGroup && conv.groupName) return conv.groupName
    const other = getOtherParticipant(conv)
    return other?.name || 'Unknown'
  }

  // Get last message preview
  function getLastMessagePreview(conv: Conversation): string {
    if (!conv.lastMessage) return 'No messages yet'
    const msg = conv.lastMessage
    
    // Safety check for senderId
    let senderId = ''
    if (msg.senderId) {
      senderId = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || msg.senderId.id || '')
    }
    
    const isMine = senderId === currentUserId
    const prefix = isMine ? 'You: ' : ''
    const text = msg.text || ''
    return prefix + (text.length > 50 ? text.substring(0, 50) + '...' : text)
  }

  // Get unread count for current user
  function getUnreadCount(conv: Conversation): number {
    const entry = conv.unreadCounts?.find((u: { userId: string, count: number }) => u.userId === currentUserId)
    return entry?.count || 0
  }

  // Filter conversations based on active filter and search
  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase())
    if (activeFilter === 'All') return matchesSearch
    if (activeFilter === 'Groups') return matchesSearch && conv.isGroup
    if (activeFilter === 'Unread') return matchesSearch && getUnreadCount(conv) > 0
    return matchesSearch
  })

  // Load all users when opening new chat panel
  async function openNewChat() {
    setShowNewChat(true)
    setLoadingUsers(true)
    try {
      const response = await userAPI.getAllUsers()
      const users = (response.users || []).filter((u: User) => (u._id || u.id) !== currentUserId)
      setAllUsers(users)
      setSearchResults(users)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Search users in new chat panel
  useEffect(() => {
    if (!showNewChat) return
    if (!newChatSearch.trim()) {
      setSearchResults(allUsers)
      return
    }
    const query = newChatSearch.toLowerCase()
    setSearchResults(allUsers.filter((u: User) =>
      (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query)
    ))
  }, [newChatSearch, allUsers, showNewChat])

  // Start a new conversation with a user
  async function startConversation(recipientId: string) {
    setCreatingConversation(true)
    try {
      const response = await chatAPI.createConversation(recipientId)
      const conv = response.conversation
      setShowNewChat(false)
      setNewChatSearch('')
      onConversationCreated(conv)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    } finally {
      setCreatingConversation(false)
    }
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    {
      label: 'New group', icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
      )
    },
    { divider: true },
    {
      label: 'Starred messages', icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
      )
    },
    {
      label: 'Settings', icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" /></svg>
      )
    },
  ]

  // ─── New Chat Panel ─────────────────────────────────────
  if (showNewChat) {
    return (
      <div className="w-[408px] bg-[#f8fbff] flex flex-col h-screen border-r border-[#dbeafe] flex-shrink-0">
        {/* Header */}
        <div className="h-[60px] bg-[#eff6ff] px-[16px] flex items-center gap-[16px] flex-shrink-0">
          <button
            onClick={() => { setShowNewChat(false); setNewChatSearch('') }}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full hover:bg-[#dbeafe] transition-colors duration-150"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#64748b">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-[#0f172a]">New chat</h1>
        </div>

        {/* Search */}
        <div className="px-[12px] py-[8px] bg-[#ffffff] flex-shrink-0">
          <div className="rounded-[8px] h-[40px] flex items-center px-[14px] gap-[12px] bg-[#eff6ff]">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#8696a0">
              <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
            </svg>
            <input
              type="text"
              placeholder="Search users by name or email"
              className="bg-transparent text-[#0f172a] text-[15px] w-full focus:outline-none placeholder-[#94a3b8]"
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-[40px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e0e7ff] border-t-[#4f46e5]"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="px-[18px] py-[12px]">
                <p className="text-[13px] text-[#64748b] font-medium uppercase tracking-wider">
                  {newChatSearch ? `Results (${searchResults.length})` : `All users (${searchResults.length})`}
                </p>
              </div>
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => user._id && startConversation(user._id)}
                  disabled={creatingConversation}
                  className="flex items-center pl-[18px] pr-[18px] cursor-pointer transition-colors duration-100 hover:bg-[#eff6ff] w-full text-left"
                >
                  <div className="w-[50px] h-[50px] rounded-full flex-shrink-0 mr-[14px] overflow-hidden bg-[#eef2ff]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <PersonAvatar />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-[14px] border-b border-[#dbeafe]">
                    <h3 className="text-[#0f172a] text-[17px] leading-[22px] truncate">{user.name}</h3>
                    <p className="text-[#64748b] text-[14px] leading-[20px] truncate">{user.email}</p>
                  </div>
                  {user.verificationStatus === 'verified' && (
                    <span className="ml-[8px] flex-shrink-0 w-[18px] h-[18px] rounded-full bg-[#16a34a] flex items-center justify-center text-white text-[11px] font-bold">✓</span>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-[60px] text-[#64748b]">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="#cbd5e1" className="mb-[12px]">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <p className="text-[15px]">No users found</p>
              <p className="text-[13px] mt-[4px]">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Main Sidebar ───────────────────────────────────────
  return (
    <div className="w-[408px] bg-[#f8fbff] flex flex-col h-screen border-r border-[#dbeafe] flex-shrink-0">
      {/* Header */}
      <div className="h-[60px] bg-[#eff6ff] px-[16px] flex items-center justify-between flex-shrink-0">
        <h1 className="text-[24px] font-bold text-[#0f172a]">Socialize</h1>
        <div className="flex items-center gap-[6px]">
          <button
            onClick={openNewChat}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full hover:bg-[#dbeafe] transition-colors duration-150"
            title="New chat"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#64748b">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM13 11h-2v2H9v-2H7V9h2V7h2v2h2v2z" />
            </svg>
          </button>
          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-[42px] h-[42px] flex items-center justify-center rounded-full transition-colors duration-150 ${showMenu ? 'bg-[#dbeafe]' : 'hover:bg-[#dbeafe]'}`}
              title="Menu"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#64748b">
                <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute top-[46px] right-0 w-[240px] bg-[#ffffff] border border-[#dbeafe] rounded-[16px] shadow-[0_16px_40px_rgba(15,23,42,0.14)] py-[10px] z-50 animate-in fade-in duration-150">
                {menuItems.map((item, i) => (
                  'divider' in item ? (
                    <div key={i} className="h-[1px] bg-[#eff6ff] my-[6px] mx-[12px]" />
                  ) : (
                    <button
                      key={i}
                      onClick={() => {
                        setShowMenu(false)
                        alert(`${item.label} — Coming soon!`)
                      }}
                      className="w-full px-[24px] py-[12px] flex items-center gap-[16px] text-left hover:bg-[#eff6ff] transition-colors duration-100 text-[#0f172a]"
                    >
                      {item.icon}
                      <span className="text-[14.5px]">{item.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-[12px] py-[8px] bg-[#ffffff] flex-shrink-0">
        <div className={`rounded-[8px] h-[40px] flex items-center px-[14px] gap-[24px] transition-all duration-200 ${searchFocused ? 'bg-[#dbeafe]' : 'bg-[#eff6ff]'}`}>
          <div className="flex-shrink-0 w-[28px] flex items-center justify-center">
            {searchFocused ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#00a884">
                <path d="M12 4l1.41 1.41L7.83 11H20v2H7.83l5.58 5.59L12 20l-8-8 8-8z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#8696a0">
                <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            placeholder="Search conversations"
            className="bg-transparent text-[#0f172a] text-[15px] w-full focus:outline-none placeholder-[#94a3b8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-[12px] pt-[4px] pb-[12px] flex items-center gap-[10px] flex-shrink-0 overflow-x-auto scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-[16px] py-[8px] rounded-full text-[15px] whitespace-nowrap transition-all duration-150 ${activeFilter === filter
                ? 'bg-[#dbeafe] text-[#0f74ff]'
                : 'bg-[#eff6ff] text-[#475569] hover:bg-[#dbeafe]'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv)
            const name = getConversationName(conv)
            const lastMsg = getLastMessagePreview(conv)
            const time = formatTimestamp(conv.lastMessageAt)
            const unread = getUnreadCount(conv)

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`flex items-center pl-[18px] pr-[18px] cursor-pointer transition-colors duration-100 group rounded-[18px] ${selectedConversation?._id === conv._id ? 'bg-[#dbeafe]' : 'hover:bg-[#eff6ff]'} mb-[10px] last:mb-0`}
              >
                <div className="w-[55px] h-[55px] rounded-full flex-shrink-0 mr-[14px] overflow-hidden bg-[#eef2ff]">
                  {other?.avatar ? (
                    <img src={other.avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <PersonAvatar />
                  )}
                </div>
                <div className={`flex-1 min-w-0 py-[18px] ${selectedConversation?._id === conv._id ? '' : 'border-b border-[#dbeafe]'}`}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[#0f172a] text-[17px] leading-[22px] truncate pr-[8px]">{name}</h3>
                    <span className={`text-[13px] flex-shrink-0 ${unread > 0 ? 'text-[#0f74ff]' : 'text-[#64748b]'}`}>{time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-[4px]">
                    <p className="text-[#475569] text-[14.5px] truncate leading-[20px] pr-[8px]">{lastMsg}</p>
                    <div className="flex items-center gap-[6px] flex-shrink-0">
                      {unread > 0 && (
                        <span className="bg-[#0f74ff] text-[#ffffff] min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-medium px-[5px]">{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#64748b] px-[24px]">
            {conversations.length === 0 ? (
              <>
                <svg viewBox="0 0 24 24" width="56" height="56" fill="#cbd5e1" className="mb-[16px]">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
                <p className="text-[16px] font-medium text-[#475569] mb-[6px]">No conversations yet</p>
                <p className="text-[14px] text-center text-[#94a3b8] mb-[16px]">Start a new chat to begin messaging</p>
                <button
                  onClick={openNewChat}
                  className="px-[20px] py-[10px] bg-[#0f74ff] text-white rounded-full text-[14px] font-medium hover:bg-[#1565e8] transition-colors"
                >
                  Start a new chat
                </button>
              </>
            ) : (
              <p className="text-[15px]">No matching chats</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
