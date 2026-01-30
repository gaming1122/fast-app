
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '01', count: 420 }, { name: '02', count: 380 }, { name: '03', count: 650 },
  { name: '04', count: 890 }, { name: '05', count: 520 }, { name: '06', count: 1050 }, { name: '07', count: 1240 },
];

const DashboardView: React.FC = () => {
  const [totalBottles, setTotalBottles] = useState(12482);
  const [totalNodes, setTotalNodes] = useState(1240);

  useEffect(() => {
    const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
    const users = Object.values(db.USER).map((u: any) => u.profile);
    if (users.length > 0) {
      const btlCount = users.reduce((acc: number, u: any) => acc + u.bottles, 0);
      setTotalBottles(btlCount > 0 ? btlCount : 12482);
      setTotalNodes(users.length > 0 ? users.length : 1240);
    }
  }, []);

  const carbonSaved = (totalBottles * 0.25).toFixed(1);

  return (
    <div className="space-y-6 md:space-y-12 animate-in slide-in-from-bottom-6 duration-700 w-full">
      {/* Stat Grid: Optimized for Desktop (4-column standard, 2 on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4 md:gap-8 xl:gap-12">
        <StatCard label="Recycled Bottles" value={totalBottles.toLocaleString()} icon="fa-recycle" color="text-emerald-500" />
        <StatCard label="Network Nodes" value={totalNodes.toLocaleString()} icon="fa-network-wired" color="text-indigo-500" />
        <StatCard label="Carbon Offset" value={`${carbonSaved}kg`} icon="fa-wind" color="text-orange-500" />
        <StatCard label="System Uptime" value="99.99%" icon="fa-bolt" color="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10 xl:gap-12">
        {/* Main Graph Area */}
        <div className="xl:col-span-2 bg-[#0f1115] p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 glass shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 md:mb-12">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">Community Impact Vector</h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time recycling data stream</p>
            </div>
            <div className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl mono ring-1 ring-emerald-500/20">+34.2% PERFORMANCE</div>
          </div>
          <div className="h-64 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '11px'}} 
                  cursor={{stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fill="url(#colorIn)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Health / Sector Status */}
        <div className="bg-[#0f1115] p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 glass shadow-2xl">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-10 md:mb-12 tracking-tighter uppercase">Machine Topology</h3>
          <div className="space-y-8 md:space-y-10">
            <HealthItem name="Hub Alpha-1" value={82} color="bg-emerald-500" />
            <HealthItem name="Sector 04 Node" value={45} color="bg-amber-500" />
            <HealthItem name="Terminal Core-X" value={98} color="bg-rose-500" alert />
            <HealthItem name="West Wing Unit" value={12} color="bg-emerald-500" />
            <HealthItem name="South Gate Bin" value={65} color="bg-indigo-500" />
          </div>
          
          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center space-x-4">
             <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
               <i className="fas fa-check-shield"></i>
             </div>
             <div>
               <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Integrity</p>
               <p className="text-[9px] text-slate-500 font-bold">ALL SYSTEMS NOMINAL</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{label: string; value: string; icon: string; color: string}> = ({label, value, icon, color}) => (
  <div className="bg-[#0f1115] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 glass group transition-all hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
       <i className={`fas ${icon} text-6xl`}></i>
    </div>
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4 md:gap-6 relative z-10">
      <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center text-2xl md:text-4xl ${color} transition-transform group-hover:scale-110`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">{label}</p>
        <p className="text-xl md:text-4xl font-black text-white tracking-tighter truncate">{value}</p>
      </div>
    </div>
  </div>
);

const HealthItem: React.FC<{name: string; value: number; color: string; alert?: boolean}> = ({name, value, color, alert}) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <span className="text-[10px] md:text-[13px] font-black text-slate-300 uppercase tracking-widest truncate mr-4">{name}</span>
      <span className={`text-[10px] md:text-[13px] font-black mono ${alert ? 'text-rose-400' : 'text-slate-500'}`}>{value}%</span>
    </div>
    <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden p-0.5">
      <div className={`h-full rounded-full ${color} ${alert ? 'animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]' : ''} transition-all duration-1000`} style={{width: `${value}%`}}></div>
    </div>
  </div>
);

export default DashboardView;
