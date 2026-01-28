
import React from 'react';
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
import { TrendingUp, CreditCard, PlayCircle, Calendar, Wallet, TrendingDown } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
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

  // Chart Data (Income by category for the graph)
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  // Fixed: Cast cat to string for Record indexing to satisfy TypeScript
  const categoryData = Object.values(ServiceCategory).map(cat => ({
    name: CATEGORY_LABELS[cat as string] || (cat as string),
    value: incomeTransactions.filter(s => s.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* Simple Header */}
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
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">সাম্প্রতিক লেনদেন</h4>
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
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                    </p>
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
