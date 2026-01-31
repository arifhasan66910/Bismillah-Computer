
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, Product, Category, UserRole, ViewType } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import * as LucideIcons from 'lucide-react';
import { 
  Zap, Loader2, CheckCircle2, AlertCircle, 
  ShoppingBag, Trash2, X, History, BarChart3, Printer, TrendingUp, PieChart,
  PlusCircle, MinusCircle, RotateCcw, RotateCw
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  onAddTransaction: (tx: Partial<Transaction>) => Promise<{success: boolean, data?: Transaction[], error?: string}>;
  onInventoryAction: (productId: string, type: 'out' | 'in', qty: number, price: number, desc?: string) => Promise<{success: boolean, data?: Transaction[], error?: string}>;
  onDeleteTransaction: (id: string) => void;
  userRole: UserRole;
  setActiveView?: (view: ViewType) => void;
}

const QUICK_PRESETS = [5, 10, 20, 50, 100, 500];

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, categories, onAddTransaction, onInventoryAction, onDeleteTransaction, userRole, setActiveView }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memoData, setMemoData] = useState<Transaction | null>(null);
  
  // Undo/Redo State
  const [lastAction, setLastAction] = useState<{
    id: string;
    type: 'add' | 'delete';
    data: Partial<Transaction>;
  } | null>(null);
  
  const [status, setStatus] = useState<{ 
    type: 'success' | 'error' | 'undo', 
    msg: string,
    actionId?: string
  } | null>(null);
  
  const statusTimeoutRef = useRef<number | null>(null);

  const todayTransactions = useMemo(() => transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    const today = new Date();
    return (
      txDate.getDate() === today.getDate() &&
      txDate.getMonth() === today.getMonth() &&
      txDate.getFullYear() === today.getFullYear()
    );
  }), [transactions]);

  const categorySummary = useMemo(() => {
    const incomeMap = new Map<string, { total: number, count: number, icon?: string }>();
    let grandTotal = 0;
    
    todayTransactions.forEach(tx => {
      if (tx.type === 'income') {
        const catObj = categories.find(c => c.name === tx.category);
        const current = incomeMap.get(tx.category) || { total: 0, count: 0, icon: catObj?.icon };
        incomeMap.set(tx.category, { total: current.total + tx.amount, count: current.count + 1, icon: current.icon });
        grandTotal += tx.amount;
      }
    });
    
    return {
      income: Array.from(incomeMap.entries()).sort((a, b) => b[1].total - a[1].total),
      grandTotal
    };
  }, [todayTransactions, categories]);

  const getCategoryLabel = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.label || CATEGORY_LABELS[catName] || catName;
  };

  const renderIcon = (cat: Category | string, size: string = "w-5 h-5") => {
    let iconName = typeof cat === 'string' ? categories.find(c => c.name === cat)?.icon : cat.icon;
    let fallbackName = typeof cat === 'string' ? cat : cat.name;

    if (iconName && (LucideIcons as any)[iconName]) {
      const IconComponent = (LucideIcons as any)[iconName];
      return <IconComponent className={size} />;
    }
    return CATEGORY_ICONS[fallbackName] || <LucideIcons.Zap className={size} />;
  };

  const handleInstantSale = async (cat: Category, val: number) => {
    if (isSubmitting || isNaN(val) || val <= 0) return;

    setIsSubmitting(true);
    setStatus(null);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    
    try {
      const txData: Partial<Transaction> = {
        type: cat.type,
        category: cat.name,
        amount: val,
        timestamp: new Date().toISOString(),
        description: 'কুইক এন্ট্রি'
      };

      const result = await onAddTransaction(txData);

      if (result.success && result.data && result.data[0]) {
        const newTx = result.data[0];
        setLastAction({ id: newTx.id, type: 'add', data: txData });
        setStatus({ 
          type: 'success', 
          msg: `${cat.label} ৳${val} যোগ হয়েছে!`,
          actionId: newTx.id
        });
        setAmount('');
      } else {
        setStatus({ type: 'error', msg: `ব্যর্থ হয়েছে: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'সার্ভার এরর' });
    } finally {
      setIsSubmitting(false);
      statusTimeoutRef.current = window.setTimeout(() => setStatus(null), 6000);
    }
  };

  const handleUndo = async () => {
    if (!lastAction || lastAction.type !== 'add') return;
    
    onDeleteTransaction(lastAction.id);
    setStatus({ 
      type: 'undo', 
      msg: 'লেনদেনটি বাতিল করা হয়েছে।',
    });
    setLastAction({ ...lastAction, type: 'delete' }); // For redo
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatus(null), 6000);
  };

  const handleRedo = async () => {
    if (!lastAction || lastAction.type !== 'delete') return;
    
    setIsSubmitting(true);
    const result = await onAddTransaction(lastAction.data);
    if (result.success && result.data && result.data[0]) {
      const newTx = result.data[0];
      setLastAction({ id: newTx.id, type: 'add', data: lastAction.data });
      setStatus({ 
        type: 'success', 
        msg: 'লেনদেনটি আবার যোগ করা হয়েছে!',
        actionId: newTx.id
      });
    }
    setIsSubmitting(false);
  };

  const handlePrintMemo = (tx: Transaction) => {
    setMemoData(tx);
    setTimeout(() => {
      window.print();
      setMemoData(null);
    }, 300);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <style>{`
        @media print {
          .no-print, .sidebar-comp, .header-comp, nav, button { display: none !important; }
          body { background: white !important; font-family: 'Hind Siliguri', sans-serif !important; }
          .memo-print-area { display: block !important; width: 80mm !important; margin: 0 auto !important; padding: 10px !important; color: black !important; }
        }
        .memo-print-area { display: none; }
        .tap-scale:active { transform: scale(0.95); }
        .quick-btn:active { background-color: rgba(0,0,0,0.1); }
      `}</style>

      {/* Memo Template */}
      {memoData && (
        <div className="memo-print-area text-center">
          <h2 className="text-xl font-black m-0 uppercase tracking-tighter">বিসমিল্লাহ কম্পিউটার</h2>
          <p className="text-[10px] font-bold m-0 mb-4 opacity-70">বাজার রোড, উলিপুর, কুড়িগ্রাম</p>
          <div className="border-y-2 border-black py-2 mb-4">
            <h4 className="text-sm font-black uppercase m-0">ক্যাশ মেমো / রসিদ</h4>
          </div>
          <div className="text-left text-[11px] space-y-1 mb-5">
            <div className="flex justify-between"><span>ট্রানজ্যাকশন আইডি:</span> <span>#{memoData.id.slice(0,8).toUpperCase()}</span></div>
            <div className="flex justify-between"><span>তারিখ ও সময়:</span> <span>{new Date(memoData.timestamp).toLocaleString('bn-BD')}</span></div>
          </div>
          <div className="border-b-2 border-black pb-2 mb-2">
            <div className="flex justify-between font-black text-xs"><span>বিবরণ</span><span>পরিমাণ</span></div>
          </div>
          <div className="flex justify-between text-sm mb-6 pt-2">
            <span className="font-bold">{getCategoryLabel(memoData.category)}</span>
            <span className="font-black">৳{memoData.amount.toLocaleString('bn-BD')}</span>
          </div>
          <div className="border-t-2 border-black pt-3 flex justify-between font-black text-base">
            <span>সর্বমোট টাকা:</span>
            <span>৳{memoData.amount.toLocaleString('bn-BD')}</span>
          </div>
        </div>
      )}

      {/* Top Welcome Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 no-print overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-emerald-400 shadow-2xl">
             <Zap className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">বিসমিল্লাহ কম্পিউটার</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">আজকের মোট এন্ট্রি: {todayTransactions.length}টি</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="bg-emerald-50 px-8 py-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center sm:items-end justify-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">আজকের মোট আয়</p>
            <p className="text-3xl font-black text-emerald-800 tracking-tighter">৳{categorySummary.grandTotal.toLocaleString('bn-BD')}</p>
          </div>
        </div>
      </div>

      {/* Floating Action Feedback (Undo/Redo System) */}
      {status && (
        <div className={`fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 no-print border-2 ${
          status.type === 'error' ? 'bg-rose-600 text-white border-rose-500' : 
          status.type === 'undo' ? 'bg-slate-800 text-white border-slate-700' :
          'bg-emerald-600 text-white border-emerald-500'
        }`}>
          {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : status.type === 'undo' ? <RotateCcw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <p className="text-sm font-black whitespace-nowrap">{status.msg}</p>
          
          <div className="h-6 w-px bg-white/20 ml-2"></div>
          
          {status.type === 'success' && (
            <button onClick={handleUndo} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
              <RotateCcw className="w-3 h-3" /> বাতিল
            </button>
          )}
          
          {status.type === 'undo' && (
            <button onClick={handleRedo} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
              <RotateCw className="w-3 h-3" /> আবার যোগ করুন
            </button>
          )}
          
          <button onClick={() => setStatus(null)} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Entry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        <div className="lg:col-span-12 bg-white p-6 md:p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                 <ShoppingBag className="w-6 h-6 text-emerald-600" /> কুইক এন্ট্রি ড্যাশবোর্ড
              </h4>
              {isSubmitting && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Income Categories */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4 border-l-4 border-emerald-500">
                  <h5 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">আয়ের ক্যাটাগরি (Income)</h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {incomeCategories.map((cat) => (
                    <div key={cat.id} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-5 flex flex-col space-y-4 hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          {renderIcon(cat, "w-6 h-6")}
                        </div>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{cat.label}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_PRESETS.slice(0, 5).map(val => (
                          <button
                            key={val}
                            onClick={() => handleInstantSale(cat, val)}
                            disabled={isSubmitting}
                            className="py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all tap-scale shadow-sm"
                          >
                            ৳{val}
                          </button>
                        ))}
                        <button 
                          onClick={() => { setSelectedCategory(cat); setAmount(''); }}
                          className="py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition-all tap-scale shadow-lg"
                        >
                          অন্যান্য
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4 border-l-4 border-rose-500">
                  <h5 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">ব্যয়ের ক্যাটাগরি (Expense)</h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {expenseCategories.map((cat) => (
                    <div key={cat.id} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-5 flex flex-col space-y-4 hover:bg-rose-50 hover:border-rose-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                          {renderIcon(cat, "w-6 h-6")}
                        </div>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{cat.label}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_PRESETS.slice(0, 5).map(val => (
                          <button
                            key={val}
                            onClick={() => handleInstantSale(cat, val)}
                            disabled={isSubmitting}
                            className="py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all tap-scale shadow-sm"
                          >
                            ৳{val}
                          </button>
                        ))}
                        <button 
                          onClick={() => { setSelectedCategory(cat); setAmount(''); }}
                          className="py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-rose-700 transition-all tap-scale shadow-lg"
                        >
                          অন্যান্য
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Modal for "Other" amounts */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl text-white ${selectedCategory.type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                   {renderIcon(selectedCategory, "w-6 h-6")}
                 </div>
                 <div>
                   <h4 className="font-black text-slate-800 text-lg uppercase">{selectedCategory.label}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">টাকার পরিমাণ লিখুন</p>
                 </div>
               </div>
               <button onClick={() => setSelectedCategory(null)} className="p-3 bg-slate-100 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
             </div>
             
             <div className="space-y-6">
               <div className="relative group">
                 <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black ${selectedCategory.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳</span>
                 <input 
                   type="number" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)} 
                   placeholder="0" 
                   autoFocus
                   className={`w-full pl-14 pr-6 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] text-4xl font-black outline-none transition-all ${selectedCategory.type === 'income' ? 'focus:border-emerald-500' : 'focus:border-rose-500'}`} 
                 />
               </div>
               
               <button 
                 onClick={() => { handleInstantSale(selectedCategory, parseFloat(amount)); setSelectedCategory(null); }} 
                 disabled={isSubmitting || !amount} 
                 className={`w-full py-6 rounded-[2rem] text-white font-black text-xl shadow-xl transition-all tap-scale disabled:opacity-50 ${selectedCategory.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
               >
                 {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'নিশ্চিত করুন'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Reports Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        <div className="lg:col-span-12 bg-white p-8 sm:p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
               <PieChart className="w-6 h-6 text-emerald-600" /> আজকের আয়ের বিবরণ
            </h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorySummary.income.map(([catName, data]) => {
              const percentage = categorySummary.grandTotal > 0 ? (data.total / categorySummary.grandTotal) * 100 : 0;
              return (
                <div key={catName} className="p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-emerald-100 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
                      {renderIcon(catName, "w-4 h-4")}
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{percentage.toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] font-black text-slate-800 mb-1">{getCategoryLabel(catName)}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tighter">৳{data.total.toLocaleString('bn-BD')}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{data.count}টি লেনদেন</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white p-6 sm:p-10 rounded-[3.5rem] shadow-sm border border-slate-100 no-print">
        <h4 className="text-xs font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-widest">
          <History className="w-6 h-6 text-emerald-600" /> আজকের সাম্প্রতিক তালিকা
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">সময়</th>
                <th className="px-8 py-5">ক্যাটাগরি</th>
                <th className="px-8 py-5 text-right">টাকা</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayTransactions.length > 0 ? (
                todayTransactions.map(tx => (
                  <tr key={tx.id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('bn-BD', {hour:'2-digit', minute:'2-digit'})}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-white rounded-lg shadow-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {renderIcon(tx.category, "w-4 h-4")}
                        </div>
                        <span className="text-sm font-black text-slate-800">{getCategoryLabel(tx.category)}</span>
                      </div>
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString('bn-BD')}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handlePrintMemo(tx)} className="p-3 bg-white text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeleteTransaction(tx.id)} className="p-3 text-slate-200 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-slate-300 italic font-bold">আজকে এখনও কোনো লেনদেন করা হয়নি।</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
