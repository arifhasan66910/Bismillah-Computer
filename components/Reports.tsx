
import React, { useState, useMemo } from 'react';
import { Transaction, ReportPeriod } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { Calendar, Download, Search, TrendingUp, TrendingDown, Wallet, FileText, ArrowUpRight } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [searchDate, setSearchDate] = useState<string>('');

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const txDateStr = txDate.toISOString().split('T')[0];
      if (searchDate && txDateStr !== searchDate) return false;
      if (!searchDate) {
        const now = new Date();
        if (period === 'daily') return txDate.toDateString() === now.toDateString();
        if (period === 'monthly') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        if (period === 'yearly') return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period, searchDate]);

  const stats = useMemo(() => {
    const income = filteredData.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredData.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, profit: income - expense };
  }, [filteredData]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number, type: string }>();
    filteredData.forEach(tx => {
      const current = map.get(tx.category) || { total: 0, type: tx.type };
      map.set(tx.category, { total: current.total + tx.amount, type: tx.type });
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [filteredData]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">ব্যবসায়িক প্রতিবেদন</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">আয়, ব্যয় ও লাভের সঠিক হিসাব</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            {['daily', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => { setPeriod(p as ReportPeriod); setSearchDate(''); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${period === p && !searchDate ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>
                {p === 'daily' ? 'দৈনিক' : p === 'monthly' ? 'মাসিক' : 'বার্ষিক'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 ring-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <TrendingUp className="text-emerald-500 w-12 h-12 mb-4 opacity-20 absolute -right-2 -top-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আয়</p>
          <h3 className="text-3xl font-black text-emerald-600">৳{stats.income.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <TrendingDown className="text-rose-500 w-12 h-12 mb-4 opacity-20 absolute -right-2 -top-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ব্যয়</p>
          <h3 className="text-3xl font-black text-rose-600">৳{stats.expense.toLocaleString()}</h3>
        </div>
        <div className={`p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white ${stats.profit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <Wallet className="w-12 h-12 mb-4 opacity-20 absolute -right-2 -top-2" />
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">নীট লাভ/ক্ষতি</p>
          <h3 className="text-3xl font-black">৳{stats.profit.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Breakdown Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-black text-slate-800 text-sm">খাত অনুযায়ী বিস্তারিত</h4>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                <tr>
                  <th className="px-8 py-4">ক্যাটাগরি</th>
                  <th className="px-8 py-4">টাইপ</th>
                  <th className="px-8 py-4 text-right">টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryBreakdown.map(([cat, data]) => (
                  <tr key={cat} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">{CATEGORY_ICONS[cat] || <ArrowUpRight className="w-4 h-4" />}</div>
                        <span className="text-sm font-black text-slate-800">{CATEGORY_LABELS[cat] || cat}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${data.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {data.type === 'income' ? 'আয়' : 'ব্যয়'}
                      </span>
                    </td>
                    <td className={`px-8 py-4 text-right font-black text-sm ${data.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{data.total.toLocaleString()}</td>
                  </tr>
                ))}
                {categoryBreakdown.length === 0 && <tr><td colSpan={3} className="py-20 text-center text-slate-300 italic">কোনো তথ্য নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-black mb-2">প্রতিবেদন ডাউনলোড করুন</h4>
            <p className="text-slate-400 text-sm mb-8">পিডিএফ বা এক্সেল ফরম্যাটে আপনার হিসাব ডাউনলোড করে সংরক্ষণ করুন।</p>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl flex flex-col items-center border border-white/5 transition-all">
                <Download className="w-6 h-6 mb-2 text-emerald-400" />
                <span className="text-xs font-bold">PDF রিপোর্ট</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl flex flex-col items-center border border-white/5 transition-all">
                <FileText className="w-6 h-6 mb-2 text-blue-400" />
                <span className="text-xs font-bold">Excel শিট</span>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>বিসমিল্লাহ কম্পিউটার উলিপুর</span>
            <span>২০২৪ এডিশন</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
