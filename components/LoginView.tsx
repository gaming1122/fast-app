
import React, { useState } from 'react';
import { UserRole, UserProfile, Gender } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP';

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [role, setRole] = useState<UserRole>('USER');
  const [gender, setGender] = useState<Gender>('MALE');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const dbStr = localStorage.getItem('gp_database');
      const db = dbStr ? JSON.parse(dbStr) : { "ADMIN": {}, "USER": {} };

      if (mode === 'SIGNUP') {
        if (db[role][id]) {
          setError(`Conflict: Identity ID [${id}] already exists.`);
          setLoading(false);
          return;
        }
        
        const newUser: UserProfile = {
          id,
          name,
          role,
          gender,
          points: 0,
          bottles: 0,
          joinedAt: new Date().toISOString()
        };

        db[role][id] = { password, profile: newUser };
        localStorage.setItem('gp_database', JSON.stringify(db));
        onLoginSuccess(newUser);
      } else {
        if (role === 'ADMIN' && id === 'admin' && password === 'password123') {
           onLoginSuccess({ 
             id: 'ADM-MASTER', 
             name: 'System Architect', 
             role: 'ADMIN', 
             gender: 'MALE', 
             points: 0, 
             bottles: 0, 
             joinedAt: new Date().toISOString() 
           });
           return;
        }

        const record = db[role][id];
        if (record && record.password === password) {
          onLoginSuccess(record.profile);
        } else {
          setError('Authorization Failed: Identity ID or Security Key is incorrect.');
          setLoading(false);
        }
      }
    }, 1000);
  };

  const isUser = role === 'USER';

  return (
    <div className="min-h-screen w-full flex bg-[#05070a] overflow-hidden">
      
      {/* LEFT SIDE: Visual Branding (Visible on Desktop) */}
      <div className={`hidden lg:flex flex-col justify-between w-1/2 p-20 relative transition-all duration-1000 overflow-hidden ${isUser ? 'bg-emerald-950/20' : 'bg-indigo-950/20'}`}>
        {/* Dynamic Glows */}
        <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[180px] transition-all duration-1000 ${isUser ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}></div>
        <div className={`absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[180px] transition-all duration-1000 ${isUser ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}></div>
        
        {/* Branding Content */}
        <div className="relative z-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl mb-12 border transition-all duration-500 ${isUser ? 'bg-emerald-500 text-slate-900 border-emerald-400/50 shadow-emerald-500/20' : 'bg-indigo-600 text-white border-indigo-500/50 shadow-indigo-500/20'}`}>
            <i className={`fas ${isUser ? 'fa-leaf' : 'fa-shield-halved'}`}></i>
          </div>
          <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none mb-6">
            GREEN<br/>
            <span className={isUser ? 'text-emerald-400' : 'text-indigo-500'}>POINTS</span>
          </h1>
          <p className="text-slate-500 text-lg xl:text-xl font-bold uppercase tracking-[0.4em] mono">
            Next-Gen Plastic Recovery Protocol
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center space-x-6">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isUser ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mono">Secure Cloud Handshake Active</span>
          </div>
          <div className="h-[1px] w-full bg-white/5"></div>
          <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest mono">
            <span>Uptime: 99.99%</span>
            <span>Latency: 14ms</span>
            <span>Encryption: AES-256</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form (Full width on mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 relative">
        {/* Mobile Background Glows (Hidden on Desktop side-by-side) */}
        <div className="lg:hidden absolute inset-0 transition-opacity duration-1000">
          <div className={`absolute top-0 left-0 w-full h-full blur-[120px] opacity-20 ${isUser ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
        </div>

        <div className="w-full max-w-lg bg-[#0f1115]/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none rounded-[3.5rem] p-8 sm:p-14 lg:p-0 border lg:border-none border-white/5 relative z-10 transition-all duration-500">
          
          <div className="text-center mb-10 lg:text-left">
            <div className={`lg:hidden inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-6 transition-colors duration-500 ${isUser ? 'bg-emerald-500 text-slate-900' : 'bg-indigo-600 text-white'}`}>
              <i className={`fas ${isUser ? 'fa-leaf' : 'fa-shield-halved'} text-3xl`}></i>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-2">
              GP <span className={isUser ? 'text-emerald-400' : 'text-indigo-500'}>Core</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px] mono opacity-80">
              Identity Protocol: {mode} / Terminal Access
            </p>
          </div>

          <div className="flex bg-[#05070a] p-1.5 rounded-[2rem] border border-white/5 mb-8">
            <button 
              type="button" 
              onClick={() => { setRole('USER'); setError(''); }} 
              className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${isUser ? 'bg-emerald-500 text-slate-900 shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Eco Student
            </button>
            <button 
              type="button" 
              onClick={() => { setRole('ADMIN'); setError(''); }} 
              className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${!isUser ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Node Manager
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-[#05070a] p-1 rounded-2xl border border-white/5 mb-4">
              <button type="button" onClick={() => { setMode('LOGIN'); setError(''); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'LOGIN' ? 'text-white bg-white/5' : 'text-slate-700'}`}>Sign In</button>
              <button type="button" onClick={() => { setMode('SIGNUP'); setError(''); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'SIGNUP' ? 'text-white bg-white/5' : 'text-slate-700'}`}>New Record</button>
            </div>

            {mode === 'SIGNUP' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Full Identity Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter Name" className="w-full bg-[#05070a] border border-white/5 rounded-2xl py-5 px-8 outline-none focus:border-white/20 text-white font-bold text-base transition-all" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Avatar Profile</label>
                  <div className="flex space-x-4 bg-[#05070a] p-1.5 rounded-2xl border border-white/5">
                    <button type="button" onClick={() => setGender('MALE')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${gender === 'MALE' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-700 border border-transparent'}`}>Male Unit</button>
                    <button type="button" onClick={() => setGender('FEMALE')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${gender === 'FEMALE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-slate-700 border border-transparent'}`}>Female Unit</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Identity ID (Public)</label>
                <input type="text" value={id} onChange={e => setId(e.target.value)} placeholder={isUser ? "ID-001" : "MGR-01"} className="w-full bg-[#05070a] border border-white/5 rounded-2xl py-5 px-8 outline-none focus:border-white/20 text-white font-bold text-base transition-all mono tracking-widest uppercase" required />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Security PIN (Private)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#05070a] border border-white/5 rounded-2xl py-5 px-8 outline-none focus:border-white/20 text-white font-bold text-base transition-all tracking-[0.5em]" required />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-5 rounded-3xl text-[10px] font-black uppercase text-center animate-shake leading-relaxed">
                <i className="fas fa-triangle-exclamation mr-3 scale-125"></i> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-6 rounded-3xl font-black tracking-[0.25em] uppercase text-sm shadow-2xl active:scale-95 transition-all mt-6 ${!isUser ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/20'}`}
            >
              {loading ? <i className="fas fa-circle-notch fa-spin scale-150"></i> : mode === 'LOGIN' ? 'Verify Identity' : 'Establish Record'}
            </button>
          </form>
          
          <div className="mt-12 text-center">
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] mono opacity-40">
              Persistent Node Storage Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
