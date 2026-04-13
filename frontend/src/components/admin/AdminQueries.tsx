import { useState, useEffect } from 'react';
import { Send, Clock, User, CheckCircle, AlertCircle, LifeBuoy, Search, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { queryAPI, getFullImageUrl, type SupportQuery } from '../../services/api_service';

export default function AdminQueries() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const data = await queryAPI.getAllQueriesAdmin();
      setQueries(data.queries);
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedQuery || !reply || !selectedQuery._id) return;
    setSubmitting(true);
    try {
      await queryAPI.replyToQuery(selectedQuery._id, reply);
      setReply('');
      setSelectedQuery(null);
      fetchQueries();
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueries = queries.filter(q => 
    q.subject.toLowerCase().includes(search.toLowerCase()) || 
    (typeof q.userId !== 'string' && q.userId.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="h-12 w-12 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
      <p className="text-[12px] font-black text-wa-primary uppercase tracking-widest">Accessing Logs...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between px-2 flex-shrink-0">
        <div>
          <h3 className="text-[22px] md:text-[26px] font-black text-wa-text-primary uppercase tracking-tight leading-none">Resolution Terminal</h3>
          <p className="text-[11px] text-wa-text-secondary/50 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-wa-primary rounded-full" />
            Active User Signals
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-wa-separator/40 shadow-sm">
           <LifeBuoy size={18} className="text-wa-primary animate-spin-slow" />
           <span className="text-[12px] font-black text-wa-text-secondary uppercase tracking-widest">{filteredQueries.length} Total Signals</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-320px)] gap-8">
        {/* Sidebar List */}
        <div className="lg:w-[380px] flex flex-col gap-5 flex-shrink-0">
           <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[28px] border border-[#d1dce5] shadow-lg flex items-center gap-4 group focus-within:border-wa-primary/40 transition-all duration-300">
              <Search size={20} className="text-wa-text-muted" />
              <input 
                type="text" 
                placeholder="Filter by subject or user..." 
                className="bg-transparent border-none focus:outline-none text-[15px] font-bold w-full placeholder:text-wa-text-muted/30"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-wa">
              <AnimatePresence mode="popLayout">
                {filteredQueries.map(q => (
                   <motion.button 
                     key={q._id}
                     onClick={() => setSelectedQuery(q)}
                     whileHover={{ x: 6 }}
                     className={`w-full text-left p-6 rounded-[32px] border transition-all duration-500 relative overflow-hidden ${selectedQuery?._id === q._id ? 'bg-wa-primary text-white border-wa-primary shadow-[0_20px_40px_rgba(0,128,105,0.2)]' : 'bg-white border-[#d1dce5] hover:border-wa-primary/30 hover:shadow-xl'}`}
                   >
                      <div className="flex justify-between items-center mb-3">
                         <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg ${selectedQuery?._id === q._id ? 'bg-white/20' : 'bg-wa-primary/10 text-wa-primary'}`}>
                            {q.status}
                         </span>
                         <span className={`text-[10px] font-bold opacity-40 uppercase tracking-widest ${selectedQuery?._id === q._id ? 'text-white' : 'text-wa-text-secondary'}`}>
                            {new Date(q.createdAt).toLocaleDateString()}
                         </span>
                      </div>
                      <h4 className="font-black text-[16px] truncate mb-1.5 tracking-tight">{q.subject}</h4>
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${selectedQuery?._id === q._id ? 'bg-white/40' : 'bg-wa-primary/30'}`} />
                         <p className={`text-[12px] font-bold truncate opacity-60 uppercase tracking-widest ${selectedQuery?._id === q._id ? 'text-white' : 'text-wa-text-secondary'}`}>
                            {typeof q.userId !== 'string' ? q.userId.name : 'Unknown Hub'}
                         </p>
                      </div>
                   </motion.button>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col bg-white rounded-[48px] border border-[#d1dce5] shadow-[0_30px_80px_rgba(0,0,0,0.05)] overflow-hidden relative">
           <AnimatePresence mode="wait">
              {selectedQuery ? (
                 <motion.div 
                   key={selectedQuery._id}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   className="flex flex-col h-full"
                 >
                    <div className="p-10 border-b border-wa-separator/40 flex items-center justify-between bg-[#f8fafc]/50">
                       <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-white shadow-inner border border-wa-separator">
                             {typeof selectedQuery.userId !== 'string' && selectedQuery.userId.avatar ? (
                               <img src={getFullImageUrl(selectedQuery.userId.avatar) || ''} className="w-full h-full object-cover" />
                             ) : <div className="w-full h-full flex items-center justify-center text-wa-text-muted bg-wa-primary/5"><User size={32}/></div>}
                          </div>
                          <div>
                             <h3 className="text-[22px] font-black text-wa-text-primary tracking-tight leading-tight">{selectedQuery.subject}</h3>
                             <p className="text-[12px] font-bold text-wa-text-secondary/50 uppercase tracking-[0.2em] mt-1">
                                Transmission Origin: {typeof selectedQuery.userId !== 'string' ? selectedQuery.userId.email : 'External Signal'}
                             </p>
                          </div>
                       </div>
                       <div className="hidden md:flex flex-col items-end">
                          <span className="text-[10px] font-black text-wa-text-secondary opacity-30 uppercase tracking-[0.3em] mb-2">Timestamp Logged</span>
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-wa-separator/40 shadow-sm text-wa-text-primary font-bold text-[13px]">
                             <Clock size={16} className="text-wa-primary" />
                             {new Date(selectedQuery.createdAt).toLocaleString()}
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-wa">
                       <div className="bg-[#f8fafc] p-8 rounded-[40px] border border-wa-separator/40 relative overflow-hidden group">
                          <div className="flex items-center gap-2.5 mb-6 text-wa-text-secondary">
                             <LifeBuoy size={18} className="opacity-40" />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Incoming Transmission</span>
                          </div>
                          <p className="text-wa-text-primary text-[17px] leading-relaxed whitespace-pre-wrap font-medium">{selectedQuery.message}</p>
                          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                             <LifeBuoy size={160} />
                          </div>
                       </div>

                       {selectedQuery.adminReply && (
                          <div className="bg-wa-primary/5 p-8 rounded-[40px] border border-wa-primary/20 relative overflow-hidden self-end max-w-[90%] ml-auto group/reply">
                             <div className="flex items-center gap-2.5 mb-6 text-wa-primary">
                                <CheckCircle size={18} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Official Command Resolution</span>
                             </div>
                             <p className="text-wa-text-primary font-bold text-[17px] leading-relaxed italic">"{selectedQuery.adminReply}"</p>
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-wa-primary/20" />
                             <div className="absolute -top-10 -right-10 p-4 opacity-[0.05] pointer-events-none group-hover/reply:rotate-12 transition-transform duration-1000">
                                <ShieldCheck size={180} />
                             </div>
                          </div>
                       )}
                    </div>

                    {!selectedQuery.adminReply && (
                       <div className="p-10 border-t border-wa-separator/40 bg-[#f8fafc]/50">
                          <div className="relative">
                             <textarea 
                               placeholder="Craft an official resolution response for this signal..." 
                               className="w-full bg-white px-8 py-7 rounded-[36px] border border-wa-separator/40 shadow-xl focus:ring-8 focus:ring-wa-primary/5 text-[16px] font-bold min-h-[160px] transition-all resize-none placeholder:text-wa-text-muted/30"
                               value={reply}
                               onChange={e => setReply(e.target.value)}
                             />
                             <button 
                               onClick={handleReply}
                               disabled={submitting || !reply}
                               className="absolute bottom-6 right-6 bg-wa-primary text-white p-5 rounded-2xl shadow-[0_15px_35px_rgba(0,128,105,0.3)] hover:shadow-[0_20px_50px_rgba(0,128,105,0.5)] transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none flex items-center justify-center"
                             >
                                {submitting ? <div className="animate-spin h-7 w-7 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={28} />}
                             </button>
                          </div>
                       </div>
                    )}
                 </motion.div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                    <div className="w-32 h-32 bg-[#f8fafc] rounded-full flex items-center justify-center mb-10 shadow-inner border border-wa-separator/40">
                       <AlertCircle size={64} className="text-wa-text-muted opacity-20" />
                    </div>
                    <h3 className="text-[24px] font-black text-wa-text-primary mb-3 uppercase tracking-tight leading-none">Awaiting Signal Selection</h3>
                    <p className="max-w-[360px] text-[15px] font-bold text-wa-text-secondary/50 uppercase tracking-widest leading-relaxed">Select a user transmission node from the directory to begin the official resolution protocol.</p>
                 </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
