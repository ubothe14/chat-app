import { useState, useEffect, useCallback, useRef } from 'react'
import SidebarNav from './components/SidebarNav'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPage from './components/AuthPage'
import AdminPanel from './components/AdminPanel'
import CompleteProfileModal from './components/CompleteProfileModal'
import CallOverlay from './components/CallOverlay'
import { authAPI, chatAPI, userAPI, videoAPI, tokenManager, getFullImageUrl, type Conversation, type User as APIUser } from './services/api_service'
import { socketService } from './services/socket_service'
import { 
  StreamVideo, 
  StreamVideoClient
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import './App.css'

export type { Conversation }

type AuthMode = 'login' | 'signup'

function App() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeNavTab, setActiveNavTab] = useState('chats')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<APIUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const [videoClient, setVideoClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const videoClientRef = useRef<any>(null)
  const isInitializingRef = useRef(false)

  // Global Call States
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [outgoingCall, setOutgoingCall] = useState<any>(null)
  const [activeCall, setActiveCall] = useState<any>(null)

  const outgoingCallRef = useRef<any>(null)
  const incomingCallRef = useRef<any>(null)
  const activeCallRef = useRef<any>(null)

  useEffect(() => {
    outgoingCallRef.current = outgoingCall
  }, [outgoingCall])

  useEffect(() => {
    incomingCallRef.current = incomingCall
  }, [incomingCall])

  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  // Call Handlers
  const handleStartCall = (data: { conversationId: string, userName: string, userAvatar?: string, participants: string[] }) => {
    setOutgoingCall(data)
    socketService.emitStartCall({
      ...data,
      userId: currentUserId || ''
    })
  }

  const handleAcceptCall = async () => {
    if (!incomingCall || !videoClient) return
    
    try {
      socketService.emitAcceptCall(incomingCall.conversationId, currentUserId || '', incomingCall.participants || [])
      
      const call = videoClient.call('default', incomingCall.conversationId)
      await call.join()
      setActiveCall(call)
      
      const conv = conversations.find(c => c._id === incomingCall.conversationId)
      if (conv) setSelectedConversation(conv)
    } catch (err) {
      console.error('Failed to accept call:', err)
    } finally {
      setIncomingCall(null)
    }
  }

  const handleDeclineCall = () => {
    console.log('🔇 Call Declined/Canceled')
    if (incomingCall) {
      socketService.emitRejectCall(incomingCall.conversationId, currentUserId || '', incomingCall.participants || [])
      setIncomingCall(null)
    }
    if (outgoingCall) {
      socketService.emitRejectCall(outgoingCall.conversationId, currentUserId || '', outgoingCall.participants || [])
      setOutgoingCall(null)
    }

    // Force leave if we've already joined (typical for caller)
    if (activeCallRef.current) {
      activeCallRef.current.leave().catch(console.error)
      setActiveCall(null)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setShowChatOnMobile(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile && selectedConversation) {
      setShowChatOnMobile(true)
    }
  }, [selectedConversation, isMobile])

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return
    try {
      const response = await chatAPI.getConversations(currentUserId as string)
      setConversations(response.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }, [currentUserId])

  // Call Signaling Logic
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      const onIncoming = (data: any) => {
        console.log('📡 Signal Received: incoming-call', data)
        if (data.userId !== currentUserId) {
          setIncomingCall(data)
        }
      }

      const onAccepted = (data: any) => {
        console.log('📡 Signal Received: call-accepted', data)
        if (outgoingCallRef.current && outgoingCallRef.current.conversationId === data.conversationId) {
          setOutgoingCall(null)
        }
      }

      const onRejected = (data: any) => {
        console.log('📡 Signal Received: call-rejected', data)
        if (outgoingCallRef.current && outgoingCallRef.current.conversationId === data.conversationId) {
          setOutgoingCall(null)
          console.log(`${outgoingCallRef.current.userName} declined the call`)
        }
        if (incomingCallRef.current && incomingCallRef.current.conversationId === data.conversationId) {
          setIncomingCall(null)
        }

        // Auto-leave if the other person rejected or canceled
        if (activeCallRef.current && activeCallRef.current.id === data.conversationId) {
           activeCallRef.current.leave().catch(console.error)
           setActiveCall(null)
        }
      }

      socketService.onIncomingCall(onIncoming)
      socketService.onCallAccepted(onAccepted)
      socketService.onCallRejected(onRejected)

      return () => {
        socketService.offIncomingCall(onIncoming)
        socketService.offCallAccepted(onAccepted)
        socketService.offCallRejected(onRejected)
      }
    }
  }, [isAuthenticated, currentUserId])

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken()
      if (token) {
        try {
          const { user } = await userAPI.getCurrentUser()
          if (user) {
            setRegisteredUser(user)
            setCurrentUserId(user._id || user.id || null)
            setIsAuthenticated(true)
          }
        } catch (err) {
          console.error('Auth check failed:', err)
          tokenManager.removeToken()
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated && currentUserId && registeredUser) {
      socketService.connect(currentUserId)
      
      const initVideo = async () => {
        if (videoClientRef.current || isInitializingRef.current) return
        isInitializingRef.current = true
        
        try {
          const { token, apiKey } = await videoAPI.getToken()
          if (!apiKey) throw new Error('API Key missing')

          const user = {
            id: currentUserId,
            name: registeredUser.name || 'User',
            image: registeredUser.avatar ? getFullImageUrl(registeredUser.avatar) : undefined
          }

          const client = new StreamVideoClient({ apiKey, user, token })
          videoClientRef.current = client
          setVideoClient(client)
          console.log('✅ Stream Video client initialized and connected');
        } catch (err: any) {
          console.error('❌ Failed to init video client:', err)
        } finally {
          isInitializingRef.current = false
        }
      }
      initVideo()

      fetchConversations()
      const onMsg = () => fetchConversations()
      socketService.onNewMessage(onMsg)

      return () => {
        socketService.offNewMessage(onMsg)
        // We don't disconnect the overall socket here to avoid flicker on rerenders
        // Socket and Video disconnection is handled in handleLogout
      }
    }
  }, [isAuthenticated, currentUserId, registeredUser, fetchConversations])

  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authAPI.login(email, pass)
      tokenManager.setToken(response.token)
      setRegisteredUser(response.user)
      setCurrentUserId(response.user._id || response.user.id || null)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (data: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authAPI.signup(data)
      tokenManager.setToken(response.token)
      setRegisteredUser(response.user)
      setCurrentUserId(response.user._id || response.user.id || null)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async (token: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authAPI.googleSignIn(token)
      tokenManager.setToken(result.token)
      setRegisteredUser(result.user)
      setCurrentUserId(result.user._id || result.user.id || null)
      setIsAuthenticated(true)
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (activeCallRef.current) {
        await activeCallRef.current.leave().catch(console.error)
        setActiveCall(null)
    }
    if (videoClientRef.current) {
        await videoClientRef.current.disconnectUser()
        videoClientRef.current = null
    }
    socketService.disconnect()
    tokenManager.removeToken()
    setIsAuthenticated(false)
    setRegisteredUser(null)
    setCurrentUserId(null)
    setVideoClient(null)
  }

  const handleTabChange = (tab: string) => {
    setActiveNavTab(tab)
    if (tab !== 'chats') {
      setSelectedConversation(null)
    }
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setShowChatOnMobile(true)
  }

  const handleConversationCreated = (conv: Conversation) => {
    setConversations(prev => [conv, ...prev.filter(c => c._id !== conv._id)])
    setSelectedConversation(conv)
  }

  const handleProfileUpdate = (updates: Partial<APIUser>) => {
    setRegisteredUser(prev => prev ? { ...prev, ...updates } : null)
  }



  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#f0f2f5] flex flex-col items-center justify-center font-wa">
        <div className="w-[80px] h-[80px] mb-8 relative">
          <div className="absolute inset-0 border-4 border-[#00a884] opacity-20 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="h-1 w-48 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#00a884] animate-pulse w-full" />
        </div>
        <p className="mt-4 text-[#667781] text-[14px]">Socialize</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
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
    )
  }

  const MainLayout = (
    <div className="flex h-full bg-transparent overflow-hidden">
      {isAuthenticated && registeredUser && !registeredUser.phone && (
        <CompleteProfileModal
          userId={currentUserId || ''}
          onComplete={(updates) => {
            setRegisteredUser(prev => prev ? { ...prev, ...updates } : null)
          }}
        />
      )}
      
      <div className={`${isMobile && showChatOnMobile ? 'hidden' : 'flex'} h-full flex-shrink-0`}>
        <SidebarNav 
          activeTab={activeNavTab} 
          onTabChange={handleTabChange} 
          onLogout={handleLogout} 
          userRole={registeredUser?.role} 
          verificationStatus={registeredUser?.verificationStatus} 
          user={registeredUser} 
        />
        <div className={`flex-shrink-0 border-r border-[#dadde1] ${isMobile && !showChatOnMobile ? 'w-full' : 'w-[408px] hidden md:block'} overflow-hidden`}>
          <Sidebar 
            conversations={conversations} 
            selectedConversation={selectedConversation} 
            onSelectConversation={handleSelectConversation} 
            onConversationCreated={handleConversationCreated} 
            currentUserId={currentUserId || ''} 
            activeTab={activeNavTab} 
            user={registeredUser} 
            onUserUpdate={handleProfileUpdate} 
          />
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 bg-transparent relative ${isMobile && !showChatOnMobile ? 'hidden' : 'flex'}`}>
        {activeNavTab === 'admin' ? (
          <div className="flex-1 h-full overflow-hidden">
            <AdminPanel />
          </div>
        ) : selectedConversation ? (
          <ChatWindow 
            selectedConversation={selectedConversation} 
            currentUserId={currentUserId || ''} 
            currentUser={registeredUser}
            onBack={() => setShowChatOnMobile(false)}
            isMobile={isMobile}
            videoClient={videoClient}
            onStartCall={handleStartCall}
            activeCall={activeCall}
            setActiveCall={setActiveCall}
          />
        ) : (
          <div className="flex-1 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center relative">
            <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-gradient-to-r from-wa-primary to-blue-400" />
            <div className="text-center max-w-[500px] px-6">
              <div className="mb-[28px] flex justify-center">
                <div className="w-[260px] h-[260px] relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#c7d2e0] opacity-20" />
                  <svg viewBox="0 0 83 83" width="100" height="100" fill="none">
                    <path d="M58.942 26.283H24.058A3.058 3.058 0 0 0 21 29.342v26.316A3.058 3.058 0 0 0 24.058 58.7h6.647l3.529 4.854a1 1 0 0 0 1.616 0l3.53 4.854h6.646l3.53 4.854a1 1 0 0 0 1.615 0l3.53-4.854h2.24A3.058 3.058 0 0 0 62 55.658V29.342a3.058 3.058 0 0 0-3.058-3.059z" fill="#364147" />
                  </svg>
                </div>
              </div>
              <h1 className="text-[32px] font-light text-[#0f172a] tracking-[-0.5px] mb-[14px]">Socialize for Web</h1>
              <p className="text-[#64748b] text-[14px] leading-[20px] mb-[36px]">Send and receive messages in real-time. Select a conversation from the sidebar or start a new chat to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-screen w-screen bg-transparent font-wa antialiased overflow-hidden flex flex-col relative">
      <div className="bg-blobs absolute inset-0 pointer-events-none" />
      {incomingCall && (
        <CallOverlay 
          type="incoming" 
          userName={incomingCall.userName} 
          userAvatar={incomingCall.userAvatar} 
          onAccept={handleAcceptCall} 
          onDecline={handleDeclineCall} 
        />
      )}
      {outgoingCall && (
        <CallOverlay 
          type="outgoing" 
          userName={outgoingCall.userName} 
          userAvatar={outgoingCall.userAvatar} 
          onDecline={handleDeclineCall} 
        />
      )}
      {videoClient ? (
        <StreamVideo client={videoClient}>
          {MainLayout}
        </StreamVideo>
      ) : MainLayout}
    </div>
  )
}

export default App
