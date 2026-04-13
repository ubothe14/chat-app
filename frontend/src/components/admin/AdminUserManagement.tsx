import { useEffect, useState } from 'react';
import { Search, UserPlus, UserMinus, ShieldAlert, MessageSquare, ShieldCheck, Mail, Activity, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI, type User } from '../../services/api_service';

interface AdminUserManagementProps {
    onStartChat: (userId: string) => void;
}

export default function AdminUserManagement({ onStartChat }: AdminUserManagementProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAllUsersAdmin({ limit: 50 });
      setAllUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await userAPI.updateUserStatus(user._id!, !user.isActive);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleUserRole = async (user: User) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await userAPI.updateUserRole(user._id!, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="h-12 w-12 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
      <p className="text-[12px] font-black text-wa-primary uppercase tracking-widest">Indexing Database...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-[#d1dce5] flex items-center gap-6 group focus-within:border-wa-primary/40 transition-all duration-300"
      >
        <div className="w-14 h-14 flex items-center justify-center bg-wa-bg-input rounded-2xl group-focus-within:bg-wa-primary/10 transition-colors">
          <Search size={24} className="text-wa-text-muted group-focus-within:text-wa-primary transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search by name, email or pulse ID..." 
          className="flex-1 bg-transparent border-none focus:outline-none text-[18px] font-bold placeholder:text-wa-text-muted/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-wa-bg-input rounded-xl border border-wa-separator/40">
           <Hash size={14} className="text-wa-text-secondary opacity-40" />
           <span className="text-[12px] font-black text-wa-text-secondary uppercase tracking-widest">{filteredUsers.length} Operational Nodes</span>
        </div>
      </motion.div>

      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-[22px] md:text-[26px] font-black text-wa-text-primary uppercase tracking-tight leading-none">User Operations</h3>
          <p className="text-[11px] text-wa-text-secondary/50 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-wa-primary rounded-full" />
            Global Directory Control
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="p-3 bg-white rounded-2xl shadow-sm border border-wa-separator/40">
              <Activity size={20} className="text-wa-primary animate-pulse" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, idx) => (
            <motion.div 
              key={user._id} 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white p-8 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-[#d1dce5] group hover:border-wa-primary/30 hover:shadow-[0_25px_80px_rgba(0,0,0,0.06)] transition-all duration-500 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
                 <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-[30px] overflow-hidden bg-[#f8fafc] border border-wa-separator shadow-inner group-hover:border-wa-primary/20 transition-colors">
                       {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-wa-text-muted bg-wa-primary/5"><ShieldCheck size={36} /></div>}
                    </div>
                    <motion.div 
                      initial={false}
                      animate={{ scale: user.isActive ? 1 : 1.2 }}
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${user.isActive ? 'bg-wa-primary' : 'bg-red-500'}`} 
                    />
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-black text-wa-text-primary text-[22px] tracking-tight truncate leading-tight">{user.name}</h4>
                      {user.role === 'admin' ? (
                        <span className="bg-wa-primary text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-[0.2em] shadow-lg shadow-wa-primary/20">ADMIN HUB</span>
                      ) : (
                        <span className="bg-wa-bg-input text-wa-text-secondary text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-[0.2em]">BASE NODE</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                       <div className="flex items-center gap-2.5 text-[14px] text-wa-text-secondary font-bold">
                          <Mail size={16} className="opacity-30" />
                          {user.email}
                       </div>
                       {user.verificationStatus === 'verified' && (
                         <div className="flex items-center gap-2 text-[14px] text-wa-primary font-black uppercase tracking-widest bg-wa-primary/5 px-3 py-1 rounded-full border border-wa-primary/10">
                            <ShieldCheck size={14} />
                            Verified
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-4 lg:w-[460px]">
                    <ActionButton 
                       icon={<MessageSquare size={20} />} 
                       label="Transmit" 
                       onClick={() => onStartChat(user._id!)} 
                       variant="primary"
                    />
                    <ActionButton 
                       icon={user.role === 'admin' ? <UserMinus size={20} /> : <UserPlus size={20} />} 
                       label={user.role === 'admin' ? 'Demote' : 'Promote'} 
                       onClick={() => toggleUserRole(user)}
                    />
                    <ActionButton 
                       icon={user.isActive ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />} 
                       label={user.isActive ? 'Freeze' : 'Restore'} 
                       onClick={() => toggleUserStatus(user)}
                       variant={user.isActive ? 'danger' : 'success'}
                    />
                 </div>
              </div>

              {/* Decorative Background Accent */}
              <div className="absolute top-0 right-[-10%] w-[20%] h-full bg-wa-primary/[0.02] -skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-1000" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = 'default' }: any) {
  const variants = {
    default: 'bg-wa-bg-input text-wa-text-primary hover:bg-wa-primary hover:text-white',
    primary: 'bg-wa-primary text-white shadow-[0_10px_20px_rgba(0,128,105,0.2)] hover:shadow-[0_15px_30px_rgba(0,128,105,0.4)]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white',
    success: 'bg-wa-primary/10 text-wa-primary hover:bg-wa-primary hover:text-white',
  };

  return (
    <motion.button 
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-[20px] text-[13px] font-black uppercase tracking-tight transition-all duration-300 ${variants[variant as keyof typeof variants]}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
