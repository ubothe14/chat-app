import React from 'react'
import { X, Video, PhoneOff } from 'lucide-react'

interface CallOverlayProps {
  type: 'incoming' | 'outgoing'
  userName: string
  userAvatar?: string
  onAccept?: () => void
  onDecline: () => void
}

const CallOverlay: React.FC<CallOverlayProps> = ({ type, userName, userAvatar, onAccept, onDecline }) => {
  const isIncoming = type === 'incoming'

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300 ${isIncoming ? 'bg-emerald-900/40' : 'bg-slate-900/40'}`}>
      <div className="w-full max-w-[400px] glass-panel rounded-[40px] overflow-hidden p-10 flex flex-col items-center text-center shadow-[0_32px_120px_rgba(0,0,0,0.3)] border-white/40 relative">
        
        {/* Connection Status Label */}
        <div className="mb-8">
          <div className={`flex items-center gap-2 px-4 py-1 rounded-full ${isIncoming ? 'bg-emerald-500/20 text-emerald-600' : 'bg-wa-primary/10 text-wa-primary'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isIncoming ? 'bg-emerald-500' : 'bg-wa-primary'}`} />
            <span className="font-black tracking-[1.5px] uppercase text-[11px]">
              {isIncoming ? 'Incoming Invitation' : 'Secure Connection Outgoing'}
            </span>
          </div>
        </div>

        {/* User Avatar with Enhanced Pulse */}
        <div className="relative mb-8">
          <div className={`absolute inset-[-20px] rounded-full animate-ping opacity-20 ${isIncoming ? 'bg-emerald-400' : 'bg-wa-primary'}`} />
          <div className={`absolute inset-[-40px] rounded-full animate-pulse opacity-10 ${isIncoming ? 'bg-emerald-400' : 'bg-wa-primary'}`} />
          
          <div className={`w-[140px] h-[140px] rounded-full p-[4px] relative z-10 ${isIncoming ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : 'bg-gradient-to-tr from-wa-primary via-blue-400 to-wa-primary'}`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-white border-[6px] border-white shadow-xl">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-[48px] font-bold ${isIncoming ? 'text-emerald-500 bg-emerald-50' : 'text-wa-primary bg-slate-50'}`}>
                  {userName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div className={`absolute -bottom-1 -right-1 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white z-20 ${isIncoming ? 'bg-emerald-500 text-white' : 'bg-wa-primary text-white'}`}>
            {isIncoming ? (
              <Video size={24} />
            ) : (
              <div className="animate-spin-slow">
                <Video size={20} className="animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* User Branding */}
        <h2 className="text-[32px] font-black text-slate-900 mb-2 tracking-tight line-clamp-1">{userName}</h2>
        <div className="h-1 w-12 bg-wa-separator rounded-full mb-6 mx-auto" />
        <p className="text-slate-500 text-[16px] font-medium mb-12 px-4 leading-relaxed">
          {isIncoming ? `${userName} is inviting you to a premium video call` : 'Encrypted connection in progress...'}
        </p>

        {/* Dynamic Buttons */}
        <div className="flex items-center gap-8 w-full justify-center">
          {isIncoming ? (
            <>
              <button 
                onClick={onDecline}
                className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 group"
                title="Decline"
              >
                <X size={32} />
              </button>
              <button 
                onClick={onAccept}
                className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-600 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all active:scale-95"
                title="Accept"
              >
                <Video size={36} fill="white" />
              </button>
            </>
          ) : (
            <button 
              onClick={onDecline}
              className="px-10 py-5 rounded-full bg-red-500 text-white font-bold shadow-[0_20px_40px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:shadow-red-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3"
            >
              <PhoneOff size={20} />
              Cancel Call
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallOverlay
