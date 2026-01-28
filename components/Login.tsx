
import React, { useState } from 'react';
import { AUTH_CREDENTIALS } from '../constants';
import { Lock, User, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
      onLogin();
    } else {
      setError(true);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bismillah Computer</h1>
          <p className="text-slate-500 font-medium mt-1">Ulipur Sales Management System</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-bounce">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm font-bold">Invalid credentials. Try again.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-800"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-800"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transform active:scale-95 transition-all"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Secure Access Only
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Bismillah Computer Ulipur
        </p>
      </div>
    </div>
  );
};

export default Login;
