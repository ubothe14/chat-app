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
    <div className="space-y-6 pb-10">
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md p-4 rounded-[28px] shadow-lg border border-[#d1dce5] flex items-center gap-4 group focus-within:border-wa-primary/40 transition-all duration-300"
      >
        <div className="p-2 bg-wa-bg-input rounded-xl group-focus-within:bg-wa-primary/10 transition-colors">
          <Search size={20} className="text-wa-text-muted group-focus-within:text-wa-primary transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search by name, email or pulse ID..." 
          className="flex-1 bg-transparent border-none focus:outline-none text-[16px] font-medium placeholder:text-wa-text-muted/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-wa-bg-input rounded-lg border border-wa-separator">
           <Hash size={12} className="text-wa-text-secondary" />
           <span className="text-[11px] font-black text-wa-text-secondary uppercase">{filteredUsers.length} Results</span>
        </div>
      </motion.div>

      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-[18px] font-black text-wa-text-primary uppercase tracking-tight">User Operations</h3>
          <p className="text-[11px] text-wa-text-secondary font-bold uppercase tracking-widest opacity-60">Global Directory Control</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="p-2 bg-white rounded-xl shadow-sm border border-wa-separator">
              <Activity size={16} className="text-wa-primary" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, idx) => (
            <motion.div 
              key={user._id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-xl border border-[#d1dce5] group hover:border-wa-primary/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                 <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-wa-bg-input border border-wa-separator shadow-inner">
                       {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-wa-text-muted"><ShieldCheck size={32} /></div>}
                    </div>
                    <motion.div 
                      initial={false}
                      animate={{ scale: user.isActive ? 1 : 1.2 }}
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${user.isActive ? 'bg-wa-primary' : 'bg-red-500'}`} 
                    />
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-black text-wa-text-primary text-[19px] tracking-tight truncate">{user.name}</h4>
                      {user.role === 'admin' ? (
                        <span className="bg-wa-primary text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest shadow-sm shadow-wa-primary/20">ADMIN</span>
                      ) : (
                        <span className="bg-wa-text-secondary/10 text-wa-text-secondary text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">BASE USER</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                       <div className="flex items-center gap-2 text-[13px] text-wa-text-secondary font-medium">
                          <Mail size={14} className="opacity-40" />
                          {user.email}
                       </div>
                       {user.verificationStatus === 'verified' && (
                         <div className="flex items-center gap-1.5 text-[13px] text-wa-primary font-bold">
                            <ShieldCheck size={14} />
                            Trust Level 1
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-3 lg:w-[420px]">
                    <ActionButton 
                       icon={<MessageSquare size={18} />} 
                       label="Transmit" 
                       onClick={() => onStartChat(user._id!)} 
                       variant="primary"
                    />
                    <ActionButton 
                       icon={user.role === 'admin' ? <UserMinus size={18} /> : <UserPlus size={18} />} 
                       label={user.role === 'admin' ? 'Demote' : 'Promote'} 
                       onClick={() => toggleUserRole(user)}
                    />
                    <ActionButton 
                       icon={user.isActive ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />} 
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
