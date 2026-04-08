import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Users, MessageSquare, ShieldCheck, Activity, Database, Cpu } from 'lucide-react';
import { userAPI } from '../../services/api_service';

interface AdminOverviewProps {}

export default function AdminOverview({}: AdminOverviewProps) {
  const [stats, setStats] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, tsData] = await Promise.all([
          userAPI.getAdminDashboardStats(),
          userAPI.getAdminTimeseriesStats()
        ]);
        setStats(statsData);
        setTimeseries(tsData);
      } catch (err) {
        console.error('Failed to fetch overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-xl h-10 w-10 border-b-2 border-wa-primary"></div></div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Users" 
          value={stats?.totalUsers} 
          icon={<Users className="text-wa-primary" size={20} />} 
          trend="+5%" 
        />
        <StatCard 
          label="Active (24h)" 
          value={stats?.activeUsers} 
          icon={<Activity className="text-blue-500" size={20} />} 
          color="text-blue-600"
        />
        <StatCard 
          label="Verification" 
          value={`${stats?.verifiedUsers || 0}/${stats?.totalUsers || 0}`} 
          icon={<ShieldCheck className="text-wa-primary" size={20} />} 
        />
        <StatCard 
          label="Messages" 
          value={stats?.totalMessages} 
          icon={<MessageSquare className="text-purple-500" size={20} />} 
        />
      </div>

      {/* Charts Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-wa-separator">
        <h3 className="text-[15px] font-bold text-wa-text-primary mb-4 flex items-center gap-2">
          <Activity size={18} className="text-wa-primary" />
          User Growth
        </h3>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries?.registrations}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008069" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#008069" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="_id" hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelClassName="text-wa-text-secondary text-[12px]"
              />
              <Area type="monotone" dataKey="count" stroke="#008069" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-wa-separator">
        <h3 className="text-[15px] font-bold text-wa-text-primary mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-wa-primary" />
          Platform Traffic
        </h3>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeseries?.activity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="_id" hide />
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
              <Bar dataKey="count" fill="#008069" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Server Health */}
      <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-wa-separator">
        <h3 className="text-[14px] font-bold text-wa-text-primary mb-4 flex items-center gap-2">
          <Database size={16} className="text-wa-primary" />
          System Health
        </h3>
        <div className="space-y-4">
           <HealthRow 
              label="Backend Uptime" 
              value={`${Math.floor(stats?.serverUptime / 3600)}h ${Math.floor((stats?.serverUptime % 3600) / 60)}m`} 
              icon={<Cpu size={14} />} 
            />
           <HealthRow 
              label="Memory Usage" 
              value={`${Math.round(stats?.memoryUsage / 1024 / 1024)}MB`} 
              icon={<Database size={14} />} 
              progress={(stats?.memoryUsage / (256 * 1024 * 1024)) * 100} 
            />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color = 'text-wa-primary' }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-wa-separator group hover:border-wa-primary transition-all cursor-default">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-wa-bg-input rounded-xl group-hover:bg-wa-primary group-hover:bg-opacity-10 transition-colors">
          {icon}
        </div>
        {trend && <span className="text-[11px] font-bold text-wa-primary bg-wa-primary/10 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="text-wa-text-secondary text-[11px] font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-[20px] font-black ${color}`}>{value ?? '-'}</p>
    </div>
  );
}

function HealthRow({ label, value, icon, progress }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[13px]">
        <div className="flex items-center gap-2 text-wa-text-secondary">
          {icon}
          {label}
        </div>
        <span className="font-mono text-wa-primary font-bold">{value}</span>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full bg-wa-bg-input rounded-full overflow-hidden">
          <div 
            className="h-full bg-wa-primary transition-all duration-1000" 
            style={{ width: `${Math.min(progress, 100)}%` }} 
          />
        </div>
      )}
    </div>
  );
}
