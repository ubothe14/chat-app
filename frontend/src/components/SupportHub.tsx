import { useState, useEffect } from 'react';
import { LifeBuoy, Send, MessageCircle, Clock, CheckCircle, ShieldQuestion, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { queryAPI, type SupportQuery } from '../services/api_service';

export default function SupportHub() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const data = await queryAPI.getMyQueries();
      setQueries(data.queries);
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setSubmitting(true);
    try {
      await queryAPI.submitQuery(subject, message);
      setSubject('');
      setMessage('');
      setSuccess(true);
      fetchQueries();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-wa-separator/10 bg-white/50 backdrop-blur-md">
        <h2 className="text-[22px] font-black text-wa-text-primary tracking-tight">Support Hub</h2>
        <p className="text-[12px] text-wa-text-secondary font-bold uppercase tracking-widest opacity-60">Resolution Node: ACTIVE</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* New Query Form */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-xl border border-wa-separator/10 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-wa-primary/10 rounded-2xl text-wa-primary">
                <ShieldQuestion size={22} />
              </div>
              <h3 className="font-black text-wa-text-primary text-[17px]">Open New Ticket</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Subject (e.g., Account Verification)" 
                  className="w-full bg-wa-bg-input px-5 py-4 rounded-2xl border-none focus:ring-2 focus:ring-wa-primary/20 text-[14px] font-medium"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea 
                  placeholder="Describe your issue in detail..." 
                  className="w-full bg-wa-bg-input px-5 py-4 rounded-2xl border-none focus:ring-2 focus:ring-wa-primary/20 text-[14px] font-medium min-h-[120px] resize-none"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-black transition-all duration-300 ${success ? 'bg-green-500 text-white' : 'bg-wa-primary text-white hover:shadow-[0_10px_20px_rgba(0,128,105,0.3)] active:scale-[0.98]'}`}
              >
                {success ? <CheckCircle size={18} /> : (submitting ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={18} />)}
                {success ? 'Ticket Dispatched' : (submitting ? 'Transmitting...' : 'Dispatch Ticket')}
              </button>
            </form>
          </div>
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <HelpCircle size={150} />
          </div>
        </motion.div>

        {/* Previous Queries */}
        <div className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[14px] font-black text-wa-text-primary uppercase tracking-widest opacity-70">Active History</h3>
            <span className="text-[11px] font-black text-wa-primary bg-wa-primary/10 px-2.5 py-1 rounded-full">{queries.length} TICKETS</span>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex justify-center py-10 opacity-30">
                <div className="animate-spin h-6 w-6 border-2 border-wa-primary border-t-transparent rounded-full" />
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-12 bg-white/40 rounded-[32px] border border-dashed border-wa-separator/20">
                 <LifeBuoy size={40} className="mx-auto text-wa-text-muted opacity-20 mb-3" />
                 <p className="text-[13px] font-bold text-wa-text-secondary opacity-60 px-6 italic">No active transmission logs detected.</p>
              </div>
            ) : (
              queries.map((q, idx) => (
                <motion.div 
                  key={q._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/60 hover:bg-white/80 backdrop-blur-md p-5 rounded-[28px] border border-wa-separator/10 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${q.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-wa-primary/10 text-wa-primary'}`}>
                      {q.status}
                    </span>
                    <span className="text-[11px] text-wa-text-secondary font-medium opacity-50 flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-black text-wa-text-primary text-[15px] mb-2">{q.subject}</h4>
                  <p className="text-[13px] text-wa-text-secondary leading-relaxed mb-4 line-clamp-2">{q.message}</p>
                  
                  {q.adminReply && (
                    <div className="mt-4 p-4 bg-wa-primary/[0.03] rounded-2xl border-l-[3px] border-wa-primary relative overflow-hidden">
                       <div className="flex items-center gap-2 mb-2 text-wa-primary">
                          <MessageCircle size={14} />
                          <span className="text-[11px] font-black uppercase tracking-wider">Official Response</span>
                       </div>
                       <p className="text-[13px] text-wa-text-primary font-medium italic">{q.adminReply}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
