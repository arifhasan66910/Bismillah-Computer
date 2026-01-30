
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, User, ShieldCheck, AlertTriangle, Loader2, UserPlus, LogIn, HelpCircle, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('দয়া করে আপনার পুরো নাম দিন।');
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (signUpError) throw signUpError;
        
        // Check if user needs confirmation
        if (data.session) {
          setSuccessMsg('অ্যাকাউন্ট তৈরি হয়েছে এবং আপনি লগইন অবস্থায় আছেন!');
        } else {
          setSuccessMsg('অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করার চেষ্টা করুন।');
        }
        setIsSignUp(false);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message;
      
      // Target specific 'Email not confirmed' error
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'আপনার ইমেইলটি এখনও ভেরিফাই করা হয়নি। দয়া করে মালিকের সাথে যোগাযোগ করুন অথবা ড্যাশবোর্ড থেকে "Confirm Email" অপশনটি বন্ধ করুন।';
        setShowHelp(true);
      } else if (msg.includes('Database error saving new user')) {
        msg = 'ডাটাবেস সেটিংস অসম্পূর্ণ। SQL Editor-এ প্রোফাইল টেবিল স্ক্রিপ্টটি রান করুন।';
        setShowHelp(true);
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।';
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 text-white rounded-[2rem] shadow-2xl mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">বিসমিল্লাহ কম্পিউটার</h1>
          <p className="text-slate-500 font-medium mt-1">উলিপুর ডিজিটাল ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button 
                type="button" 
                onClick={() => { setIsSignUp(false); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${!isSignUp ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
              >
                লগইন
              </button>
              <button 
                type="button" 
                onClick={() => { setIsSignUp(true); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${isSignUp ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}
              >
                নতুন একাউন্ট
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{successMsg}</p>
              </div>
            )}

            {showHelp && (
              <div className="p-5 bg-slate-900 text-slate-300 rounded-[1.5rem] text-[10px] font-medium leading-relaxed animate-in zoom-in-95 border-l-4 border-emerald-500">
                <p className="mb-2 text-white font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3" /> ইমেইল ভেরিফিকেশন বন্ধ করবেন কিভাবে?
                </p>
                ১. Supabase ড্যাশবোর্ডে গিয়ে <b>Authentication > Settings</b> এ যান।<br/>
                ২. <b>Email Auth</b> সেকশনে <b>"Confirm Email"</b> অপশনটি বন্ধ করুন।<br/>
                ৩. তাহলে ইমেইল লিঙ্কের ঝামেলা ছাড়াই সরাসরি সাইন-আপ ও লগইন হবে।
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পুরো নাম</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                  placeholder="আপনার নাম"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ইমেইল ঠিকানা</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পাসওয়ার্ড</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isSignUp ? 'একাউন্ট তৈরি করুন' : 'সিস্টেমে প্রবেশ করুন'}</span>}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          &copy; {new Date().getFullYear()} বিসমিল্লাহ কম্পিউটার উলিপুর
        </p>
      </div>
    </div>
  );
};

export default Login;
