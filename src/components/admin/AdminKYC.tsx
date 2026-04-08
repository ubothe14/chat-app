import { useEffect, useState } from 'react';
import { ShieldCheck, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-xl h-10 w-10 border-b-2 border-wa-primary"></div></div>;

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-wa-text-primary uppercase tracking-wider">Verification Queue</h3>
        <span className="bg-wa-primary/10 text-wa-primary text-[11px] font-bold px-2 py-0.5 rounded-full">{pendingUsers.length} Pending</span>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-wa-separator text-center">
            <ShieldCheck size={48} className="mx-auto text-wa-primary/20 mb-4" />
            <p className="text-wa-text-secondary text-[14px]">The queue is empty. All users are reviewed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingUsers.map(user => (
            <div key={user._id} className="bg-white p-4 rounded-2xl shadow-sm border border-wa-separator group hover:border-wa-primary transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-wa-bg-input">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-wa-text-muted"><ShieldCheck size={24} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-wa-text-primary truncate">{user.name}</h4>
                  <p className="text-[12px] text-wa-text-secondary truncate mb-3">{user.email}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5006';
                        const normalizedPath = user.idDocumentPath?.replace(/\\/g, '/');
                        const path = user.idDocumentPath?.startsWith('http') ? user.idDocumentPath : `${baseUrl}/${normalizedPath}`;
                        setPreviewImage(path);
                      }}
                      className="flex-1 py-1.5 bg-wa-bg-input hover:bg-wa-bg-hover rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ImageIcon size={14} />
                      Analyze ID
                    </button>
                    <button 
                      onClick={() => handleVerify(user._id!, 'approve')}
                      className="px-3 bg-wa-primary text-white rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button 
                      onClick={() => handleVerify(user._id!, 'reject')}
                      className="px-3 bg-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative max-w-full max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <img src={previewImage} className="max-w-[100vw] h-auto lg:max-h-[80vh] object-contain" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setPreviewImage(null)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-4 bg-white border-t flex justify-between items-center">
                 <p className="text-[13px] font-bold text-wa-text-primary">Government Identity Document</p>
                 <button onClick={() => window.open(previewImage, '_blank')} className="text-wa-primary text-[13px] font-bold hover:underline">Open Original</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
