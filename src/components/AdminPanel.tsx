import { useState, lazy, Suspense } from 'react'
import { LayoutDashboard, ShieldCheck, Megaphone, RefreshCw, Send } from 'lucide-react'
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
    <div className="flex flex-col h-full bg-[#f8fbff] overflow-hidden">
      {/* Premium Header */}
      <div className="h-[90px] bg-wa-primary text-white px-8 flex items-center justify-between flex-shrink-0 shadow-lg z-10">
        <div>
          <h1 className="text-[26px] font-bold font-display tracking-tight uppercase">Admin Panel</h1>
        </div>
        <button onClick={() => window.location.reload()} className="p-3 hover:bg-white/10 rounded-2xl transition-all group active:scale-95 bg-white/5 border border-white/10">
          <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Elite Sub-Nav (Left Rail) */}
        <div className="w-[260px] bg-white border-r border-wa-separator flex flex-col p-4 gap-2 shadow-sm z-0">
          <p className="text-[11px] font-black text-wa-text-secondary uppercase tracking-widest mb-2 px-2">Dashboard</p>
          <NavTab active={adminTab === 'overview'} onClick={() => setAdminTab('overview')} label="Overview" icon={<LayoutDashboard size={20} />} />
          <NavTab active={adminTab === 'verify'} onClick={() => setAdminTab('verify')} label="Identity Verification" icon={<ShieldCheck size={20} />} />
          <NavTab active={adminTab === 'manage'} onClick={() => setAdminTab('manage')} label="User Management" icon={<Users size={20} />} />
          <NavTab active={adminTab === 'broadcast'} onClick={() => setAdminTab('broadcast')} label="Global Broadcast" icon={<Megaphone size={20} />} />
          <div className="mt-auto border-t pt-4 px-2">
            <p className="text-[12px] text-wa-text-secondary font-medium">Node ID: <span className="text-wa-primary font-bold">ADM-01</span></p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fbff] scroll-smooth">
          <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wa-primary"></div></div>}>
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {adminTab === 'overview' && <AdminOverview />}
                {adminTab === 'verify' && <AdminKYC />}
                {adminTab === 'manage' && <AdminUserManagement onStartChat={startChatWithUser} />}
                {adminTab === 'broadcast' && (
                  <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-wa-separator space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                      <Megaphone size={240} />
                    </div>
                    <div>
                      <h3 className="text-[24px] font-bold text-wa-text-primary mb-2">Internal Launch Protocol</h3>
                      <p className="text-[15px] text-wa-text-secondary max-w-xl leading-relaxed">Initiate a global announcement pulse across all active Socialize connections. Use this for critical maintenance or platform updates.</p>
                    </div>
                    <textarea 
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="Enter the transmission content..."
                      className="w-full h-48 p-6 bg-wa-bg-input rounded-3xl focus:outline-none focus:ring-4 focus:ring-wa-primary/10 text-[18px] resize-none transition-all border border-transparent focus:border-wa-primary/30"
                    />
                    <button 
                      onClick={handleBroadcast}
                      disabled={!broadcastText.trim() || loading}
                      className="w-full py-5 bg-wa-primary text-white rounded-3xl font-black text-[18px] hover:shadow-[0_20px_50px_rgba(0,128,105,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                    >
                      {loading ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} />}
                      {loading ? 'Transmitting Pulse...' : 'Activate Announcement'}
                    </button>
                  </div>
                )}
              </div>
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
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold transition-all ${active ? 'bg-wa-primary text-white shadow-xl shadow-wa-primary/20 scale-[1.02]' : 'bg-transparent text-wa-text-secondary hover:bg-wa-bg-input'}`}
    >
      <span className={active ? 'text-white' : 'text-wa-primary'}>{icon}</span>
      {label}
    </button>
  )
}

// Sub-component Users icon if not imported
function Users({ size }: { size: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
}