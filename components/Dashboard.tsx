
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Transaction, ServiceCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { 
  TrendingUp, CreditCard, PlayCircle, Calendar, Wallet, 
  TrendingDown, Plus, Trash2, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const now = new Date();
  const todayDate = now.toDateString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Statistics Calculation
  const todayIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.timestamp).toDateString() === todayDate)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && 
            new Date(t.timestamp).getMonth() === currentMonth && 
            new Date(t.timestamp).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yearlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.timestamp).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yearlyExpense = transactions
    .filter(t => t.type === 'expense' && new Date(t.timestamp).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Chart Data
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const categoryData = Object.values(ServiceCategory).map(cat => ({
    name: CATEGORY_LABELS[cat as string] || (cat as string),
    value: incomeTransactions.filter(s => s.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const recentTransactions = transactions.slice(0, 8);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amount || isNaN(parseFloat(amount))) {
      setStatus({ type: 'error', msg: 'সঠিক তথ্য দিন' });
      return;
    }

    setIsSubmitting(true);
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: 'income',
      category: selectedCategory,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString(),
      description: 'Quick Entry from Dashboard'
    };

    onAddTransaction(newTx);
    setAmount('');
    setSelectedCategory(null);
    setStatus({ type: 'success', msg: 'লেনদেন সফলভাবে যোগ হয়েছে!' });
    setIsSubmitting(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800">আসসালামু আলাইকুম!</h2>
          <p className="text-slate-500 font-medium">বিসমিল্লাহ কম্পিউটার উলিপুর - আজকের সারসংক্ষেপ</p>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">আজকের তারিখ</p>
          <p className="text-sm font-bold text-emerald-800">{new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Quick Entry Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Plus className="w-24 h-24" />
        </div>
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" />
          দ্রুত বিক্রয় এন্ট্রি (Quick Sale)
        </h4>

        {status && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{status.msg}</p>
          </div>
        )}

        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {Object.values(ServiceCategory).slice(0, 5).map((cat) => (
                <button
                  key={cat as string}
                  type="button"
                  onClick={() => setSelectedCategory(cat as string)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 border-emerald-600 text-white scale-105 shadow-lg'
                      : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="mb-1">{CATEGORY_ICONS[cat as string]}</div>
                  <span className="text-[9px] font-black uppercase text-center">{CATEGORY_LABELS[cat as string]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="টাকার পরিমাণ"
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl text-lg font-black text-slate-800 transition-all outline-none shadow-inner"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "আজকের বিক্রয়", val: `৳${todayIncome.toLocaleString()}`, icon: <TrendingUp />, color: "emerald" },
          { label: "এই মাসের বিক্রয়", val: `৳${monthlyIncome.toLocaleString()}`, icon: <Calendar />, color: "blue" },
          { label: "এই বছরের বিক্রয়", val: `৳${yearlyIncome.toLocaleString()}`, icon: <CreditCard />, color: "amber" },
          { label: "এই বছরের ব্যয়", val: `৳${yearlyExpense.toLocaleString()}`, icon: <TrendingDown />, color: "rose" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl w-fit mb-4`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-xl font-black ${stat.color === 'rose' ? 'text-rose-600' : 'text-slate-800'}`}>{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">আয়ের গ্রাফ (ক্যাটাগরি অনুযায়ী)</h4>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <PlayCircle className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">এখনও কোনো তথ্য নেই</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              সাম্প্রতিক লেনদেন
            </h4>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">লাইভ</span>
          </div>
          <div className="flex-1 space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-emerald-100 hover:bg-white transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 bg-white shadow-sm rounded-xl group-hover:scale-110 transition-transform ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {CATEGORY_ICONS[tx.category] || <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{CATEGORY_LABELS[tx.category] || tx.category}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(tx.timestamp).toLocaleDateString('bn-BD')} | {new Date(tx.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                    </p>
                    <button 
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-300 italic text-sm">
                কোনো লেনদেন পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
