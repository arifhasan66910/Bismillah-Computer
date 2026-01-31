
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AUTH_CREDENTIALS } from '../constants';
import { ShieldCheck, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    const inputUser = email.toLowerCase().trim();
    const inputPass = password.trim();
    const adminUser = AUTH_CREDENTIALS.username.toLowerCase();
    
    // Bypass for master admin
    if (!isSignUp && 
        (inputUser === adminUser || inputUser === 'admin@example.com') && 
        inputPass === AUTH_CREDENTIALS.password) {
      localStorage.clear(); // Clear any stale data
      localStorage.setItem('is_local_admin', 'true');
      window.location.reload();
      return;
    }

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('দয়া করে আপনার পুরো নাম দিন।');
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: inputUser.includes('@') ? inputUser : `${inputUser}@example.com`,
          password: inputPass,
          options: { data: { full_name: fullName } }
        });

        if (signUpError) throw signUpError;
        setSuccessMsg('অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করার চেষ্টা করুন।');
        setIsSignUp(false);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: inputUser.includes('@') ? inputUser : `${inputUser}@example.com`,
          password: inputPass,
        });
        if (authError) throw authError;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message;
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'আপনার ইমেইলটি এখনও ভেরিফাই করা হয়নি।';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'ইউজারনেম বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-inter">
      <div className="max-w-md w-full py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] shadow-2xl mb-6 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">বিসমিল্লাহ কম্পিউটার</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">উলিপুর ডিজিটাল সিস্টেম</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button 
                type="button" 
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${!isSignUp ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-400'}`}
              >
                লগইন
              </button>
              <button 
                type="button" 
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${isSignUp ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-400'}`}
              >
                রেজিস্ট্রেশন
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 flex items-start gap-3 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">নাম</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all shadow-inner"
                    placeholder="আপনার নাম"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ইউজারনেম</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all shadow-inner"
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{isSignUp ? 'একাউন্ট খুলুন' : 'প্রবেশ করুন'}</span>}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
          &copy; {new Date().getFullYear()} Bismillah Computer Ulipur
        </p>
      </div>
    </div>
  );
};

export default Login;
