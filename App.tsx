
import React, { useState, useEffect } from 'react';
import { ViewType, UserRole, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import LeaderboardView from './components/LeaderboardView';
import IotSpecView from './components/IotSpecView';
import BackendSpecView from './components/BackendSpecView';
import AiInsights from './components/AiInsights';
import LoginView from './components/LoginView';
import UserManagementView from './components/UserManagementView';
import SystemLogsView from './components/SystemLogsView';
import UserPortalView from './components/UserPortalView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('gp_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Session hydration failed, starting fresh.");
      return null;
    }
  });
  
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Apply Theme Effect
  useEffect(() => {
    if (currentUser?.theme === 'LIGHT') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [currentUser?.theme]);

  // Sync user profile from DB to catch real-time updates
  useEffect(() => {
    const syncWithDb = () => {
      if (currentUser) {
        const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
        const latest = db[currentUser.role]?.[currentUser.id]?.profile;
        if (latest && JSON.stringify(latest) !== JSON.stringify(currentUser)) {
          setCurrentUser(latest);
          localStorage.setItem('gp_active_session', JSON.stringify(latest));
        }
      }
    };

    syncWithDb();
    const interval = setInterval(syncWithDb, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginId = params.get('loginId');
    const role = params.get('role') as UserRole;

    if (loginId && role && !currentUser) {
      try {
        const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
        const record = db[role]?.[loginId];
        
        if (record) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentUser(record.profile);
          setActiveView(role === 'ADMIN' ? ViewType.DASHBOARD : ViewType.MY_PROFILE);
        }
      } catch (e) {
        console.error("Auto-login error:", e);
      }
    }
  }, [currentUser]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveView(user.role === 'ADMIN' ? ViewType.DASHBOARD : ViewType.MY_PROFILE);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gp_active_session');
    document.body.classList.remove('light-mode');
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case ViewType.SETTINGS:
        return <SettingsView user={currentUser} onUpdate={setCurrentUser} />;
      case ViewType.AI_INSIGHTS:
        return <AiInsights />;
      case ViewType.LEADERBOARD:
        return <LeaderboardView />;
      case ViewType.USER_MANAGEMENT:
        return <UserManagementView />;
      case ViewType.SYSTEM_LOGS:
        return <SystemLogsView />;
      case ViewType.IOT_FIRMWARE:
        return <IotSpecView />;
      case ViewType.BACKEND_SPECS:
        return <BackendSpecView />;
      case ViewType.MY_PROFILE:
        return <UserPortalView user={currentUser} onUpdate={setCurrentUser} />;
      case ViewType.DASHBOARD:
        return currentUser.role === 'ADMIN' ? <DashboardView /> : <UserPortalView user={currentUser} onUpdate={setCurrentUser} />;
      default:
        return <DashboardView />;
    }
  };

  const avatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}&top=${currentUser.gender === 'FEMALE' ? 'longHair,hijab,turban' : 'shortHair,frizzle'}`;
  const displayAvatar = currentUser.profileImage || avatarFallback;

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden ${currentUser.theme === 'LIGHT' ? 'bg-[#f8fafc]' : 'bg-[#05070a]'}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar - Fixed on Large Screens */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeView={activeView} 
          onViewChange={(view) => { setActiveView(view); setSidebarOpen(false); }} 
          onLogout={handleLogout} 
          role={currentUser.role}
          userName={currentUser.name}
          theme={currentUser.theme || 'DARK'}
        />
      </div>
      
      {/* Main Content Area - Expansive Desktop Experience */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Modern Header - Edge to Edge with Balanced Padding */}
        <header className={`flex items-center justify-between px-6 py-4 md:px-10 xl:px-16 md:py-6 border-b z-30 sticky top-0 backdrop-blur-md ${currentUser.theme === 'LIGHT' ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-[#05070a]/80 border-white/5'}`}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5 border border-white/10 hover:bg-white/10">
              <i className="fas fa-bars-staggered"></i>
            </button>
            <div className="flex flex-col">
              <h1 className={`text-lg md:text-2xl xl:text-3xl font-black uppercase tracking-tighter ${currentUser.theme === 'LIGHT' ? 'text-slate-900' : 'text-white'}`}>
                {activeView.replace('_', ' ')}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[8px] md:text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Active Session: {currentUser.id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-8">
            <div className="hidden sm:flex flex-col items-end">
              <span className={`text-xs xl:text-sm font-black ${currentUser.theme === 'LIGHT' ? 'text-slate-800' : 'text-white'}`}>{currentUser.name}</span>
              <span className={`text-[8px] xl:text-[9px] font-bold uppercase tracking-widest ${currentUser.role === 'ADMIN' ? 'text-indigo-500' : 'text-emerald-500'}`}>{currentUser.role} STATUS</span>
            </div>
            <img src={displayAvatar} className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl border-2 object-cover transition-transform hover:scale-105 cursor-pointer ${currentUser.theme === 'LIGHT' ? 'border-slate-100 bg-slate-100 shadow-md' : 'border-[#1e293b] bg-[#1e293b]'}`} alt="Profile" />
          </div>
        </header>

        {/* Dynamic View Content - Full Responsive Space (No max-width) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 lg:p-12 xl:p-16">
          <div className="w-full">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
