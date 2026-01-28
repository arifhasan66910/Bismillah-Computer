
import React, { useState } from 'react';
import { AUTH_CREDENTIALS } from '../constants';
import { Lock, User, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === AUTH_CREDENTIALS.username && password.trim() === AUTH_CREDENTIALS.password) {
      onLogin();
    } else {
      setError(true);
      setShowHint(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-200 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">বিসমিল্লাহ কম্পিউটার</h1>
          <p className="text-slate-500 font-medium mt-1">উলিপুর সেলস ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-shake">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">ভুল ইউজারনেম বা পাসওয়ার্ড!</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">ইউজারনেম</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">পাসওয়ার্ড</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transform active:scale-95 transition-all"
            >
              ড্যাশবোর্ডে প্রবেশ করুন
            </button>
          </form>

          {showHint && (
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">প্রবেশের তথ্য:</p>
                <p className="text-xs text-blue-600 font-medium">
                  ইউজারনেম: admin, পাসওয়ার্ড: 123
                </p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} বিসমিল্লাহ কম্পিউটার উলিপুর
        </p>
      </div>
    </div>
  );
};

export default Login;
