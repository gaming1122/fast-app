
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

  const clearNotice = () => {
    const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
    if (db.USER[user.id]) {
      db.USER[user.id].profile.notice = "";
      localStorage.setItem('gp_database', JSON.stringify(db));
      const updated = { ...user, notice: "" };
      localStorage.setItem('gp_active_session', JSON.stringify(updated));
      setUser(updated);
      onUpdate(updated);
    }
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

  const handleSimulatedScan = () => {
    addLog('QR IDENTIFIED: BIN-X2');
    stopScanner();
    connectBluetooth();
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
    <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-6 duration-700 relative pb-20">
      
      {/* QR Scanner Overlay for Mobile Only */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
          <div className="w-full max-w-sm aspect-square relative border-2 border-emerald-500 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.4)]">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-125" />
             <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none"></div>
             <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_#10b981] animate-scan-line"></div>
          </div>
          <div className="mt-12 text-center space-y-6 relative z-10">
            <h4 className="text-white font-black uppercase tracking-[0.3em] text-xs">Align Terminal QR</h4>
            <div className="flex space-x-4">
              <button onClick={handleSimulatedScan} className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Simulate Detect</button>
              <button onClick={stopScanner} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/20 backdrop-blur-md">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showXpPopup && (
        <div className="xp-popup pointer-events-none">
          <div className="bg-emerald-500 text-slate-900 px-8 py-4 rounded-full font-black shadow-[0_0_50px_rgba(16,185,129,0.9)] flex flex-col items-center border-4 border-white/30 scale-110">
            <div className="flex items-center space-x-2">
              <i className="fas fa-bolt"></i>
              <span className="text-xl uppercase">+25 XP EARNED</span>
            </div>
            <div className="h-[1px] w-full bg-black/10 my-1"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">SIGNAL RECEIVED FROM NODE</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className={`lg:col-span-2 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border relative overflow-hidden shadow-2xl transition-colors duration-500 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5 glass'}`}>
          <div className={`absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full blur-[80px] md:blur-[120px] transition-all duration-1000 ${pulse ? 'bg-emerald-500/40 scale-125' : 'bg-emerald-500/5'}`}></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 relative z-10">
            <div className="relative group">
              <div className={`absolute inset-0 rounded-[2.5rem] md:rounded-[3.5rem] blur-xl transition-all duration-500 ${pulse ? 'bg-emerald-500/50 scale-110' : 'bg-emerald-500/20'}`}></div>
              <img 
                src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                className={`w-32 h-32 md:w-52 md:h-52 rounded-[2.5rem] md:rounded-[3.5rem] border-4 relative z-10 object-cover transition-all duration-300 ${isLight ? 'bg-slate-50 border-white' : 'bg-[#05070a] border-white/10'} ${animating ? 'scale-105 rotate-2' : ''}`} 
                alt="Profile"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                <span className={`px-3 md:px-5 py-1.5 ${rank.bg} ${rank.color} border ${rank.border} rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center`}>
                  <i className="fas fa-trophy mr-2"></i> {rank.title}
                </span>
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${isBleConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'} text-[8px] md:text-[9px] font-black uppercase tracking-tighter`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isBleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <span>BLE NODE: {bleStatus}</span>
                </div>
              </div>
              
              <h2 className={`text-3xl md:text-6xl font-black tracking-tighter mb-8 leading-none truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h2>
              
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                <div className={`p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/40 border-white/5 shadow-xl'} ${animating ? 'scale-105 border-emerald-500/50 shadow-emerald-500/20' : ''}`}>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Sustainability XP</p>
                  <p className={`text-2xl md:text-6xl font-black tracking-tighter mono leading-none ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{user.points}</p>
                </div>
                <div className={`p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 ${isLight ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-black/40 border-white/5 text-white shadow-xl'}`}>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Detection Count</p>
                  <p className="text-2xl md:text-6xl font-black tracking-tighter mono leading-none">{user.bottles}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-10 p-6 rounded-[2rem] border relative z-10 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'}`}>
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Live ESP32 Telemetry
                </h4>
                <button 
                  onClick={() => handleReward(1)} 
                  className={`text-[8px] font-black uppercase tracking-widest mono transition-colors ${isLight ? 'text-slate-400 hover:text-emerald-600' : 'text-slate-700 hover:text-emerald-500'}`}
                >
                  [ SIMULATE SIGNAL ]
                </button>
             </div>
             <div className="space-y-2 max-h-[100px] overflow-hidden">
                {signalLog.length > 0 ? signalLog.map((log, i) => (
                  <div key={i} className={`flex justify-between items-center text-[10px] mono animate-in slide-in-from-left-2 duration-300 ${i === 0 ? (isLight ? 'text-emerald-600 font-black' : 'text-emerald-400') : 'text-slate-500'}`}>
                    <span>{log.msg}</span>
                    <span className="opacity-50">{log.time}</span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-500 font-black uppercase tracking-widest text-[9px]">Awaiting ESP32 Handshake...</div>
                )}
             </div>
          </div>
        </div>

        <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center text-center transition-colors duration-500 ${isLight ? 'bg-white' : 'bg-[#0f1115] border border-white/5 glass'}`}>
           <div className="mb-8">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Identity Node</p>
             <div className="h-[2px] w-8 bg-emerald-500 mx-auto"></div>
           </div>
           
           {!qrUnlocked ? (
             <div className="w-full space-y-4">
                <div className={`p-8 rounded-[2rem] flex flex-col items-center space-y-4 shadow-inner ${isLight ? 'bg-slate-50' : 'bg-[#05070a]'}`}>
                  <input 
                    type="password" 
                    placeholder="ENTER PIN"
                    value={passwordAttempt}
                    onChange={e => setPasswordAttempt(e.target.value)}
                    className={`w-full border rounded-xl py-4 px-4 text-center text-sm outline-none transition-all font-bold tracking-[0.5em] ${isLight ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500' : 'bg-black/60 border-white/5 text-white focus:border-emerald-500/50'}`}
                  />
                  <button 
                    onClick={() => {
                      const db = JSON.parse(localStorage.getItem('gp_database') || '{"ADMIN": {}, "USER": {}}');
                      if (db.USER[user.id]?.password === passwordAttempt) setQrUnlocked(true);
                      else setError('Invalid Access Key');
                    }}
                    className="w-full py-4 bg-emerald-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-lg"
                  >
                    Unlock Identity
                  </button>
                  {error && <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest">{error}</p>}
                </div>
             </div>
           ) : (
             <div className={`w-48 h-48 md:w-64 md:h-64 p-4 rounded-[2rem] relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl ${isLight ? 'bg-slate-50' : 'bg-[#05070a]'}`}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(loginUrl)}&bgcolor=${isLight ? 'f8fafc' : '05070a'}&color=10b981`} 
                  alt="Identity QR" 
                  className="w-full h-full relative z-10 p-2"
                />
                <button onClick={() => setQrUnlocked(false)} className={`absolute bottom-2 right-2 z-20 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-emerald-500' : 'bg-black/90 border-emerald-500/30 text-emerald-500'}`}>
                  <i className="fas fa-lock text-xs"></i>
                </button>
             </div>
           )}

           <div className="mt-8 flex flex-col w-full space-y-3">
             {/* Phone Mode Only Scanner */}
             <button 
               onClick={startScanner}
               className="md:hidden w-full py-5 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-3 shadow-xl border border-white/10"
             >
               <i className="fas fa-qrcode text-lg"></i>
               <span>Scan Bin QR</span>
             </button>

             <button 
               onClick={connectBluetooth}
               disabled={isBleConnected}
               className={`w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-3 shadow-xl ${isBleConnected ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}
             >
               <i className={`fas ${isBleConnected ? 'fa-bolt animate-pulse' : 'fa-bluetooth-b'} text-lg`}></i>
               <span>{isBleConnected ? 'ESP32 SYNC ACTIVE' : 'CONNECT VIA BLE'}</span>
             </button>
             
             <div className={`p-4 rounded-2xl border ${isLight ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
               <p className={`text-[9px] font-black uppercase tracking-widest leading-tight ${isLight ? 'text-emerald-700' : 'text-emerald-500/80'}`}>
                 <i className="fas fa-info-circle mr-2"></i>
                 Protocol: 1 Signal = +25 XP Reward
               </p>
             </div>
           </div>
        </div>
      </div>

      <div className={`p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border shadow-2xl overflow-hidden transition-colors duration-500 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0f1115] border-white/5 glass'}`}>
          <h3 className={`text-xl md:text-2xl font-black mb-8 tracking-tighter uppercase flex items-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <i className="fas fa-leaf mr-3 text-emerald-500"></i> Environmental Matrix
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <ImpactStat label="Planet Impact" value={`${(user.bottles * 0.25).toFixed(2)}kg`} icon="fa-leaf" color="text-emerald-400" isLight={isLight} />
            <ImpactStat label="XP Efficiency" value={`${user.points} XP`} icon="fa-bolt-lightning" color="text-indigo-400" isLight={isLight} />
            <ImpactStat label="Current Tier" value={rank.title} icon="fa-star" color="text-amber-400" isLight={isLight} />
          </div>
      </div>
    </div>
  );
};

const ImpactStat: React.FC<{label: string; value: string; icon: string; color: string; isLight: boolean}> = ({label, value, icon, color, isLight}) => (
  <div className={`p-6 md:p-10 rounded-[2rem] border flex items-center space-x-5 group transition-colors ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#05070a] border-white/5'}`}>
    <div className={`w-12 h-12 md:w-20 md:h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-xl md:text-3xl ${color} transition-transform group-hover:scale-110`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl md:text-3xl font-black tracking-tighter mono leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</p>
    </div>
  </div>
);

export default UserPortalView;
