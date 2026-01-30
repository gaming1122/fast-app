
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';

interface UserPortalViewProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

const UserPortalView: React.FC<UserPortalViewProps> = ({ user: initialUser, onUpdate }) => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [animating, setAnimating] = useState(false);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [qrUnlocked, setQrUnlocked] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [error, setError] = useState('');
  
  // QR Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Bluetooth State
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [bleStatus, setBleStatus] = useState('Disconnected');
  const [pulse, setPulse] = useState(false);
  const [signalLog, setSignalLog] = useState<{msg: string, time: string}[]>([]);
  
  const logRef = useRef<{msg: string, time: string}[]>([]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const addLog = (msg: string) => {
    const newLog = { msg, time: new Date().toLocaleTimeString() };
    logRef.current = [newLog, ...logRef.current].slice(0, 5);
    setSignalLog(logRef.current);
  };

  // Core Reward Logic: 1 Signal = 25 XP
  const handleReward = useCallback((count: number = 1) => {
    setAnimating(true);
    setPulse(true);
    setShowXpPopup(true);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    const xpPerBottle = 25; 
    const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
    
    const updatedUser = {
      ...user,
      points: user.points + (xpPerBottle * count),
      bottles: user.bottles + count
    };
    
    if (db.USER[user.id]) {
      db.USER[user.id].profile = updatedUser;
      localStorage.setItem('gp_database', JSON.stringify(db));
    }
    
    localStorage.setItem('gp_active_session', JSON.stringify(updatedUser));
    setUser(updatedUser);
    onUpdate(updatedUser);
    
    setTimeout(() => {
      setAnimating(false);
      setPulse(false);
    }, 800);
    
    setTimeout(() => {
      setShowXpPopup(false);
    }, 2500);
  }, [user, onUpdate]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError('Camera access denied.');
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const connectBluetooth = async () => {
    if (!(navigator as any).bluetooth) {
      setError('Bluetooth unsupported.');
      return;
    }
    try {
      setBleStatus('Scanning...');
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'GP-Bin' }],
        optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
      });
      
      setBleStatus('Connecting...');
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      const characteristic = await service?.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
      
      await characteristic?.startNotifications();
      addLog(`LINKED: ESP32 Terminal ${device.name}`);
      
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const decodedValue = new TextDecoder().decode(event.target.value);
        if (decodedValue.trim() === 'B') {
          addLog('SIGNAL RECEIVED: +25 XP AWARDED');
          handleReward(1);
        }
      });
      
      setIsBleConnected(true);
      setBleStatus('Live Sync');
      setError('');
    } catch (err) {
      setBleStatus('Disconnected');
      setError('Connection failed. Please retry.');
    }
  };

  const currentRank = (pts: number) => {
    if (pts >= 1000) return { title: 'Eco Legend', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    if (pts >= 500) return { title: 'Green Guardian', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
    if (pts >= 250) return { title: 'Nature Scout', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
    return { title: 'Eco Rookie', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
  };

  const rank = currentRank(user.points);
  const loginUrl = `${window.location.origin}${window.location.pathname}?loginId=${user.id}&role=USER`;
  const isLight = user.theme === 'LIGHT';

  return (
    <div className="space-y-8 md:space-y-16 animate-in slide-in-from-bottom-6 duration-700 relative pb-24 w-full">
      
      {showXpPopup && (
        <div className="xp-popup pointer-events-none">
          <div className="bg-emerald-500 text-slate-900 px-10 py-5 rounded-full font-black shadow-[0_0_60px_rgba(16,185,129,0.8)] flex flex-col items-center border-4 border-white/30 scale-125">
            <div className="flex items-center space-x-3">
              <i className="fas fa-bolt"></i>
              <span className="text-2xl uppercase">+25 XP EARNED</span>
            </div>
            <div className="h-[1px] w-full bg-black/10 my-1"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">ESP32 SIGNAL INGESTED</span>
          </div>
        </div>
      )}

      {/* Main Grid - Ultra Wide Desktop Focus */}
      <div className="grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-5 gap-8 lg:gap-12">
        
        {/* Profile Card & Stats (Spans 3/5 on large screens) */}
        <div className={`xl:col-span-3 2xl:col-span-4 p-8 md:p-16 rounded-[3rem] md:rounded-[4.5rem] border relative overflow-hidden shadow-2xl transition-all duration-500 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5 glass'}`}>
          <div className={`absolute top-0 right-0 w-80 h-80 md:w-[600px] md:h-[600px] rounded-full blur-[100px] md:blur-[180px] transition-all duration-1000 ${pulse ? 'bg-emerald-500/30 scale-125' : 'bg-emerald-500/5'}`}></div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-24 relative z-10">
            <div className="relative group shrink-0">
              <div className={`absolute inset-0 rounded-[3rem] md:rounded-[4.5rem] blur-2xl transition-all duration-500 ${pulse ? 'bg-emerald-500/40 scale-110' : 'bg-emerald-500/10'}`}></div>
              <img 
                src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                className={`w-48 h-48 md:w-80 md:h-80 rounded-[3.5rem] md:rounded-[5rem] border-8 relative z-10 object-cover transition-all duration-700 shadow-[0_40px_80px_rgba(0,0,0,0.5)] ${isLight ? 'bg-slate-50 border-white' : 'bg-[#05070a] border-white/10'} ${animating ? 'scale-105 rotate-1' : ''}`} 
                alt="Profile"
              />
            </div>
            
            <div className="flex-1 text-center lg:text-left w-full">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                <span className={`px-6 md:px-8 py-3 ${rank.bg} ${rank.color} border ${rank.border} rounded-full text-[11px] md:text-[14px] font-black uppercase tracking-[0.2em] flex items-center shadow-lg`}>
                  <i className="fas fa-trophy mr-3"></i> {rank.title}
                </span>
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-full border transition-all ${isBleConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'} text-[11px] md:text-[14px] font-black uppercase tracking-tighter shadow-lg`}>
                  <div className={`w-3 h-3 rounded-full ${isBleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <span>LINK: {bleStatus}</span>
                </div>
              </div>
              
              <h2 className={`text-5xl md:text-[10rem] font-black tracking-tighter mb-12 leading-none truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-16">
                <div className={`p-10 md:p-20 rounded-[3rem] md:rounded-[4rem] border transition-all duration-700 ${isLight ? 'bg-slate-50 border-slate-100 shadow-sm' : 'bg-black/40 border-white/5 shadow-2xl'} ${animating ? 'scale-105 border-emerald-500/50' : ''}`}>
                  <p className="text-[11px] md:text-[16px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 md:mb-8">Accumulated XP</p>
                  <p className={`text-5xl md:text-[10rem] font-black tracking-tighter mono leading-none ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{user.points}</p>
                </div>
                <div className={`p-10 md:p-20 rounded-[3rem] md:rounded-[4rem] border transition-all duration-700 ${isLight ? 'bg-slate-50 border-slate-100 shadow-sm' : 'bg-black/40 border-white/5 shadow-2xl'}`}>
                  <p className="text-[11px] md:text-[16px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 md:mb-8">Verified Items</p>
                  <p className={`text-5xl md:text-[10rem] font-black tracking-tighter mono leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.bottles}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-12 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border relative z-10 transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'}`}>
             <div className="flex items-center justify-between mb-10">
                <h4 className="text-[12px] md:text-[16px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 mr-5 animate-pulse shadow-[0_0_15px_#10b981]"></span>
                  Neural Handshake Traffic
                </h4>
                <button 
                  onClick={() => handleReward(1)} 
                  className={`text-[10px] md:text-[12px] font-black uppercase tracking-widest mono transition-all border px-6 py-3 rounded-2xl ${isLight ? 'text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-500' : 'text-slate-700 border-white/10 hover:text-emerald-500 hover:border-emerald-500/50'}`}
                >
                  [ FORCED SIGNAL EMISSION ]
                </button>
             </div>
             <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-6">
                {signalLog.length > 0 ? signalLog.map((log, i) => (
                  <div key={i} className={`flex justify-between items-center text-[14px] md:text-[18px] mono animate-in slide-in-from-left-4 duration-500 ${i === 0 ? (isLight ? 'text-emerald-600 font-black' : 'text-emerald-400') : 'text-slate-500 opacity-60'}`}>
                    <div className="flex items-center">
                       <i className={`fas ${i === 0 ? 'fa-bolt-lightning mr-6 scale-125' : 'fa-check-circle mr-6 opacity-50'}`}></i>
                       <span>{log.msg}</span>
                    </div>
                    <span className="text-[12px] font-bold opacity-30 tracking-widest">{log.time}</span>
                  </div>
                )) : (
                  <div className="text-center py-16 text-slate-500 font-black uppercase tracking-[0.5em] text-[12px] italic opacity-30">Awaiting Edge Node Stream Handshake...</div>
                )}
             </div>
          </div>
        </div>

        {/* Security Hub Panel (Spans 1/5) */}
        <div className={`xl:col-span-1 2xl:col-span-1 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-2xl flex flex-col items-center text-center transition-all duration-500 h-full ${isLight ? 'bg-white border border-slate-100' : 'bg-[#0f1115] border border-white/5 glass'}`}>
           <div className="mb-12 w-full">
             <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.6em] mb-4">Security Protocol</p>
             <div className="h-[3px] w-24 bg-emerald-500 mx-auto rounded-full shadow-[0_0_15px_#10b981]"></div>
           </div>
           
           <div className="flex-1 w-full flex flex-col justify-center min-h-[400px]">
             {!qrUnlocked ? (
               <div className="w-full space-y-8">
                  <div className={`p-10 md:p-12 rounded-[3.5rem] flex flex-col items-center space-y-8 shadow-inner ${isLight ? 'bg-slate-50' : 'bg-[#05070a]'}`}>
                    <input 
                      type="password" 
                      placeholder="ENTER PIN"
                      value={passwordAttempt}
                      onChange={e => setPasswordAttempt(e.target.value)}
                      className={`w-full border rounded-3xl py-7 px-8 text-center text-2xl outline-none transition-all font-black tracking-[0.8em] ${isLight ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500 shadow-md' : 'bg-black/60 border-white/5 text-white focus:border-emerald-500/50'}`}
                    />
                    <button 
                      onClick={() => {
                        const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
                        if (db.USER[user.id]?.password === passwordAttempt) setQrUnlocked(true);
                        else setError('ACCESS_DENIED: PIN MISMATCH');
                      }}
                      className="w-full py-7 bg-emerald-500 text-slate-900 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 active:scale-95 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)]"
                    >
                      UNVLOCK WALLET
                    </button>
                    {error && <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest animate-shake"><i className="fas fa-triangle-exclamation mr-2"></i>{error}</p>}
                  </div>
               </div>
             ) : (
               <div className={`w-full max-w-[380px] aspect-square p-10 rounded-[4rem] mx-auto relative overflow-hidden animate-in zoom-in-95 duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.6)] ${isLight ? 'bg-slate-50' : 'bg-[#05070a]'}`}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(loginUrl)}&bgcolor=${isLight ? 'f8fafc' : '05070a'}&color=10b981`} 
                    alt="Wallet Identity" 
                    className="w-full h-full relative z-10 p-4"
                  />
                  <button onClick={() => setQrUnlocked(false)} className={`absolute bottom-8 right-8 z-20 w-16 h-16 rounded-[1.5rem] border flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-emerald-500 shadow-xl' : 'bg-black/95 border-emerald-500/30 text-emerald-500 shadow-2xl'}`}>
                    <i className="fas fa-lock-open text-xl"></i>
                  </button>
               </div>
             )}
           </div>

           <div className="mt-16 flex flex-col w-full space-y-6">
             <button 
               onClick={connectBluetooth}
               disabled={isBleConnected}
               className={`w-full py-8 rounded-[2.5rem] font-black text-[15px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center space-x-5 shadow-[0_25px_50px_rgba(79,70,229,0.3)] ${isBleConnected ? 'bg-emerald-500 text-slate-900' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
             >
               <i className={`fas ${isBleConnected ? 'fa-link animate-pulse' : 'fa-bluetooth-b'} text-2xl`}></i>
               <span>{isBleConnected ? 'SYNC ACTIVE' : 'CONNECT ESP32'}</span>
             </button>
             
             <div className={`p-8 rounded-[2.5rem] border ${isLight ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
               <p className={`text-[12px] font-black uppercase tracking-widest leading-relaxed ${isLight ? 'text-emerald-700' : 'text-emerald-500/60'}`}>
                 <i className="fas fa-microchip mr-3 opacity-50"></i>
                 Kernel Version: GP-PRO 4.0
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* Impact Stats Grid - Spreads full width on PC */}
      <div className={`p-12 md:p-20 rounded-[3rem] md:rounded-[4.5rem] border shadow-2xl transition-all duration-500 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5 glass'}`}>
          <h3 className={`text-3xl md:text-5xl font-black mb-16 tracking-tighter uppercase flex items-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <i className="fas fa-earth-americas mr-6 text-emerald-500"></i> Planetary Footprint Update
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
            <ImpactStat label="Carbon Reduction" value={`${(user.bottles * 0.25).toFixed(2)} KG`} icon="fa-leaf" color="text-emerald-400" isLight={isLight} />
            <ImpactStat label="Tier Position" value={rank.title} icon="fa-medal" color="text-amber-400" isLight={isLight} />
            <ImpactStat label="Neural Energy" value={`${user.points.toLocaleString()} XP`} icon="fa-bolt-lightning" color="text-indigo-400" isLight={isLight} />
          </div>
      </div>
    </div>
  );
};

const ImpactStat: React.FC<{label: string; value: string; icon: string; color: string; isLight: boolean}> = ({label, value, icon, color, isLight}) => (
  <div className={`p-10 md:p-16 rounded-[3.5rem] border flex items-center space-x-10 group transition-all duration-500 ${isLight ? 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-[0_40px_80px_rgba(0,0,0,0.05)]' : 'bg-[#05070a] border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
    <div className={`w-20 h-20 md:w-36 md:h-36 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-4xl md:text-7xl ${color} transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[12px] md:text-[16px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 truncate">{label}</p>
      <p className={`text-3xl md:text-7xl font-black tracking-tighter mono leading-none truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</p>
    </div>
  </div>
);

export default UserPortalView;
