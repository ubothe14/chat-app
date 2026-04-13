import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { ShieldCheck, Activity, Database, Cpu, TrendingUp, MousePointer2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { userAPI } from '../../services/api_service';

export default function AdminOverview() {
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="h-12 w-12 border-4 border-wa-primary/20 border-t-wa-primary rounded-full animate-spin" />
      <p className="text-[12px] font-black text-wa-primary uppercase tracking-widest">Aggregating Logic...</p>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100 
      } 
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Premium Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <StatCard 
            label="Total Traversal" 
            value={stats?.totalHits} 
            icon={<MousePointer2 size={24} />} 
            trend={`Today: ${stats?.hitsToday}`}
            sub="Lifetime network hits"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="Registry Growth" 
            value={stats?.totalUsers} 
            icon={<UserPlus size={24} />} 
            color="text-blue-600"
            trend={`New: ${stats?.registrationsToday}`}
            sub="Total user database"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="Integrity Check" 
            value={`${stats?.verifiedUsers || 0}`} 
            icon={<ShieldCheck size={24} />} 
            trend={`Rejected: ${stats?.rejectedUsers || 0}`}
            sub="Verified accounts"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard 
            label="Active Flux" 
            value={stats?.activeUsers} 
            icon={<Activity size={24} />} 
            color="text-purple-600"
            sub="Users active (24h)"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-xl border border-[#d1dce5] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[18px] font-black text-wa-text-primary flex items-center gap-3">
              <TrendingUp size={20} className="text-wa-primary" />
              User Growth Velocity
            </h3>
            <div className="px-3 py-1 bg-wa-primary/10 text-wa-primary text-[10px] font-black rounded-full uppercase tracking-tighter">Live Loop</div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries?.registrations}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008069" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#008069" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="_id" hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #d1dce5', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#008069' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#008069" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Traffic Chart */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-xl border border-[#d1dce5] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[18px] font-black text-wa-text-primary flex items-center gap-3">
              <Activity size={20} className="text-blue-500" />
              Platform Traffic Pulse
            </h3>
            <div className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black rounded-full uppercase tracking-tighter">Real-time</div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseries?.activity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="_id" hide />
                <Tooltip 
                   contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #d1dce5', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]} 
                  animationDuration={2500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Hardware Health Status */}
      <motion.div variants={item} className="bg-white/40 backdrop-blur-sm p-8 rounded-[40px] border border-[#d1dce5] shadow-inner">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-[#d1dce5]">
            <Database size={20} className="text-wa-primary" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-wa-text-primary uppercase tracking-tight">Encrypted Instance Health</h3>
            <p className="text-[11px] text-wa-text-secondary font-bold uppercase tracking-widest opacity-60">Status: Optimized</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <HealthRow 
              label="Instance Uptime" 
              value={`${Math.floor(stats?.serverUptime / 3600)}h ${Math.floor((stats?.serverUptime % 3600) / 60)}m`} 
              icon={<Cpu size={16} />} 
            />
           <HealthRow 
              label="Memory Distribution" 
              value={`${Math.round(stats?.memoryUsage / 1024 / 1024)}MB`} 
              icon={<Database size={16} />} 
              progress={(stats?.memoryUsage / (512 * 1024 * 1024)) * 100} 
            />
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, trend, sub, color = 'text-wa-primary' }: any) {
  return (
    <div className="bg-white/90 backdrop-blur-md p-7 rounded-[38px] shadow-lg border border-[#d1dce5] group hover:border-wa-primary transition-all duration-500 cursor-default relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-wa-primary/5 rounded-full blur-3xl group-hover:bg-wa-primary/8 transition-all pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10 w-full mb-4">
        <div className={`w-11 h-11 flex items-center justify-center bg-wa-bg-input rounded-2xl group-hover:bg-wa-primary group-hover:text-white transition-all duration-500 ${color.replace('text-', 'text-opacity-90 text-')}`}>
          <div className="flex-shrink-0">
             {icon && typeof icon !== 'string' ? { ...icon, props: { ...icon.props, size: 20 } } : icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 bg-wa-primary/5 text-wa-primary text-[10px] font-black px-3 py-1.2 rounded-full border border-wa-primary/10 shadow-sm">
            <TrendingUp size={10} />
            {trend}
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex flex-col gap-0.5 mt-auto">
        <p className="text-wa-text-secondary text-[11px] font-black uppercase tracking-[0.2em] opacity-30 leading-none mb-1">{label}</p>
        <p className={`text-[25px] font-black tracking-tighter ${color} leading-none mb-1`}>{value ?? '-'}</p>
        <p className="text-[11px] text-wa-text-secondary font-bold opacity-40 italic leading-tight truncate">{sub}</p>
      </div>
    </div>
  );
}

function HealthRow({ label, value, icon, progress }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-[14px] items-center">
        <div className="flex items-center gap-4 text-wa-text-primary font-bold">
          <div className="w-9 h-9 flex items-center justify-center bg-white rounded-xl border border-wa-separator shadow-sm flex-shrink-0">
            {icon}
          </div>
          <span className="text-[15px] tracking-tight">{label}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-wa-primary font-black text-[16px]">{value}</span>
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-3 w-full bg-[#f1f5f9] rounded-full overflow-hidden p-0.5 border border-[#e2e8f0] shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-wa-primary to-blue-500 rounded-full shadow-[0_0_15px_rgba(15,116,255,0.3)]" 
          />
        </div>
      )}
    </div>
  );
}
