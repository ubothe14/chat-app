import { useState, useEffect, useRef } from 'react'
import { userAPI, chatAPI, getFullImageUrl, type Conversation, type User } from '../services/api_service'
import { socketService } from '../services/socket_service'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conv: Conversation) => void
  onConversationCreated: (conv: Conversation) => void
  currentUserId: string
  activeTab?: string
  user?: User | null
  onUserUpdate?: (updatedUser: User) => void
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="h-[60px] bg-wa-bg-panel/70 backdrop-blur-xl px-[16px] flex items-center justify-between flex-shrink-0 border-b border-wa-separator z-10 sticky top-0">
      <h1 className="text-[22px] font-bold text-wa-primary font-display">{title}</h1>
      <div className="flex items-center gap-[6px]">
        {children}
      </div>
    </div>
  )
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

function formatTimestamp(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
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

export default function Sidebar({ conversations, selectedConversation, onSelectConversation, onConversationCreated, currentUserId, activeTab = 'chats', user, onUserUpdate }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [newChatSearch, setNewChatSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<User[]>([])
  const [groupStep, setGroupStep] = useState(1) // 1: Select members, 2: Name group
  const [groupName, setGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filters = ['All', 'Unread', 'Groups']

  // Handle Online Status
  useEffect(() => {
    const handleStatusUpdate = ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev)
        if (status === 'online') next.add(userId)
        else next.delete(userId)
        return next
      })
    }
    socketService.onUserStatus(handleStatusUpdate)
    return () => {
      socketService.offUserStatus(handleStatusUpdate)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setTempName(user.name || '')
    }
  }, [user])

  function getOtherParticipant(conv: Conversation) {
    if (conv.isGroup) return null
    return conv.participants.find((p: User) => p._id !== currentUserId) || conv.participants[0]
  }

  function getConversationName(conv: Conversation): string {
    if (conv.isGroup && conv.groupName) return conv.groupName
    const other = getOtherParticipant(conv)
    return other?.name || 'Unknown'
  }

  function getLastMessagePreview(conv: Conversation): string {
    if (!conv.lastMessage) return 'No messages yet'
    const msg = conv.lastMessage
    let senderId = ''
    if (msg.senderId) {
      senderId = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || msg.senderId.id || '')
    }
    const isMine = senderId === currentUserId
    const prefix = isMine ? 'You: ' : ''
    const text = msg.text || ''
    return prefix + (text.length > 50 ? text.substring(0, 50) + '...' : text)
  }

  function getUnreadCount(conv: Conversation): number {
    const entry = conv.unreadCounts?.find((u: { userId: string, count: number }) => u.userId === currentUserId)
    return entry?.count || 0
  }

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase())
    if (activeFilter === 'All') return matchesSearch
    if (activeFilter === 'Groups') return matchesSearch && conv.isGroup
    if (activeFilter === 'Unread') return matchesSearch && getUnreadCount(conv) > 0
    return matchesSearch
  })

  async function openNewChat() {
    setShowNewChat(true)
    setLoadingUsers(true)
    try {
      const response = await userAPI.getAllUsers()
      const users = (response.users || [])
      setAllUsers(users)
      setSearchResults(users)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

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

  async function startConversation(recipientId: string) {
    try {
      const response = await chatAPI.createConversation(recipientId)
      const conv = response.conversation
      setShowNewChat(false)
      setNewChatSearch('')
      onConversationCreated(conv)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || selectedGroupMembers.length === 0) return
    setCreatingGroup(true)
    try {
      const resp = await chatAPI.createGroup(
        selectedGroupMembers.map(m => m._id || m.id || ''),
        groupName.trim()
      )
      setShowNewGroup(false)
      setShowNewChat(false)
      setGroupName('')
      setSelectedGroupMembers([])
      setGroupStep(1)
      onConversationCreated(resp.conversation)
    } catch (err) {
      console.error('Failed to create group:', err)
      alert('Failed to create group')
    } finally {
      setCreatingGroup(false)
    }
  }

  function toggleMemberSelection(u: User) {
    const id = u._id || u.id
    if (selectedGroupMembers.find(m => (m._id || m.id) === id)) {
      setSelectedGroupMembers(prev => prev.filter(m => (m._id || m.id) !== id))
    } else {
      setSelectedGroupMembers(prev => [...prev, u])
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUpdateProfile = async () => {
    if (!user?._id) return
    try {
      const response = await userAPI.updateProfile(user._id, { name: tempName })
      if (onUserUpdate) onUserUpdate(response.user)
      setEditingName(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?._id) return
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const response = await userAPI.uploadAvatar(user._id, formData)
      if (onUserUpdate) onUserUpdate(response.user)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      alert('Failed to upload avatar. Please try again.')
    }
  }

  const menuItems = [
    { label: 'New group', icon: (<svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>) },
    { divider: true },
    { label: 'Starred messages', icon: (<svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>) },
    { label: 'Settings', icon: (<svg viewBox="0 0 24 24" width="18" height="18" fill="#64748b"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" /></svg>) },
  ]

  if (showNewGroup) {
    const otherUsers = allUsers.filter(u => (u._id || u.id) !== currentUserId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    const groupedUsers = otherUsers.reduce((acc, u) => {
      const char = (u.name?.[0] || '#').toUpperCase()
      if (!acc[char]) acc[char] = []
      acc[char].push(u)
      return acc
    }, {} as Record<string, User[]>)

    const alphabet = Object.keys(groupedUsers).sort()

    return (
      <div className="w-[408px] bg-white flex flex-col h-full border-r border-wa-border flex-shrink-0 animate-in slide-in-from-left duration-300 overflow-hidden">
        {/* Header */}
        <div className="h-[108px] bg-wa-primary text-white flex flex-col justify-end pb-[20px] px-[20px] flex-shrink-0">
          <div className="flex items-center gap-[24px]">
            <button onClick={() => { if (groupStep === 1) setShowNewGroup(false); else setGroupStep(1) }} className="transition-transform hover:-translate-x-1">
              <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            </button>
            <div className="flex-1">
              <h1 className="text-[19px] font-bold">{groupStep === 1 ? 'Add group participants' : 'New group'}</h1>
              {groupStep === 1 && selectedGroupMembers.length > 0 && (
                <p className="text-[13px] opacity-90">{selectedGroupMembers.length} selected</p>
              )}
            </div>
          </div>
        </div>

        {groupStep === 1 ? (
          <>
            {/* Selected chips */}
            <div className={`px-[12px] py-[12px] flex items-center gap-[8px] overflow-x-auto border-b border-wa-separator scrollbar-hide transition-all ${selectedGroupMembers.length > 0 ? 'h-[90px] opacity-100' : 'h-0 opacity-0 overflow-hidden py-0'}`}>
              {selectedGroupMembers.map(m => (
                <div key={m._id} className="relative flex-shrink-0 group">
                  <div className="w-[48px] h-[48px] rounded-full overflow-hidden border border-wa-separator">
                    {m.avatar ? <img src={getFullImageUrl(m.avatar) || ''} className="w-full h-full object-cover" /> : <PersonAvatar />}
                  </div>
                  <button 
                    onClick={() => toggleMemberSelection(m)}
                    className="absolute -top-1 -right-1 bg-[#8696a0] text-white rounded-full w-[20px] h-[20px] flex items-center justify-center border-2 border-white hover:bg-red-500 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                  </button>
                  <p className="text-[11px] text-center text-wa-text-secondary mt-1 truncate w-[48px] px-1">{m.name?.split(' ')[0]}</p>
                </div>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-wa">
              {alphabet.map(char => (
                <div key={char}>
                  <div className="h-[40px] flex items-center px-[32px] text-wa-primary font-medium text-[14px] bg-wa-bg-panel/50 sticky top-0 z-10">{char}</div>
                  {groupedUsers[char].map(u => {
                    const isSelected = selectedGroupMembers.some(sm => (sm._id || sm.id) === (u._id || u.id))
                    return (
                      <button
                        key={u._id}
                        onClick={() => toggleMemberSelection(u)}
                        className="flex items-center px-[18px] py-[12px] hover:bg-wa-bg-hover transition-colors w-full text-left"
                      >
                        <div className="w-[48px] h-[48px] rounded-full overflow-hidden mr-[14px] bg-wa-bg-input relative">
                          {u.avatar ? <img src={getFullImageUrl(u.avatar) || ''} className="w-full h-full object-cover" /> : <PersonAvatar />}
                          {isSelected && (
                            <div className="absolute inset-0 bg-wa-primary/40 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="24" height="24" className="text-white animate-in zoom-in duration-200"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 border-b border-wa-separator pb-[12px]">
                          <h3 className="text-wa-text-primary font-medium text-[17px]">{u.name}</h3>
                          <p className="text-wa-text-secondary text-[13px]">Available</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {selectedGroupMembers.length > 0 && (
              <div className="h-[90px] flex items-center justify-center bg-wa-bg-panel/80 backdrop-blur-md border-t border-wa-separator flex-shrink-0">
                <button 
                  onClick={() => setGroupStep(2)}
                  className="w-[54px] h-[54px] bg-wa-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-wa-primary/90 transition-all hover:scale-105 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-wa-bg-panel">
            <div className="flex flex-col items-center py-[28px] bg-white">
              <div className="w-[150px] h-[150px] bg-[#dfe5e7] rounded-full flex items-center justify-center text-[#919191] cursor-pointer hover:bg-[#d8e0e2] transition-colors shadow-inner">
                <svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor"><path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <p className="text-[13px] text-wa-primary font-bold mt-4 tracking-wider">ADD GROUP ICON</p>
            </div>

            <div className="bg-white px-[30px] pt-[14px] pb-[20px] border-y border-wa-separator">
                <p className="text-wa-primary text-[14px] mb-[18px] font-medium">Group name</p>
                <div className="flex items-center gap-[12px]">
                    <input 
                      type="text" 
                      placeholder="Group Subject" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="flex-1 text-wa-text-primary text-[17px] focus:outline-none bg-transparent border-b-2 border-wa-primary pb-1" 
                      autoFocus
                    />
                </div>
            </div>

            <div className="mt-auto h-[90px] flex items-center justify-center bg-wa-bg-panel">
              <button 
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || creatingGroup}
                className="w-[54px] h-[54px] bg-[#16a34a] text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {creatingGroup ? (
                   <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (showNewChat) {
    const selfUser = searchResults.find(u => (u._id || u.id) === currentUserId)
    const otherUsers = searchResults.filter(u => (u._id || u.id) !== currentUserId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    const groupedUsers = otherUsers.reduce((acc, u) => {
      const char = (u.name?.[0] || '#').toUpperCase()
      if (!acc[char]) acc[char] = []
      acc[char].push(u)
      return acc
    }, {} as Record<string, User[]>)

    const alphabet = Object.keys(groupedUsers).sort()

    return (
      <div className="w-[408px] bg-white flex flex-col h-full border-r border-wa-border flex-shrink-0 animate-in slide-in-from-left duration-300 overflow-hidden">
        {/* Header */}
        <div className="h-[60px] bg-wa-primary text-white px-[20px] flex items-center gap-[24px] flex-shrink-0">
          <button onClick={() => { setShowNewChat(false); setNewChatSearch('') }} className="transition-transform hover:-translate-x-1">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          </button>
          <h1 className="text-[19px] font-bold">New chat</h1>
        </div>

        {/* Search */}
        <div className="px-[12px] py-[8px] bg-white flex-shrink-0">
          <div className="rounded-[8px] h-[40px] flex items-center px-[14px] gap-[12px] bg-wa-bg-input group focus-within:ring-1 focus-within:ring-wa-primary/40">
            <svg viewBox="0 0 24 24" width="18" height="18" className="text-wa-text-muted group-focus-within:text-wa-primary transition-colors">
              <path fill="currentColor" d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search name or number" 
              className="bg-transparent text-wa-text-primary text-[15px] w-full focus:outline-none" 
              value={newChatSearch} 
              onChange={(e) => setNewChatSearch(e.target.value)} 
              autoFocus 
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-wa">
          {loadingUsers ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wa-primary"></div>
            </div>
          ) : (
            <div className="pb-4">
              {/* Top Actions */}
              {!newChatSearch && (
                <>
                  <button 
                    onClick={() => { setShowNewGroup(true); setGroupStep(1) }}
                    className="flex items-center w-full px-[18px] py-[12px] hover:bg-wa-bg-hover transition-colors text-left group"
                  >
                    <div className="w-[48px] h-[48px] rounded-full bg-wa-primary flex items-center justify-center mr-[14px]">
                      <svg viewBox="0 0 24 24" width="24" height="24" className="text-white"><path fill="currentColor" d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <span className="text-wa-text-primary font-medium text-[17px]">New group</span>
                  </button>
                  <button className="flex items-center w-full px-[18px] py-[12px] hover:bg-wa-bg-hover transition-colors text-left group">
                    <div className="w-[48px] h-[48px] rounded-full bg-wa-primary flex items-center justify-center mr-[14px]">
                      <svg viewBox="0 0 24 24" width="24" height="24" className="text-white"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-1 2h2c2.76 0 5 2.24 5 5v2H5v-2c0-2.76 2.24-5 5-5z"/></svg>
                    </div>
                    <span className="text-wa-text-primary font-medium text-[17px]">New community</span>
                  </button>
                  
                  {/* Message yourself */}
                  {selfUser && (
                    <button 
                      onClick={() => selfUser._id && startConversation(selfUser._id)}
                      className="flex items-center w-full px-[18px] py-[12px] hover:bg-wa-bg-hover transition-colors text-left"
                    >
                      <div className="w-[48px] h-[48px] rounded-full overflow-hidden mr-[14px] bg-wa-bg-input">
                        {selfUser.avatar ? <img src={getFullImageUrl(selfUser.avatar) || ''} className="w-full h-full object-cover" /> : <PersonAvatar />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-wa-text-primary font-medium text-[17px]">{selfUser.name} (You)</h3>
                        <p className="text-wa-text-secondary text-[13px]">Message yourself</p>
                      </div>
                    </button>
                  )}
                </>
              )}

              {/* Sorted Alphabetical List */}
              {alphabet.map(char => (
                <div key={char}>
                  <div className="h-[72px] flex items-end px-[32px] pb-[12px] text-wa-primary font-medium text-[16px] bg-white sticky top-0 z-10">{char}</div>
                  {groupedUsers[char].map(u => (
                    <button
                      key={u._id}
                      onClick={() => u._id && startConversation(u._id)}
                      className="flex items-center px-[18px] py-[12px] hover:bg-wa-bg-hover transition-colors w-full text-left"
                    >
                      <div className="w-[48px] h-[48px] rounded-full overflow-hidden mr-[14px] bg-wa-bg-input">
                        {u.avatar ? <img src={getFullImageUrl(u.avatar) || ''} className="w-full h-full object-cover" /> : <PersonAvatar />}
                      </div>
                      <div className="flex-1 border-b border-wa-separator pb-[12px]">
                        <h3 className="text-wa-text-primary font-medium text-[17px] truncate">{u.name}</h3>
                        <p className="text-wa-text-secondary text-[13px] truncate">Available</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const CommunitiesPage = () => (
    <div className="flex flex-col h-full bg-white">
      <SectionHeader title="Communities" />
      <div className="flex-1 flex flex-col items-center justify-center p-[32px] text-center">
        <div className="w-[200px] h-[200px] bg-[#f0f2f5] rounded-full flex items-center justify-center mb-[24px]">
          <svg viewBox="0 0 24 24" width="80" height="80" fill="#667781"><path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-6 0c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm1.67 1.13C7.93 14.06 7 15.32 7 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/></svg>
        </div>
        <h2 className="text-[20px] font-bold text-wa-text-primary mb-[8px]">Stay connected with communities</h2>
        <p className="text-wa-text-secondary text-[14px] leading-[20px] mb-[24px]">Communities bring members together in topic-based groups, and make it easy to get admin announcements.</p>
        <button className="bg-wa-primary text-white px-[24px] py-[10px] rounded-full text-[14px] font-bold hover:shadow-md transition-shadow">Start your community</button>
      </div>
    </div>
  )

  const StatusPage = () => (
    <div className="flex flex-col h-full bg-white">
       <SectionHeader title="Status">
          <button className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-wa-bg-hover transition-colors" title="Privacy">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#54656f"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
          </button>
       </SectionHeader>
       <div className="flex-1 overflow-y-auto">
          <div className="flex items-center px-[16px] py-[12px] hover:bg-wa-bg-hover cursor-pointer border-b border-wa-separator">
            <div className="relative w-[52px] h-[52px] mr-[14px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#dfe5e7]">
                {user?.avatar ? <img src={getFullImageUrl(user.avatar) || ''} className="w-full h-full object-cover" /> : <PersonAvatar />}
              </div>
              <div className="absolute bottom-[2px] right-[2px] w-[18px] h-[18px] bg-wa-primary rounded-full flex items-center justify-center border-2 border-white text-white">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-wa-text-primary font-medium text-[17px]">My Status</h3>
              <p className="text-wa-text-secondary text-[14px]">Click to add status update</p>
            </div>
          </div>
          <div className="px-[16px] py-[20px] bg-[#f0f2f5] text-wa-primary text-[14px] font-bold uppercase tracking-wider">Recent updates</div>
          <div className="flex flex-col items-center justify-center py-[40px] px-10 text-center">
            <p className="text-wa-text-secondary text-[14px]">No status updates from your contacts yet.</p>
          </div>
       </div>
    </div>
  )

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'groups':
        return (
          <>
            <SectionHeader title="Groups">
              <button onClick={openNewChat} className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-wa-bg-hover transition-colors" title="New group">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#54656f"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
              </button>
            </SectionHeader>
            <div className="px-[12px] py-[8px] bg-white">
              <div className={`rounded-[10px] h-[40px] flex items-center px-[14px] gap-[24px] ${searchFocused ? 'bg-white shadow-sm ring-1 ring-wa-primary/10' : 'bg-wa-bg-input'}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill={searchFocused ? "#008069" : "#8696a0"}>
                  <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
                </svg>
                <input type="text" placeholder="Search groups" className="bg-transparent text-wa-text-primary text-[15px] w-full focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white scrollbar-wa">
               {conversations.filter(c => c.isGroup).map(conv => (
                 <ConversationItem key={conv._id} conv={conv} />
               ))}
            </div>
          </>
        )
      case 'communities':
        return <CommunitiesPage />
      case 'status':
        return <StatusPage />
      case 'admin':
        return <div className="p-10 text-center text-wa-text-secondary">Admin Mode Active (Main Panel)</div>
      default:
        return (
          <>
            <SectionHeader title="Socialize">
              <button onClick={openNewChat} className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-wa-bg-hover transition-colors" title="New chat">
                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#54656f" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM13 11h-2v2H9v-2H7V9h2V7h2v2h2v2z" /></svg>
              </button>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${showMenu ? 'bg-wa-bg-hover' : 'hover:bg-wa-bg-hover'}`}>
                  <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#54656f" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
                </button>
                {showMenu && (
                  <div className="absolute top-[46px] right-0 w-[240px] bg-white border border-wa-border rounded-[16px] shadow-lg py-[10px] z-50">
                    {menuItems.map((item, i) => 'divider' in item ? <div key={i} className="h-[1px] bg-wa-separator my-[6px] mx-[12px]" /> : (
                      <button key={i} onClick={() => { setShowMenu(false); alert('Coming soon!') }} className="w-full px-[24px] py-[12px] flex items-center gap-[16px] hover:bg-wa-bg-hover transition-colors text-wa-text-primary text-[14.5px]">
                        {item.icon}<span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionHeader>
            <div className="px-[12px] py-[8px] bg-white">
              <div className={`rounded-[10px] h-[40px] flex items-center px-[14px] gap-[24px] ${searchFocused ? 'bg-white shadow-sm ring-1 ring-wa-primary/10' : 'bg-wa-bg-input'}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill={searchFocused ? "#008069" : "#8696a0"}>
                  <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
                </svg>
                <input type="text" placeholder="Search or start a new chat" className="bg-transparent text-wa-text-primary text-[15px] w-full focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
              </div>
            </div>
            <div className="px-[12px] pt-[4px] pb-[10px] flex items-center gap-[8px] overflow-x-auto scrollbar-hide">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-[14px] py-[6px] rounded-full text-[14px] font-medium transition-all ${activeFilter === f ? 'bg-wa-primary text-white' : 'bg-wa-separator text-wa-text-secondary hover:bg-wa-bg-hover'}`}>{f}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto bg-white scrollbar-wa">
              {filteredConversations.map(conv => (
                <ConversationItem key={conv._id} conv={conv} />
              ))}
            </div>
          </>
        )
    }
  }

  const ConversationItem = ({ conv }: { conv: Conversation }) => {
    const other = getOtherParticipant(conv)
    const name = getConversationName(conv)
    const lastMsg = getLastMessagePreview(conv)
    const time = formatTimestamp(conv.lastMessageAt)
    const unread = getUnreadCount(conv)
    const isSelected = selectedConversation?._id === conv._id
    const isOnline = !conv.isGroup && other?._id ? onlineUserIds.has(other._id) : false

    return (
      <div onClick={() => onSelectConversation(conv)} className={`flex items-center pl-[14px] pr-[16px] cursor-pointer group relative transition-standard ${isSelected ? 'bg-wa-bg-hover' : 'hover:bg-wa-bg-input'}`}>
        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-wa-primary animate-in fade-in duration-300" />}
        <div className="relative w-[50px] h-[50px] rounded-full flex-shrink-0 mr-[12px] my-[12px]">
          <div className="w-full h-full rounded-full overflow-hidden bg-wa-bg-input flex items-center justify-center">
            {conv.isGroup ? (
              conv.groupIcon ? (
                <img src={getFullImageUrl(conv.groupIcon) || ''} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full bg-[#dcf8ff] flex items-center justify-center text-[#0f74ff]">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
              )
            ) : (
              other?.avatar ? <img src={getFullImageUrl(other.avatar) || ''} className="w-full h-full object-cover" alt="" /> : <PersonAvatar />
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-[2px] right-[2px] w-[14px] h-[14px] bg-[#16a34a] rounded-full border-2 border-white shadow-sm" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-[4px] h-[74px] flex flex-col justify-center border-b border-wa-separator group-last:border-none">
          <div className="flex justify-between items-baseline mb-[4px]">
            <h3 className="text-wa-text-primary text-[17px] font-medium truncate">{name}</h3>
            <span className={`text-[12px] font-medium ${unread > 0 ? 'text-wa-primary' : 'text-wa-text-muted'}`}>{time}</span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-wa-text-secondary text-[14px] truncate">{lastMsg}</p>
            {unread > 0 && <span className="bg-wa-primary text-white min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold px-[5px]">{unread}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[408px] glass-panel flex flex-col h-full border-r border-wa-border flex-shrink-0 relative overflow-hidden">
      {activeTab === 'profile' ? (
        <div className="absolute inset-0 z-50 flex flex-col h-full bg-wa-separator animate-in slide-in-from-left duration-300 overflow-hidden">
          <div className="h-[60px] bg-wa-primary text-white px-[20px] flex items-center gap-[24px] flex-shrink-0">
            <button className="transition-transform hover:-translate-x-1" onClick={() => window.dispatchEvent(new CustomEvent('nav-chats'))}>
                <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            </button>
            <h1 className="text-[19px] font-bold">Profile</h1>
          </div>
          <div className="flex-1 overflow-y-auto bg-wa-separator">
            <div className="flex flex-col items-center py-[28px]">
              <div className="w-[200px] h-[200px] rounded-full overflow-hidden shadow-md cursor-pointer" onClick={handleAvatarClick}>
                 {user?.avatar ? <img src={getFullImageUrl(user.avatar) || ''} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#dfe5e7] flex items-center justify-center text-[#919191]"><svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg></div>}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="bg-white shadow-sm px-[30px] pt-[14px] pb-[20px] mb-[12px]">
                <p className="text-wa-primary text-[14px] mb-[18px] font-medium">Your name</p>
                <div className="flex items-center gap-[12px]">
                    <input 
                      type="text" 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)}
                      readOnly={!editingName}
                      className={`flex-1 text-wa-text-primary text-[17px] focus:outline-none bg-transparent ${editingName ? 'border-b border-wa-primary pb-1' : ''}`}
                    />
                    {editingName ? (
                        <button onClick={handleUpdateProfile} className="text-wa-primary"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></button>
                    ) : (
                        <button onClick={() => setEditingName(true)} className="text-wa-text-muted hover:text-wa-primary"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg></button>
                    )}
                </div>
                <p className="text-wa-text-muted text-[13px] mt-[12px] leading-[20px]">This is not your username or pin. This name will be visible to your Socialize contacts.</p>
            </div>

            <div className="bg-white shadow-sm px-[30px] pt-[14px] pb-[20px]">
                <p className="text-wa-primary text-[14px] mb-[18px] font-medium">About</p>
                <div className="flex items-center gap-[12px]">
                    <input type="text" value="Available" readOnly className="flex-1 text-wa-text-primary text-[17px] focus:outline-none bg-transparent" />
                </div>
            </div>
          </div>
        </div>
      ) : renderSidebarContent()}
    </div>
  )
}
