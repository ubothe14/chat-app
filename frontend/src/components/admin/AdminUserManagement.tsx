import { useEffect, useState } from 'react';
import { Search, UserPlus, UserMinus, ShieldAlert, MessageSquare, ShieldCheck, Mail } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-xl h-10 w-10 border-b-2 border-wa-primary"></div></div>;

  return (
    <div className="space-y-4 pb-10">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-wa-separator flex items-center gap-3">
        <Search size={18} className="text-wa-text-muted ml-1" />
        <input 
          type="text" 
          placeholder="Search by name, email or phone..." 
          className="flex-1 bg-transparent border-none focus:outline-none text-[14px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-wa-text-primary uppercase tracking-wider">User Management</h3>
        <span className="bg-wa-primary/10 text-wa-primary text-[11px] font-bold px-2 py-0.5 rounded-full">{allUsers.length} Records</span>
      </div>

      <div className="space-y-3">
        {filteredUsers.map(user => (
          <div key={user._id} className="bg-white p-4 rounded-2xl shadow-sm border border-wa-separator group hover:border-wa-primary transition-all">
            <div className="flex items-center gap-4 mb-4">
               <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-wa-bg-input">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-wa-text-muted"><ShieldCheck size={24} /></div>}
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${user.isActive ? 'bg-wa-primary' : 'bg-red-500'}`} />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-wa-text-primary truncate">{user.name}</h4>
                    {user.role === 'admin' && <span className="bg-wa-primary text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">MOD</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-wa-text-secondary truncate">
                      <Mail size={10} /> {user.email}
                    </span>
                    {user.verificationStatus === 'verified' && (
                      <span className="flex items-center gap-1 text-[11px] text-wa-primary font-bold">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
               </div>
            </div>

            <div className="flex gap-2">
               <ActionButton 
                  icon={<MessageSquare size={14} />} 
                  label="Private Chat" 
                  onClick={() => onStartChat(user._id!)} 
                  variant="primary"
               />
               <ActionButton 
                  icon={user.role === 'admin' ? <UserMinus size={14} /> : <UserPlus size={14} />} 
                  label={user.role === 'admin' ? 'Demote' : 'Promote'} 
                  onClick={() => toggleUserRole(user)}
               />
               <ActionButton 
                  icon={user.isActive ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />} 
                  label={user.isActive ? 'Suspend' : 'Activate'} 
                  onClick={() => toggleUserStatus(user)}
                  variant={user.isActive ? 'danger' : 'success'}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = 'default' }: any) {
  const variants = {
    default: 'bg-wa-bg-input text-wa-text-primary hover:bg-wa-bg-hover',
    primary: 'bg-wa-primary text-white hover:shadow-lg hover:shadow-wa-primary/20',
    danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white',
    success: 'bg-wa-primary/10 text-wa-primary hover:bg-wa-primary hover:text-white',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[12px] font-bold transition-all duration-200 ${variants[variant as keyof typeof variants]}`}
    >
      {icon}
      {label}
    </button>
  );
}
