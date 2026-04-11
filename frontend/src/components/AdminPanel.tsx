import { useState, lazy, Suspense } from 'react'
import { LayoutDashboard, ShieldCheck, Megaphone, RefreshCw, Send, Users as UsersIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { userAPI, chatAPI } from '../services/api_service'

// Lazy load elite admin components
const AdminOverview = lazy(() => import('./admin/AdminOverview'))
const AdminKYC = lazy(() => import('./admin/AdminKYC'))
const AdminUserManagement = lazy(() => import('./admin/AdminUserManagement'))

export default function AdminPanel() {
  const [adminTab, setAdminTab] = useState<'overview' | 'verify' | 'broadcast' | 'manage'>('overview')
  const [broadcastText, setBroadcastText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return
    setLoading(true)
    try {
      const res = await userAPI.broadcastMessage(broadcastText)
      console.log('Broadcast message sent:', res.message)
      setBroadcastText('')
    } catch (err) {
      console.error('Broadcast failed:', err)
    } finally {
      setLoading(false)
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
    <div className="flex flex-col h-full bg-[#f0f4f8] overflow-hidden relative font-sans">
      {/* Dynamic Background Pulse */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-wa-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Premium Glass Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-[70px] md:h-[90px] bg-wa-primary/95 backdrop-blur-xl text-white px-6 md:px-10 flex items-center justify-between flex-shrink-0 z-30 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
             <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black tracking-tight uppercase leading-none">Command Center</h1>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">Socialize Administrative Hub</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="p-3 hover:bg-white/20 rounded-2xl transition-all group active:scale-95 bg-white/10 border border-white/10 flex items-center gap-2"
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          <span className="hidden md:inline text-[13px] font-bold">System Refresh</span>
        </button>
      </motion.div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-20">
        
        {/* Elite Glass Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-[280px] bg-white/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-[#d1dce5] flex flex-row md:flex-col p-3 md:p-6 gap-3 overflow-x-auto md:overflow-x-hidden shadow-[10px_0_30px_rgba(0,0,0,0.02)]"
        >
          <p className="hidden md:block text-[11px] font-black text-wa-text-secondary/60 uppercase tracking-[0.25em] mb-4 px-2">Navigation</p>
          
          <NavTab active={adminTab === 'overview'} onClick={() => setAdminTab('overview')} label="Live Insights" icon={<LayoutDashboard size={20} />} />
          <NavTab active={adminTab === 'verify'} onClick={() => setAdminTab('verify')} label="Identity Gallery" icon={<ShieldCheck size={20} />} />
          <NavTab active={adminTab === 'manage'} onClick={() => setAdminTab('manage')} label="User Grid" icon={<UsersIcon size={20} />} />
          <NavTab active={adminTab === 'broadcast'} onClick={() => setAdminTab('broadcast')} label="Global Pulse" icon={<Megaphone size={20} />} />
          
          <div className="hidden md:block mt-auto p-4 bg-wa-primary/5 rounded-[24px] border border-wa-primary/10">
              <p className="text-[12px] font-bold text-wa-primary mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-wa-primary rounded-full animate-pulse" />
                <p className="text-[11px] text-wa-text-secondary font-medium">Encrypted Node Active</p>
              </div>
          </div>
        </motion.div>

        {/* Content Area with Fluid Transitions */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-wa relative">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-wa-primary uppercase">AUTH</div>
              </div>
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={adminTab}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3, ease: "circOut" as const }}
                className="max-w-6xl mx-auto"
              >
                {adminTab === 'overview' && <AdminOverview />}
                {adminTab === 'verify' && <AdminKYC />}
                {adminTab === 'manage' && <AdminUserManagement onStartChat={startChatWithUser} />}
                
                {/* Broadcast Section */}
                {adminTab === 'broadcast' && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 md:p-14 rounded-[40px] shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-wa-separator relative overflow-hidden group"
                  >
                    <div className="absolute top-[-50px] right-[-50px] p-10 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                      <Megaphone size={300} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[12px] font-black uppercase tracking-widest mb-6 border border-red-100">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                        Live Protocol
                      </div>
                      
                      <h3 className="text-[28px] md:text-[36px] font-black text-wa-text-primary tracking-tight mb-4 leading-tight">Internal Launch Protocol</h3>
                      <p className="text-[16px] text-wa-text-secondary max-w-2xl leading-relaxed mb-10 opacity-80">
                        Initiate a global announcement pulse across all active Socialize connections. 
                        This action is irreversible and will appear instantly on all user interfaces.
                      </p>
                      
                      <textarea 
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="Type your transmission message here..."
                        className="w-full h-56 p-8 bg-[#f8fbff] rounded-[32px] focus:outline-none focus:ring-4 focus:ring-wa-primary/10 text-[20px] font-medium resize-none transition-all border border-[#e2e8f0] focus:border-wa-primary/40 shadow-inner"
                      />
                      
                      <div className="mt-8 flex justify-end">
                        <button 
                          onClick={handleBroadcast}
                          disabled={!broadcastText.trim() || loading}
                          className="px-12 py-5 bg-wa-primary text-white rounded-[24px] font-black text-[18px] shadow-[0_20px_40px_rgba(0,128,105,0.25)] hover:shadow-[0_25px_50px_rgba(0,128,105,0.4)] disabled:opacity-50 transition-all flex items-center gap-4 active:scale-[0.96] group/btn"
                        >
                          {loading ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                          {loading ? 'Transmitting Pulse...' : 'Activate Announcement'}
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
      className={`relative flex items-center gap-4 px-5 py-5 rounded-[20px] text-[15px] font-bold transition-all duration-300 group ${
        active 
          ? 'bg-wa-primary text-white shadow-[0_15px_30px_rgba(0,128,105,0.25)]' 
          : 'bg-transparent text-wa-text-secondary hover:bg-white hover:shadow-md hover:translate-x-1'
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'text-wa-primary group-hover:scale-110'}`}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-indicator"
          className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
        />
      )}
    </button>
  )
}