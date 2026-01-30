
import React from 'react';
import { ViewType, UserRole, AppTheme } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  role: UserRole;
  userName: string;
  theme: AppTheme;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout, role, theme }) => {
  const adminItems = [
    { id: ViewType.DASHBOARD, icon: 'fa-table-columns', label: 'Telemetry', desc: 'System status' },
    { id: ViewType.USER_MANAGEMENT, icon: 'fa-users-gear', label: 'Directory', desc: 'Manage nodes' },
    { id: ViewType.IOT_FIRMWARE, icon: 'fa-microchip', label: 'Hardware', desc: 'IoT logic' },
    { id: ViewType.SYSTEM_LOGS, icon: 'fa-list-ul', label: 'Cloud Logs', desc: 'Traffic stream' },
  ];

  const userItems = [
    { id: ViewType.MY_PROFILE, icon: 'fa-user-circle', label: 'My Wallet', desc: 'Point balance' },
    { id: ViewType.AI_INSIGHTS, icon: 'fa-sparkles', label: 'Neural AI', desc: 'Eco analysis' },
  ];

  const commonItems = [
    { id: ViewType.LEADERBOARD, icon: 'fa-fire', label: 'Top Tiers', desc: 'Global ranking' },
    { id: ViewType.SETTINGS, icon: 'fa-gears', label: 'Settings', desc: 'Config profile' },
  ];

  const activeItems = role === 'ADMIN' ? [...adminItems, ...commonItems] : [...userItems, ...commonItems];
  
  const isLight = theme === 'LIGHT';
  const themeColor = role === 'ADMIN' ? (isLight ? 'text-indigo-600' : 'text-indigo-400') : (isLight ? 'text-emerald-600' : 'text-emerald-500');
  const activeBg = role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-500';

  return (
    <aside className={`w-72 md:w-80 h-full flex flex-col transition-all duration-300 overflow-y-auto ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#05070a] border-r border-white/5'}`}>
      <div className="p-6 md:p-8 pb-8 md:pb-10">
        <div className="flex items-center space-x-4">
          <div className={`${activeBg} w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-xl`}>
            <i className={`fas ${role === 'ADMIN' ? 'fa-shield-halved' : 'fa-leaf'} text-white text-lg`}></i>
          </div>
          <div className="min-w-0">
            <h2 className={`text-lg md:text-xl font-black tracking-tighter leading-none truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>GP-<span className={themeColor}>{role}</span></h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 mono">Secure Node</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {activeItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? `${activeBg} text-white shadow-lg` 
                  : `hover:bg-white/5 ${isLight ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl shrink-0 ${isActive ? 'bg-black/10' : (isLight ? 'bg-slate-100' : 'bg-white/5')}`}>
                <i className={`fas ${item.icon} text-sm`}></i>
              </div>
              <div className="text-left min-w-0 overflow-hidden">
                <span className="block font-black text-[10px] md:text-[11px] uppercase tracking-widest truncate">{item.label}</span>
                <span className="text-[8px] font-bold opacity-60 block mt-0.5 truncate">{item.desc}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <i className="fas fa-power-off text-base"></i>
          <span className="truncate">Disconnect</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
