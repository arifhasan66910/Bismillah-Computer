
import React, { useState, useMemo } from 'react';
import { Transaction, ReportPeriod } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { 
  Printer, FileText, BarChart3, Info, Calendar, 
  ChevronLeft, ChevronRight, Clock, ArrowRight
} from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  const [period, setPeriod] = useState<ReportPeriod | 'custom' | 'single'>('daily');
  const [startDate, setStartDate] = useState<string>(getLocalDate());
  const [endDate, setEndDate] = useState<string>(getLocalDate());
  const [singleDate, setSingleDate] = useState<string>(getLocalDate());
  const [viewFilter, setViewFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const txDateStr = new Date(txDate.getTime() - (txDate.getTimezoneOffset() * 60000))
        .toISOString().split('T')[0];
      
      let matchesPeriod = true;
      if (period === 'daily') {
        matchesPeriod = txDateStr === getLocalDate();
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

  const stats = useMemo(() => {
    const income = filteredData.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredData.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const getReportTitle = () => {
    if (period === 'daily') return 'আজকের রিপোর্ট';
    if (period === 'single') {
      const dateObj = new Date(singleDate);
      return `${dateObj.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })} এর রিপোর্ট`;
    }
    if (period === 'monthly') return `${new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })} এর রিপোর্ট`;
    if (period === 'custom') return `${new Date(startDate).toLocaleDateString('bn-BD')} হতে ${new Date(endDate).toLocaleDateString('bn-BD')} পর্যন্ত রিপোর্ট`;
    return 'রিপোর্ট';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            font-family: 'Hind Siliguri', 'Nikosh', sans-serif !important;
          }
          .report-wrapper { 
            box-shadow: none !important; 
            border: none !important; 
            width: 100% !important; 
            padding: 0 !important;
            background: white !important;
          }
          table { width: 100% !important; border: 1px solid #000 !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 10px !important; color: black !important; }
          .print-stats-card { border: 1px solid #000 !important; background: #fff !important; }
          
          /* Ensuring text contrast for printer */
          .text-emerald-700, .text-emerald-800, .text-emerald-600 { color: black !important; font-weight: bold !important; }
          .text-rose-700, .text-rose-800, .text-rose-600 { color: black !important; font-weight: bold !important; }
        }
      `}</style>

      {/* Control Panel (Screen Only) */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">রিপোর্ট ফিল্টারিং</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নির্দিষ্ট তারিখ অনুযায়ী প্রিন্ট করুন</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => { setPeriod('daily'); setSingleDate(getLocalDate()); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'daily' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              আজ
            </button>
            <button 
              onClick={() => { setPeriod('single'); setSingleDate(getYesterdayDate()); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'single' && singleDate === getYesterdayDate() ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              গতকাল
            </button>
            <button 
              onClick={() => setPeriod('single')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'single' && singleDate !== getYesterdayDate() ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              তারিখ অনুযায়ী
            </button>
            <button 
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              এই মাস
            </button>
            <button 
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'custom' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              কাস্টম রেঞ্জ
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {period === 'single' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> তারিখ নির্বাচন
              </label>
              <input 
                type="date" 
                value={singleDate} 
                onChange={e => setSingleDate(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-slate-800 border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          )}
          
          {period === 'custom' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">শুরু (From)</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-slate-800 border-2 border-transparent focus:border-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">শেষ (To)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-slate-800 border-2 border-transparent focus:border-emerald-500 outline-none" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">লেনদেনের ধরন</label>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setViewFilter('all')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${viewFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>সব</button>
              <button onClick={() => setViewFilter('income')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${viewFilter === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>আয়</button>
              <button onClick={() => setViewFilter('expense')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${viewFilter === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>ব্যয়</button>
            </div>
          </div>

          <div className="pb-1">
            <button 
              type="button"
              onClick={handlePrint} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span>রিপোর্ট প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
           <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
           <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
             <b>নির্দেশনা:</b> প্রিন্ট বাটনে ক্লিক করার পর <b>Destination</b> অপশনে গিয়ে <b>'Save as PDF'</b> সিলেক্ট করলে মোবাইলে বা পিসিতে ফাইলটি সেভ হবে।
           </p>
        </div>
      </div>

      {/* Report Paper - Always visible, formatted for Print */}
      <div className="report-wrapper bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="text-center pb-10 mb-10 border-b-2 border-slate-100">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">বিসমিল্লাহ কম্পিউটার উলিপুর</h1>
          <p className="text-slate-600 font-bold text-base">বাজার রোড, উলিপুর, কুড়িগ্রাম</p>
          <p className="text-slate-500 font-bold text-sm">মোবাইল: ০১৭০০-০০০০০০, ০১৮০০-০০০০০০</p>
          
          <div className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-lg inline-block uppercase tracking-widest shadow-lg">
            {getReportTitle()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="print-stats-card p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">মোট আয় (Income)</p>
            <h2 className="text-4xl font-black text-emerald-800 tracking-tighter">৳{stats.income.toLocaleString('bn-BD')}</h2>
          </div>
          <div className="print-stats-card p-8 bg-rose-50 rounded-[2rem] border border-rose-100 text-center">
            <p className="text-[10px] font-black text-rose-600 uppercase mb-2 tracking-widest">মোট ব্যয় (Expense)</p>
            <h2 className="text-4xl font-black text-rose-800 tracking-tighter">৳{stats.expense.toLocaleString('bn-BD')}</h2>
          </div>
          <div className="print-stats-card p-8 bg-slate-900 rounded-[2rem] text-center shadow-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">নিট স্থিতি (Balance)</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">৳{stats.balance.toLocaleString('bn-BD')}</h2>
          </div>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-[2rem] mb-12">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">তারিখ ও সময়</th>
                <th className="px-8 py-5">ক্যাটাগরি</th>
                <th className="px-8 py-5">বিবরণ / নোট</th>
                <th className="px-8 py-5 text-right">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(tx => (
                <tr key={tx.id} className="text-sm">
                  <td className="px-8 py-5 font-bold text-slate-600">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-300 no-print" />
                      {new Date(tx.timestamp).toLocaleTimeString('bn-BD', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-[10px] block opacity-50 mt-1">{new Date(tx.timestamp).toLocaleDateString('bn-BD')}</span>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800">
                    {CATEGORY_LABELS[tx.category] || tx.category}
                  </td>
                  <td className="px-8 py-5 text-slate-500 italic">
                    {tx.description || '-'}
                  </td>
                  <td className={`px-8 py-5 text-right font-black text-lg ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-10">
                      <FileText className="w-20 h-20 mb-4" />
                      <p className="font-black text-2xl uppercase tracking-widest">কোনো রেকর্ড নেই</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 font-black">
                <tr>
                  <td colSpan={3} className="px-8 py-8 text-right uppercase text-xs tracking-widest text-slate-400">সর্বমোট (Grand Total)</td>
                  <td className="px-8 py-8 text-right text-3xl text-slate-900 tracking-tighter">৳{stats.balance.toLocaleString('bn-BD')}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="hidden print:flex justify-between px-10 gap-20 mt-32">
          <div className="flex flex-col items-center">
            <div className="w-48 border-t-2 border-slate-900 mb-3"></div>
            <p className="font-black text-xs text-slate-800 uppercase tracking-widest">ক্যাশিয়ার / ম্যানেজার</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 border-t-2 border-slate-900 mb-3"></div>
            <p className="font-black text-xs text-slate-800 uppercase tracking-widest">স্বত্বাধিকারী</p>
          </div>
        </div>
        
        <div className="mt-12 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-40">
          Generated on {new Date().toLocaleString('bn-BD')} via Bismillah Computer System
        </div>
      </div>
    </div>
  );
};

export default Reports;
