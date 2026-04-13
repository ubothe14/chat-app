import { useState, lazy, Suspense } from 'react'
import { LayoutDashboard, ShieldCheck, Megaphone, RefreshCw, Send, Users as UsersIcon, LifeBuoy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { userAPI, chatAPI } from '../services/api_service'

// Lazy load elite admin components
const AdminOverview = lazy(() => import('./admin/AdminOverview'))
const AdminKYC = lazy(() => import('./admin/AdminKYC'))
const AdminUserManagement = lazy(() => import('./admin/AdminUserManagement'))
const AdminQueries = lazy(() => import('./admin/AdminQueries'))

export default function AdminPanel({ onExit }: { onExit?: () => void }) {
  const [adminTab, setAdminTab] = useState<'overview' | 'verify' | 'broadcast' | 'manage' | 'queries'>('overview')
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return
    setIsBroadcasting(true)
    try {
      await userAPI.broadcastMessage(broadcastText, broadcastTitle)
      setBroadcastText('')
      setBroadcastTitle('')
      alert('Broadcast dispatched successfully to all network nodes.')
    } catch (err) {
      console.error('Broadcast failed:', err)
      alert('Broadcast transmission failed. Check network logs.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const startChatWithUser = async (userId: string) => {
      try {
          await chatAPI.createConversation(userId)
          console.log('Chat initiated with user:', userId)
      } catch (err) {
          console.error('Failed to start chat:', err)
      }
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden relative font-sans">
      {/* Dynamic Background Pulse */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-wa-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Premium Glass Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-[80px] md:h-[100px] bg-wa-primary/95 backdrop-blur-xl text-white px-6 md:px-12 flex items-center justify-between flex-shrink-0 z-30 border-b border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group">
             <ShieldCheck size={28} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[22px] md:text-[28px] font-black tracking-tight uppercase leading-none">Command Center</h1>
            <p className="text-[11px] text-white/50 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Administrative Hub V2.0
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="p-3.5 hover:bg-white/10 rounded-2xl transition-all group active:scale-95 bg-white/5 border border-white/10 flex items-center gap-2.5"
            title="System Refresh"
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
            <span className="hidden lg:inline text-[13px] font-black uppercase tracking-wider">Refresh</span>
          </button>
          
          <button 
            onClick={onExit}
            className="px-6 py-3.5 bg-white text-wa-primary hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all font-black text-[13px] uppercase tracking-wider flex items-center gap-2.5 shadow-lg active:scale-95"
          >
            <Send size={18} className="rotate-180" />
            Exit Hub
          </button>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-20">
        
        {/* Elite Glass Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-[320px] bg-white/90 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-[#d1dce5] flex flex-row md:flex-col p-4 md:p-8 gap-6 overflow-x-auto md:overflow-x-hidden shadow-[15px_0_40px_rgba(0,0,0,0.03)]"
        >
          <div className="hidden md:block mb-8 px-2">
            <p className="text-[11px] font-black text-wa-text-secondary/40 uppercase tracking-[0.3em]">Operational Tabs</p>
          </div>
          
          <div className="flex flex-col gap-5 w-full">
            <NavTab active={adminTab === 'overview'} onClick={() => setAdminTab('overview')} label="Live Insights" icon={<LayoutDashboard size={22} />} />
            <NavTab active={adminTab === 'verify'} onClick={() => setAdminTab('verify')} label="Identity Gallery" icon={<ShieldCheck size={22} />} />
            <NavTab active={adminTab === 'manage'} onClick={() => setAdminTab('manage')} label="User Grid" icon={<UsersIcon size={22} />} />
            <NavTab active={adminTab === 'queries'} onClick={() => setAdminTab('queries')} label="Queries" icon={<LifeBuoy size={22} />} />
            
            <div className="hidden md:block h-px w-full bg-wa-separator/40 my-6" />
            
            <NavTab active={adminTab === 'broadcast'} onClick={() => setAdminTab('broadcast')} label="Global Pulse" icon={<Megaphone size={22} />} />
          </div>
          
          <div className="hidden md:block mt-auto p-5 bg-wa-primary/5 rounded-[28px] border border-wa-primary/10 group">
              <p className="text-[12px] font-black text-wa-primary uppercase tracking-wider mb-2">Node Environment</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                </div>
                <p className="text-[11px] text-wa-text-secondary font-black opacity-60 uppercase tracking-widest">Secure / Active</p>
              </div>
          </div>
        </motion.div>

        {/* Content Area with Fluid Transitions */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-wa relative">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-wa-primary uppercase">SYNC</div>
              </div>
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={adminTab}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-7xl mx-auto"
              >
                {adminTab === 'overview' && <AdminOverview />}
                {adminTab === 'verify' && <AdminKYC />}
                {adminTab === 'manage' && <AdminUserManagement onStartChat={startChatWithUser} />}
                {adminTab === 'queries' && <AdminQueries />}
                
                {/* Broadcast Section */}
                {adminTab === 'broadcast' && (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 md:p-14 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-wa-separator/20 relative overflow-hidden group min-h-[600px] flex flex-col"
                  >
                    <div className="absolute top-[-50px] right-[-50px] p-10 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                      <Megaphone size={400} />
                    </div>
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-50 text-red-600 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 border border-red-100">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                        Priority Alpha Protocol
                      </div>
                      
                      <h3 className="text-[32px] md:text-[38px] font-black text-wa-text-primary tracking-tight mb-4 leading-tight">Global Annunciation Terminal</h3>
                      <p className="text-[15px] text-wa-text-secondary max-w-2xl leading-relaxed mb-10 opacity-70">
                        Initiate a global announcement pulse across all active Socialize connections. 
                        Transmission will be push-broadcasted to all reachable network nodes.
                      </p>
                      
                      <div className="space-y-8 flex-1">
                        <div>
                          <label className="text-[11px] font-black text-wa-text-secondary/40 uppercase tracking-[0.2em] mb-3 block px-1">Transmission Title</label>
                          <input 
                            type="text"
                            placeholder="e.g. Critical System Patch v2.0"
                            className="w-full bg-[#f8fbff] px-8 py-5 rounded-[22px] border border-[#e2e8f0] focus:outline-none focus:ring-8 focus:ring-wa-primary/5 text-[15px] font-black shadow-inner transition-all hover:bg-white"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <label className="text-[11px] font-black text-wa-text-secondary/40 uppercase tracking-[0.2em] mb-3 block px-1">Transmission Payload</label>
                          <textarea 
                            value={broadcastText}
                            onChange={(e) => setBroadcastText(e.target.value)}
                            placeholder="Formulate your network-wide message..."
                            className="w-full h-full min-h-[220px] p-8 bg-[#f8fbff] rounded-[32px] focus:outline-none focus:ring-8 focus:ring-wa-primary/5 text-[16px] font-medium resize-none transition-all border border-[#e2e8f0] focus:border-wa-primary/40 shadow-inner hover:bg-white"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-10 flex justify-end">
                        <button 
                          onClick={handleBroadcast}
                          disabled={!broadcastText.trim() || isBroadcasting}
                          className="px-14 py-5 bg-wa-primary text-white rounded-[24px] font-black text-[16px] shadow-[0_25px_50px_rgba(0,128,105,0.3)] hover:shadow-[0_30px_60px_rgba(0,128,105,0.45)] disabled:opacity-50 transition-all flex items-center gap-5 active:scale-[0.96] group/btn uppercase tracking-widest"
                        >
                          {isBroadcasting ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                          {isBroadcasting ? 'Disseminating...' : 'Activate Pulse'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function NavTab({ active, onClick, label, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-5 px-6 py-5 rounded-[24px] text-[15px] font-black transition-all duration-300 group ${
        active 
          ? 'bg-wa-primary text-white shadow-[0_20px_40px_rgba(0,128,105,0.25)]' 
          : 'bg-transparent text-wa-text-secondary hover:bg-white hover:shadow-xl hover:translate-x-1'
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? 'scale-110 shadow-lg' : 'text-wa-primary group-hover:scale-110'}`}>{icon}</span>
      <span className="hidden sm:inline tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-indicator"
          className="absolute left-1 w-1.5 h-8 bg-white/40 rounded-full"
        />
      )}
    </button>
  )
}