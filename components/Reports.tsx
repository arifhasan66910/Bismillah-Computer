
import React, { useState, useMemo } from 'react';
import { Transaction, ReportPeriod } from '../types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../constants';
import { 
  Printer, ArrowDownCircle, ArrowUpCircle, Wallet, 
  Calendar, FileText, ListFilter, LayoutGrid, List,
  CalendarDays, ChevronDown, CheckCircle2, Zap, BarChart3
} from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [period, setPeriod] = useState<ReportPeriod | 'custom' | 'single'>('daily');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewFilter, setViewFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Filter the raw data based on selected time period and filter type
  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const txDateStr = txDate.toISOString().split('T')[0];
      
      let matchesPeriod = true;
      if (period === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        matchesPeriod = txDateStr === today;
      } else if (period === 'single') {
        matchesPeriod = txDateStr === singleDate;
      } else if (period === 'monthly') {
        const now = new Date();
        matchesPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (period === 'yearly') {
        const now = new Date();
        matchesPeriod = txDate.getFullYear() === now.getFullYear();
      } else if (period === 'custom') {
        matchesPeriod = txDateStr >= startDate && txDateStr <= endDate;
      }

      const matchesFilter = viewFilter === 'all' ? true : tx.type === viewFilter;
      
      return matchesPeriod && matchesFilter;
    });
  }, [transactions, period, startDate, endDate, singleDate, viewFilter]);

  // "Smart Stats" derived directly from the filtered dataset
  const stats = useMemo(() => {
    const income = filteredData.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredData.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    if (period === 'daily') return 'আজকের পূর্ণাঙ্গ প্রতিবেদন';
    if (period === 'single') return `তারিখের প্রতিবেদন: ${new Date(singleDate).toLocaleDateString('bn-BD')}`;
    if (period === 'monthly') return `চলতি মাসের প্রতিবেদন (${new Date().toLocaleDateString('bn-BD', {month: 'long'})})`;
    if (period === 'yearly') return `বার্ষিক প্রতিবেদন (${new Date().getFullYear()})`;
    return `প্রতিবেদন: ${new Date(startDate).toLocaleDateString('bn-BD')} - ${new Date(endDate).toLocaleDateString('bn-BD')}`;
  };

  return (
    <div className="space-y-8 pb-24 report-container animate-in fade-in duration-700">
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; color: #000 !important; }
          .no-print { display: none !important; }
          .report-container { padding: 0 !important; width: 100% !important; }
          
          .print-header {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 25px;
            margin-bottom: 40px;
          }
          .print-header h1 { font-size: 30pt; font-weight: 900; margin: 0; letter-spacing: -1.5px; }
          .print-header p { font-size: 13pt; margin: 8px 0 0; font-weight: bold; color: #444; }

          .print-stats {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            margin-bottom: 40px;
            gap: 20px;
          }
          .print-card {
            border: 1px solid #000;
            padding: 20px;
            text-align: center;
            border-radius: 15px;
          }
          .print-card p { font-size: 11pt; margin: 0; font-weight: 900; text-transform: uppercase; color: #000; }
          .print-card h2 { font-size: 22pt; margin: 8px 0 0; font-weight: 900; }

          table { width: 100% !important; border-collapse: collapse !important; margin-top: 15px !important; }
          th { background-color: #f3f4f6 !important; color: #000 !important; border: 1.5px solid #000 !important; padding: 14px 10px !important; font-size: 11pt; text-align: left; font-weight: 900; }
          td { border: 1px solid #000 !important; padding: 12px 10px !important; font-size: 10.5pt; color: #000; font-weight: 500; }
          
          .print-footer {
            margin-top: 80px;
            display: flex !important;
            justify-content: space-between;
            padding: 0 50px;
          }
          .sig-box { text-align: center; border-top: 2px solid #000; width: 200px; padding-top: 10px; font-size: 11pt; font-weight: 900; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Control Panel / Navigation (UI ONLY) */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 space-y-10 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-40"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-emerald-400 shadow-2xl">
              <BarChart3 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">সম্পূর্ণ হিসাব প্রতিবেদন</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">বিসমিল্লাহ কম্পিউটার উলিপুর</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-5">
            <div className="bg-slate-100 p-2 rounded-[2.5rem] flex items-center shadow-inner">
              {[
                { id: 'daily', label: 'আজ', icon: <Zap className="w-4 h-4" /> },
                { id: 'single', label: 'তারিখ', icon: <CalendarDays className="w-4 h-4" /> },
                { id: 'monthly', label: 'মাস', icon: <ListFilter className="w-4 h-4" /> },
                { id: 'yearly', label: 'বছর', icon: <LayoutGrid className="w-4 h-4" /> },
                { id: 'custom', label: 'সীমা', icon: <ChevronDown className="w-4 h-4" /> }
              ].map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setPeriod(p.id as any)} 
                  className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-3 ${period === p.id ? 'bg-white text-emerald-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button 
              onClick={handlePrint} 
              className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-base flex items-center gap-4 shadow-2xl shadow-emerald-100 transition-all active:scale-95"
            >
              <Printer className="w-6 h-6" /> রিপোর্ট প্রিন্ট করুন
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end relative z-10 border-t border-slate-50 pt-10">
          <div className="md:col-span-8">
            {period === 'single' && (
              <div className="space-y-3 animate-in slide-in-from-left-6 duration-300">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">নির্দিষ্ট তারিখ নির্বাচন করুন</label>
                <div className="relative max-w-sm">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
                  <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-3xl font-black text-slate-800 outline-none shadow-sm transition-all" />
                </div>
              </div>
            )}
            {period === 'custom' && (
              <div className="flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-left-6 duration-300">
                <div className="w-full space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">শুরুর তারিখ</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-3xl font-black text-slate-800 outline-none shadow-sm transition-all" />
                </div>
                <div className="text-slate-300 font-black mt-8 text-xl">থেকে</div>
                <div className="w-full space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">শেষ তারিখ</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-3xl font-black text-slate-800 outline-none shadow-sm transition-all" />
                </div>
              </div>
            )}
            {(period === 'daily' || period === 'monthly' || period === 'yearly') && (
              <div className="flex items-center gap-4 py-6 text-slate-500 font-black text-lg">
                 <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                 <span>বর্তমানে <b className="text-slate-800">{getReportTitle()}</b> প্রদর্শিত হচ্ছে</span>
              </div>
            )}
          </div>

          <div className="md:col-span-4 space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-6">লেনদেনের ধরন (ফিল্টার)</label>
            <div className="bg-slate-100 p-2 rounded-3xl flex items-center shadow-inner">
              <button onClick={() => setViewFilter('all')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase transition-all ${viewFilter === 'all' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-500'}`}>সব</button>
              <button onClick={() => setViewFilter('income')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase transition-all ${viewFilter === 'income' ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-slate-500'}`}>আয়</button>
              <button onClick={() => setViewFilter('expense')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase transition-all ${viewFilter === 'expense' ? 'bg-rose-600 text-white shadow-xl scale-105' : 'text-slate-500'}`}>ব্যয়</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Area */}
      <div className="printable-report">
        
        {/* SHOP LOGO/HEADER FOR PRINT */}
        <div className="print-only print-header">
          <h1>বিসমিল্লাহ কম্পিউটার উলিপুর</h1>
          <p>বাজার রোড, উলিপুর, কুড়িগ্রাম</p>
          <div style={{marginTop: '20px', padding: '10px 40px', background: '#000', color: '#fff', borderRadius: '50px', fontSize: '12pt', fontWeight: '900', display: 'inline-block'}}>
            {getReportTitle().toUpperCase()}
          </div>
          <p style={{fontSize: '10pt', color: '#666', marginTop: '15px'}}>রিপোর্ট প্রকাশের সময়: {new Date().toLocaleString('bn-BD')}</p>
        </div>

        {/* Reactive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {(viewFilter === 'all' || viewFilter === 'income') && (
            <div className={`bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 print-card transition-all ${viewFilter === 'income' ? 'ring-4 ring-emerald-500 scale-[1.03] shadow-emerald-100' : ''}`}>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-3">
                <ArrowDownCircle className="w-5 h-5" /> মোট আয় (Total Income)
              </p>
              <h2 className="text-4xl font-black text-emerald-800 tracking-tighter">৳{stats.income.toLocaleString()}</h2>
            </div>
          )}
          
          {(viewFilter === 'all' || viewFilter === 'expense') && (
            <div className={`bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 print-card transition-all ${viewFilter === 'expense' ? 'ring-4 ring-rose-500 scale-[1.03] shadow-rose-100' : ''}`}>
              <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-3">
                <ArrowUpCircle className="w-5 h-5" /> মোট ব্যয় (Total Expense)
              </p>
              <h2 className="text-4xl font-black text-rose-800 tracking-tighter">৳{stats.expense.toLocaleString()}</h2>
            </div>
          )}

          {/* This card reacts dynamically to the filter for a smarter balance view */}
          <div className={`p-10 rounded-[3rem] shadow-2xl print-card transition-all ${
            viewFilter === 'all' ? (stats.balance >= 0 ? 'bg-slate-900 text-white shadow-slate-300' : 'bg-rose-900 text-white shadow-rose-300') :
            viewFilter === 'income' ? 'bg-emerald-900 text-white shadow-emerald-200' : 'bg-rose-950 text-white shadow-rose-200'
          }`}>
            <p className="text-[11px] font-black uppercase tracking-widest mb-3 opacity-70 flex items-center justify-center md:justify-start gap-3">
              <Wallet className="w-5 h-5" /> 
              {viewFilter === 'all' ? 'বর্তমান স্থিতি (Net Balance)' : viewFilter === 'income' ? 'ফিল্টারকৃত মোট আয়' : 'ফিল্টারকৃত মোট ব্যয়'}
            </p>
            <h2 className="text-4xl font-black tracking-tighter">
              ৳{viewFilter === 'all' ? stats.balance.toLocaleString() : (viewFilter === 'income' ? stats.income.toLocaleString() : stats.expense.toLocaleString())}
            </h2>
          </div>
        </div>

        {/* Detailed Transaction List Table */}
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 no-print"></div>
          
          <div className="p-10 border-b border-slate-50 flex items-center justify-between no-print relative z-10">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter">
              <List className="w-6 h-6 text-emerald-600" /> বিস্তারিত লেনদেন তালিকা
            </h4>
            <span className="text-xs font-black text-slate-400 bg-slate-100 px-6 py-2.5 rounded-full uppercase tracking-widest">মোট রেকর্ড: {filteredData.length}টি</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-10 py-8">তারিখ ও সময়</th>
                  <th className="px-10 py-8">ক্যাটাগরি</th>
                  <th className="px-10 py-8">বিবরণ (নোট)</th>
                  <th className="px-10 py-8 text-center">টাইপ</th>
                  <th className="px-10 py-8 text-right">টাকার পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <p className="text-sm font-black text-slate-800">{new Date(tx.timestamp).toLocaleDateString('bn-BD')}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(tx.timestamp).toLocaleTimeString('bn-BD', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className={`no-print p-3 rounded-2xl bg-white shadow-sm border border-slate-50 ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {CATEGORY_ICONS[tx.category] || <Wallet className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-black text-slate-700">{CATEGORY_LABELS[tx.category] || tx.category}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-sm font-bold text-slate-500 max-w-sm italic">{tx.description || '-'}</p>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                         {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                       </span>
                    </td>
                    <td className={`px-10 py-8 text-right font-black text-lg ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                       <div className="flex flex-col items-center justify-center opacity-10">
                          <FileText className="w-24 h-24 mb-6" />
                          <p className="font-black text-2xl uppercase tracking-widest">কোনো তথ্য নেই</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
              
              {filteredData.length > 0 && (
                <tfoot className="bg-slate-900 text-white print:bg-slate-100 print:text-black">
                  <tr>
                    <td colSpan={4} className="px-10 py-8 font-black uppercase text-xs tracking-widest">সর্বমোট পরিমাণ ({viewFilter === 'all' ? 'আয় - ব্যয়' : viewFilter === 'income' ? 'আয়' : 'ব্যয়'})</td>
                    <td className="px-10 py-8 text-right font-black text-2xl">
                      {viewFilter === 'income' ? `+ ৳${stats.income.toLocaleString()}` : 
                       viewFilter === 'expense' ? `- ৳${stats.expense.toLocaleString()}` : 
                       `৳${stats.balance.toLocaleString()}`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Footer for Print - Authority Signatures */}
        <div className="print-only print-footer">
          <div className="sig-box">রিপোর্ট প্রস্তুতকারীর স্বাক্ষর</div>
          <div className="sig-box">মালিকের স্বাক্ষর ও সীল</div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Reports;
