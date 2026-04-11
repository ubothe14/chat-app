import { useEffect, useState } from 'react';
import { ShieldCheck, Image as ImageIcon, CheckCircle, XCircle, FileSearch, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI, type User } from '../../services/api_service';

export default function AdminKYC() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await userAPI.getPendingVerifications();
      setPendingUsers(data.pendingRequests);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, action: 'approve' | 'reject') => {
    try {
      await userAPI.verifyUser(userId, action);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      console.log(`User ${action}ed successfully`);
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="h-12 w-12 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
      <p className="text-[12px] font-black text-wa-primary uppercase tracking-widest">Scanning Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-[18px] font-black text-wa-text-primary uppercase tracking-tight">Identity Gallery</h3>
          <p className="text-[11px] text-wa-text-secondary font-bold uppercase tracking-widest opacity-60">Manual Validation Queue</p>
        </div>
        <div className="flex items-center gap-2 bg-wa-primary/5 px-4 py-2 rounded-2xl border border-wa-primary/10 shadow-sm">
          <div className="w-2 h-2 bg-wa-primary rounded-full animate-pulse" />
          <span className="text-wa-primary text-[12px] font-black">{pendingUsers.length} PENDING</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {pendingUsers.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/60 backdrop-blur-md p-16 rounded-[40px] border border-[#d1dce5] text-center shadow-inner"
          >
              <div className="w-24 h-24 bg-wa-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={48} className="text-wa-primary opacity-40" />
              </div>
              <h4 className="text-[20px] font-black text-wa-text-primary mb-2">Network Fully Integrated</h4>
              <p className="text-wa-text-secondary text-[14px] max-w-sm mx-auto leading-relaxed opacity-70">All identity verification requests have been processed. Node integrity is at 100%.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingUsers.map((user, idx) => (
              <motion.div 
                key={user._id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, type: "spring" as const, stiffness: 100 }}
                className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-xl border border-[#d1dce5] group hover:border-wa-primary transition-all duration-500 overflow-hidden relative"
              >
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-3xl overflow-hidden flex-shrink-0 bg-wa-bg-input shadow-inner border border-wa-separator">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-wa-text-muted"><FileSearch size={32} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-wa-text-primary text-[17px] truncate tracking-tight">{user.name}</h4>
                      <div className="h-1.5 w-1.5 rounded-full bg-wa-primary" />
                    </div>
                    <p className="text-[12px] text-wa-text-secondary font-medium truncate mb-6 opacity-70">{user.email}</p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5006';
                          const normalizedPath = user.idDocumentPath?.replace(/\\/g, '/');
                          const path = user.idDocumentPath?.startsWith('http') ? user.idDocumentPath : `${baseUrl}/${normalizedPath}`;
                          setPreviewImage(path);
                        }}
                        className="flex-1 py-3 bg-wa-bg-input hover:bg-wa-primary hover:text-white rounded-[16px] text-[13px] font-black flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-sm"
                      >
                        <ImageIcon size={16} />
                        Analyze ID
                      </button>
                      <button 
                        onClick={() => handleVerify(user._id!, 'approve')}
                        className="w-[50px] bg-wa-primary text-white rounded-[16px] flex items-center justify-center hover:shadow-[0_10px_20px_rgba(0,128,105,0.3)] transition-all duration-300 active:scale-95 group/check"
                      >
                        <CheckCircle size={20} className="group-hover/check:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => handleVerify(user._id!, 'reject')}
                        className="w-[50px] bg-red-500 text-white rounded-[16px] flex items-center justify-center hover:shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all duration-300 active:scale-95 group/x"
                      >
                        <XCircle size={20} className="group-hover/x:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 text-wa-primary opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                    <ShieldCheck size={120} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Premium Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" 
            onClick={() => setPreviewImage(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               transition={{ type: "spring" as const, stiffness: 200, damping: 25 }}
               className="relative max-w-full max-h-full bg-white rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col" 
               onClick={e => e.stopPropagation()}
             >
                <div className="flex-1 overflow-hidden bg-black flex items-center justify-center min-h-0 relative">
                  <img src={previewImage} className="max-w-full max-h-full object-contain pointer-events-none" />
                  
                  {/* Floating Close Button */}
                  <button 
                    onClick={() => setPreviewImage(null)} 
                    className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 transition-all active:scale-95"
                  >
                    <XCircle size={28} />
                  </button>
                </div>
                
                <div className="p-8 md:p-10 bg-white border-t border-wa-separator flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-wa-primary/10 rounded-2xl">
                        <ShieldCheck size={28} className="text-wa-primary" />
                      </div>
                      <div>
                        <p className="text-[18px] font-black text-wa-text-primary tracking-tight">Identity Compliance Verified</p>
                        <p className="text-[12px] text-wa-text-secondary font-bold uppercase tracking-widest opacity-60">Authentication Node Checksum 99.8%</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => window.open(previewImage, '_blank')} 
                     className="px-8 py-4 bg-wa-bg-input hover:bg-wa-primary hover:text-white text-wa-text-primary text-[14px] font-black rounded-[20px] transition-all flex items-center gap-2 group/link"
                   >
                     Inspect Original Asset
                     <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
