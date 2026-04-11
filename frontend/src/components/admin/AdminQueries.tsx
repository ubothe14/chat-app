import { useState, useEffect } from 'react';
import { Send, Clock, User, CheckCircle, AlertCircle, LifeBuoy, Search } from 'lucide-react';
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-280px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar List */}
      <div className="lg:w-1/3 flex flex-col gap-4">
         <div className="bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-wa-separator/10 shadow-sm flex items-center gap-3">
            <Search size={18} className="text-wa-text-muted" />
            <input 
              type="text" 
              placeholder="Filter by subject or user..." 
              className="bg-transparent border-none focus:outline-none text-[14px] w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>

         <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-wa">
            {filteredQueries.map(q => (
               <motion.button 
                 key={q._id}
                 onClick={() => setSelectedQuery(q)}
                 whileHover={{ x: 4 }}
                 className={`w-full text-left p-5 rounded-[24px] border transition-all duration-300 ${selectedQuery?._id === q._id ? 'bg-wa-primary text-white border-wa-primary shadow-lg' : 'bg-white/60 border-wa-separator/10 hover:bg-white/90'}`}
               >
                  <div className="flex justify-between items-center mb-2">
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${selectedQuery?._id === q._id ? 'bg-white/20' : 'bg-wa-primary/10 text-wa-primary'}`}>
                        {q.status}
                     </span>
                     <span className={`text-[10px] font-medium opacity-60 ${selectedQuery?._id === q._id ? 'text-white' : 'text-wa-text-secondary'}`}>
                        {new Date(q.createdAt).toLocaleDateString()}
                     </span>
                  </div>
                  <h4 className="font-bold text-[14px] truncate mb-1">{q.subject}</h4>
                  <p className={`text-[12px] truncate opacity-70 ${selectedQuery?._id === q._id ? 'text-white' : 'text-wa-text-secondary'}`}>
                     {typeof q.userId !== 'string' ? q.userId.name : 'Unknown User'}
                  </p>
               </motion.button>
            ))}
         </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md rounded-[40px] border border-wa-separator/10 shadow-xl overflow-hidden relative">
         <AnimatePresence mode="wait">
            {selectedQuery ? (
               <motion.div 
                 key={selectedQuery._id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex flex-col h-full"
               >
                  <div className="p-8 border-b border-wa-separator/10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-wa-bg-input">
                           {typeof selectedQuery.userId !== 'string' && selectedQuery.userId.avatar ? (
                             <img src={getFullImageUrl(selectedQuery.userId.avatar) || ''} className="w-full h-full object-cover" />
                           ) : <div className="w-full h-full flex items-center justify-center text-wa-text-muted bg-wa-primary/10"><User size={24}/></div>}
                        </div>
                        <div>
                           <h3 className="text-[18px] font-black text-wa-text-primary tracking-tight">{selectedQuery.subject}</h3>
                           <p className="text-[11px] font-bold text-wa-text-secondary uppercase tracking-widest">
                              {typeof selectedQuery.userId !== 'string' ? selectedQuery.userId.email : 'External Signal'}
                           </p>
                        </div>
                     </div>
                     <div className="hidden md:flex flex-col items-end">
                        <span className="text-[11px] font-black text-wa-text-secondary opacity-40 uppercase tracking-widest mb-1">Received At</span>
                        <div className="flex items-center gap-1.5 text-wa-text-primary font-bold text-[13px]">
                           <Clock size={14} className="text-wa-primary" />
                           {new Date(selectedQuery.createdAt).toLocaleString()}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                     <div className="bg-wa-bg-input/50 p-6 rounded-[32px] border border-wa-separator/10">
                        <div className="flex items-center gap-2 mb-4 text-wa-text-secondary">
                           <LifeBuoy size={16} />
                           <span className="text-[11px] font-black uppercase tracking-wider">User Transmission</span>
                        </div>
                        <p className="text-wa-text-primary text-[15px] leading-relaxed whitespace-pre-wrap">{selectedQuery.message}</p>
                     </div>

                     {selectedQuery.adminReply && (
                        <div className="bg-wa-primary/5 p-6 rounded-[32px] border border-wa-primary/20 relative overflow-hidden self-end max-w-[90%] ml-auto">
                           <div className="flex items-center gap-2 mb-4 text-wa-primary">
                              <CheckCircle size={16} />
                              <span className="text-[11px] font-black uppercase tracking-wider">Official Resolution</span>
                           </div>
                           <p className="text-wa-text-primary font-medium text-[15px] leading-relaxed italic">"{selectedQuery.adminReply}"</p>
                           <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                              <div className="text-[100px] font-black leading-none">✓</div>
                           </div>
                        </div>
                     )}
                  </div>

                  {!selectedQuery.adminReply && (
                     <div className="p-8 border-t border-wa-separator/10 bg-wa-bg-input/20">
                        <div className="relative group">
                           <textarea 
                             placeholder="Craft resolution response..." 
                             className="w-full bg-white px-6 py-5 rounded-[28px] border-none shadow-inner focus:ring-2 focus:ring-wa-primary/20 text-[14px] font-medium min-h-[140px] transition-all resize-none"
                             value={reply}
                             onChange={e => setReply(e.target.value)}
                           />
                           <button 
                             onClick={handleReply}
                             disabled={submitting || !reply}
                             className="absolute bottom-4 right-4 bg-wa-primary text-white p-4 rounded-2xl shadow-[0_10px_20px_rgba(0,128,105,0.2)] hover:shadow-[0_15px_30px_rgba(0,128,105,0.4)] transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none"
                           >
                              {submitting ? <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={24} />}
                           </button>
                        </div>
                     </div>
                  )}
               </motion.div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <div className="w-24 h-24 bg-wa-bg-input rounded-full flex items-center justify-center mb-6">
                     <AlertCircle size={48} className="text-wa-text-muted" />
                  </div>
                  <h3 className="text-[20px] font-black text-wa-text-primary mb-2">Select a transmission node</h3>
                  <p className="max-w-[320px] text-[14px] font-medium">Select a user query from the list to begin crafting an official resolution.</p>
               </div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
