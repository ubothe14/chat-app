import { useState, useEffect, useCallback } from 'react'
import SidebarNav from './components/SidebarNav'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPage from './components/AuthPage'
import AdminPanel from './components/AdminPanel'
import CompleteProfileModal from './components/CompleteProfileModal'
import { authAPI, chatAPI, tokenManager } from './services/api'
import './App.css'

export interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    email: string
    avatar: string
    phone?: string
    verificationStatus?: string
  }>
  lastMessage: {
    _id: string
    text: string
    senderId: { _id: string; name: string; email: string }
    createdAt: string
  } | null
  lastMessageAt: string | null
  unreadCounts: Array<{ userId: string; count: number }>
  isGroup: boolean
  groupName: string | null
  groupIcon: string | null
  createdAt: string
}

type AuthMode = 'login' | 'signup'

interface RegisteredUser {
  id?: string
  name: string
  email: string
  phone: string
  password?: string
  experience: string
  targetExam: string
  idDocumentName?: string
  verificationStatus: 'unverified' | 'pending' | 'verified'
  avatar?: string
  role?: 'user' | 'admin'
}

function App() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeNavTab, setActiveNavTab] = useState('chats')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations from backend
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return
    try {
      const response = await chatAPI.getConversations(currentUserId)
      setConversations(response.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }, [currentUserId])

  // Poll conversations every 3 seconds
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return

    fetchConversations() // Fetch immediately

    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated, currentUserId, fetchConversations])

  // Keep selectedConversation in sync with latest data
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c._id === selectedConversation._id)
      if (updated) {
        setSelectedConversation(updated)
      }
    }
  }, [conversations])

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (tokenManager.isAuthenticated()) {
          const response = await authAPI.verifyToken()
          setRegisteredUser(response.user)
          setCurrentUserId(response.user.id || response.user._id)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Auth verification failed:', err)
        tokenManager.removeToken()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function handleSignup(data: RegisteredUser) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authAPI.signup(data)
      tokenManager.setToken(response.token)
      setRegisteredUser(response.user)
      setCurrentUserId(response.user.id || response.user._id)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn(idToken: string) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authAPI.googleSignIn('', '', idToken)
      tokenManager.setToken(response.token)
      setRegisteredUser(response.user)
      setCurrentUserId(response.user.id || response.user._id)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  function handleVerifyStudent() {
    if (!registeredUser) return
    setRegisteredUser({ ...registeredUser, verificationStatus: 'verified' })
  }

  async function handleLogin(identifier: string, password: string) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authAPI.login(identifier, password)
      tokenManager.setToken(response.token)
      setRegisteredUser(response.user)
      setCurrentUserId(response.user.id || response.user._id)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      tokenManager.removeToken()
      setIsAuthenticated(false)
      setRegisteredUser(null)
      setCurrentUserId(null)
      setConversations([])
      setSelectedConversation(null)
      setError(null)
    }
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversation(conversation)
  }

  // Called after a new conversation is created from Sidebar
  function handleConversationCreated(conversation: Conversation) {
    setSelectedConversation(conversation)
    fetchConversations() // Refresh list
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#eff6ff]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#e0e7ff] border-t-[#4f46e5]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    !isAuthenticated ? (
      <AuthPage
        mode={authMode}
        registeredUser={registeredUser}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoogleSignIn={handleGoogleSignIn}
        apiError={error}
        isLoading={isLoading}
      />
    ) : (
      <div className="flex h-screen w-screen overflow-hidden bg-[#eff6ff]">
        {/* If authenticated but missing phone, show the complete profile modal */}
        {isAuthenticated && registeredUser && !registeredUser.phone && (
          <CompleteProfileModal
            userId={currentUserId || ''}
            onComplete={(updates) => {
              setRegisteredUser(prev => prev ? { ...prev, ...updates } : null)
            }}
          />
        )}
        
        <SidebarNav activeTab={activeNavTab} onTabChange={setActiveNavTab} onLogout={handleLogout} userRole={registeredUser?.role} verificationStatus={registeredUser?.verificationStatus} />
        {activeNavTab === 'admin' ? (
          <AdminPanel />
        ) : (
          <>
            <Sidebar
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onConversationCreated={handleConversationCreated}
              currentUserId={currentUserId || ''}
            />
            <ChatWindow
              selectedConversation={selectedConversation}
              currentUserId={currentUserId || ''}
              currentUserVerified={registeredUser?.verificationStatus === 'verified'}
              verificationStatus={registeredUser?.verificationStatus ?? 'unverified'}
              onVerify={() => handleVerifyStudent()}
            />
          </>
        )}
      </div>
    )
  )
}

export default App
