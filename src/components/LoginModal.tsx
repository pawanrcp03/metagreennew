import React, { useState } from 'react';
import { Mail, Lock, Sparkles, X, ShieldCheck, AlertCircle, ArrowRight, Building2, UserCheck, KeyRound } from 'lucide-react';
import { authService } from '@/src/services/auth.service';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenSignUp: () => void;
}

export default function LoginModal({ onClose, onSuccess, onOpenSignUp }: LoginModalProps) {
  const [loginType, setLoginType] = useState<'admin' | 'vendor' | 'installer'>('admin');
  const [email, setEmail] = useState('admin@metagreen.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabSwitch = (type: 'admin' | 'vendor' | 'installer') => {
    setLoginType(type);
    setError('');
    if (type === 'admin') {
      setEmail('admin@solar.com');
      setPassword('admin123');
    } else if (type === 'vendor') {
      setEmail('vendor@vikramsolar.com');
      setPassword('vendor123');
    } else {
      setEmail('installer@solar.com');
      setPassword('installer123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        await authService.loginDemoUser('admin');
      } else if (loginType === 'vendor') {
        await authService.loginDemoUser('vendor');
      } else if (loginType === 'installer') {
        await authService.loginDemoUser('installer');
      } else {
        await authService.login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Dedicated Sign In Portal
            </span>
            <h2 className="text-xl font-black text-white mt-1">Sign In to Meta Green</h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Separate Login Type Tabs */}
        <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabSwitch('admin')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              loginType === 'admin' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>👑 Global Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('vendor')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              loginType === 'vendor' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🏢 Vendor</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('installer')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              loginType === 'installer' 
                ? 'bg-teal-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🔧 Installer</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Selected Portal Access</span>
            <p className="text-xs font-black text-white">
              {loginType === 'admin' 
                ? '👑 Meta Green Global HQ Super Admin' 
                : loginType === 'vendor' 
                  ? '🏢 Solar Vendor & Staff Dispatch Portal' 
                  : '🔧 Lead Solar Field Installer & Contractor Portal'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Registered Email Address *</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={loginType === 'admin' ? "admin@solar.com" : loginType === 'vendor' ? "vendor@vikramsolar.com" : "installer@solar.com"}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password *</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating Credentials...' : (loginType === 'admin' ? 'Sign In as Global Admin' : loginType === 'vendor' ? 'Sign In to Vendor Portal' : 'Sign In to Installer Portal')}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Separate Sign Up Callouts for Vendor and Installer */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Need a New Subscription Account?</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenSignUp}
                className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🏢 Sign Up Vendor</span>
              </button>

              <button
                type="button"
                onClick={onOpenSignUp}
                className="py-2 px-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🔧 Sign Up Installer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
