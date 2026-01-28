
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
// Fix: Import Transaction instead of SaleRecord
import { Transaction, ServiceCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { TrendingUp, Users, Package, CreditCard, PlayCircle, PlusCircle, UserPlus, FileText } from 'lucide-react';

interface DashboardProps {
  // Fix: Use Transaction type
  sales: Transaction[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  const today = new Date().toLocaleDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
  const totalSalesVal = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTodayVal = todaySales.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryData = Object.values(ServiceCategory).map(cat => ({
    name: CATEGORY_LABELS[cat],
    value: sales.filter(s => s.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">আসসালামু আলাইকুম!</h2>
          <p className="text-emerald-100 font-medium mb-8">বিসমিল্লাহ কম্পিউটার উলিপুর - সেলস ম্যানেজার</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <PlusCircle className="w-6 h-6 mb-2 text-emerald-300" />
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">ধাপ ১</p>
              <p className="text-sm font-bold">নতুন বিক্রি এন্ট্রি করতে 'নতুন বিক্রি' বাটনে যান।</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <UserPlus className="w-6 h-6 mb-2 text-emerald-300" />
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">ধাপ ২</p>
              <p className="text-sm font-bold">কাস্টমার সেভ করতে 'কাস্টমার' ট্যাব ব্যবহার করুন।</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <FileText className="w-6 h-6 mb-2 text-emerald-300" />
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">ধাপ ৩</p>
              <p className="text-sm font-bold">পুরানো হিসাব দেখতে 'হিসাব-নিকাশ' অপশনে যান।</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "আজকের বিক্রি", val: `৳${totalTodayVal}`, icon: <TrendingUp />, color: "emerald" },
          { label: "মোট বিক্রি", val: `৳${totalSalesVal}`, icon: <CreditCard />, color: "blue" },
          { label: "মোট লেনদেন", val: sales.length, icon: <Package />, color: "amber" },
          { label: "কাস্টমার", val: "সক্রিয়", icon: <Users />, color: "purple" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl w-fit mb-3`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-800">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">বি্রক্রির গ্রাফ</h4>
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

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">সাম্প্রতিক লেনদেন</h4>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">লাইভ</span>
          </div>
          <div className="flex-1 space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-emerald-100 hover:bg-white transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white shadow-sm text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                      {CATEGORY_ICONS[sale.category]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{CATEGORY_LABELS[sale.category]}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(sale.timestamp).toLocaleDateString('bn-BD')} | {new Date(sale.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">৳{sale.amount}</p>
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
