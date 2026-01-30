
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, Product, Category, UserRole, ServiceCategory, ViewType } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { 
  Zap, Settings2, Search, Loader2, RotateCcw, RotateCw, 
  CheckCircle2, AlertCircle, ArrowDownCircle, ArrowUpCircle, Wallet,
  ShoppingBag, Trash2, X, History, BarChart3, ChevronRight, FileText
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

const GLOBAL_DEFAULT_PRESETS = [5, 10, 20, 50, 100, 500];

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, categories, onAddTransaction, onInventoryAction, onDeleteTransaction, userRole, setActiveView }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  
  const [status, setStatus] = useState<{ 
    type: 'success' | 'error' | 'undo', 
    msg: string, 
    undoId?: string,
    lastAction?: {
      category: string;
      product: Product | null;
      amount: number;
      type: 'income' | 'expense';
    }
  } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusTimeoutRef = useRef<number | null>(null);

  const [allPresets, setAllPresets] = useState<Record<string, number[]>>({});
  const [isEditingPresets, setIsEditingPresets] = useState<string | null>(null);
  const [presetInput, setPresetInput] = useState('');

  useEffect(() => {
    const savedPresets = localStorage.getItem('bismillah_category_presets');
    if (savedPresets) {
      try { setAllPresets(JSON.parse(savedPresets)); } catch (e) { setAllPresets({}); }
    }
  }, []);

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
    const incomeMap = new Map<string, { total: number, count: number }>();
    const expenseMap = new Map<string, { total: number, count: number }>();
    todayTransactions.forEach(tx => {
      const map = tx.type === 'income' ? incomeMap : expenseMap;
      const current = map.get(tx.category) || { total: 0, count: 0 };
      map.set(tx.category, { total: current.total + tx.amount, count: current.count + 1 });
    });
    return {
      income: Array.from(incomeMap.entries()).sort((a, b) => b[1].total - a[1].total),
      expense: Array.from(expenseMap.entries()).sort((a, b) => b[1].total - a[1].total)
    };
  }, [todayTransactions]);

  const getPresetsForCategory = (cat: string) => allPresets[cat] || GLOBAL_DEFAULT_PRESETS;
  const getCategoryLabel = (cat: string) => CATEGORY_LABELS[cat] || cat;

  const handleInstantSale = async (val: number, redoData?: any) => {
    if (isSubmitting || isNaN(val) || val <= 0) return;
    const cat = redoData?.category || selectedCategory;
    const prod = redoData?.product !== undefined ? redoData.product : selectedProduct;
    if (!cat) return;

    setIsSubmitting(true);
    setActivePreset(val);
    setStatus(null);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    
    try {
      let result: {success: boolean, data?: Transaction[], error?: string};
      if (cat === 'Stationery' && prod) {
        result = await onInventoryAction(prod.id!, 'out', 1, val, `বিক্রয়: ${prod.name_bn || prod.name}`);
      } else {
        result = await onAddTransaction({
          type: 'income',
          category: cat,
          amount: val,
          timestamp: new Date().toISOString(),
          description: cat === 'Stationery' ? 'জেনারেল স্টেশনারি বিক্রয়' : 'কুইক সেল'
        });
      }

      if (result.success) {
        setStatus({ 
          type: 'success', 
          msg: redoData ? 'পুনরায় যোগ করা হয়েছে!' : 'বিক্রয় সফল হয়েছে!', 
          undoId: result.data?.[0]?.id,
          lastAction: { category: cat, product: prod, amount: val, type: 'income' }
        });
      } else {
        setStatus({ type: 'error', msg: `ব্যর্থ হয়েছে: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'সার্ভার এরর' });
    } finally {
      setIsSubmitting(false);
      setActivePreset(null);
      statusTimeoutRef.current = window.setTimeout(() => setStatus(null), 10000);
    }
  };

  const handleUndo = (id: string) => {
    if (!status?.lastAction) return;
    onDeleteTransaction(id);
    setStatus({ 
      type: 'undo', 
      msg: 'লেনদেনটি মুছে ফেলা হয়েছে।', 
      lastAction: status.lastAction 
    });
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatus(null), 15000);
  };

  const handleSavePresets = () => {
    if (!isEditingPresets) return;
    const newPresets = presetInput.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
    if (newPresets.length === 0) return;
    const updated = { ...allPresets, [isEditingPresets]: newPresets };
    setAllPresets(updated);
    localStorage.setItem('bismillah_category_presets', JSON.stringify(updated));
    setIsEditingPresets(null);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Top Welcome Card with "Full Report" Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 no-print overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-emerald-400 shadow-2xl">
             <Zap className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">বিসমিল্লাহ কম্পিউটার</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">আজকের মোট কাজ: {todayTransactions.length}টি</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="bg-emerald-50 px-8 py-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center sm:items-end justify-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
              <ArrowDownCircle className="w-3 h-3" /> আজ মোট আয়
            </p>
            <p className="text-3xl font-black text-emerald-800 tracking-tighter">৳{categorySummary.income.reduce((a,c)=>a+c[1].total,0).toLocaleString()}</p>
          </div>
          
          {userRole === 'admin' && setActiveView && (
            <button 
              onClick={() => setActiveView('reports')}
              className="bg-slate-900 hover:bg-emerald-600 text-white px-10 py-6 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl shadow-slate-200 transition-all group active:scale-95"
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 group-hover:opacity-100">সকল লেনদেনের তালিকা</p>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                <span className="text-xl font-black tracking-tight">সম্পূর্ণ হিসাব</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Transaction Success/Undo Status */}
      {status && (
        <div className={`p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4 duration-300 no-print border-2 ${
          status.type === 'error' ? 'bg-red-600 text-white border-red-500' : 
          status.type === 'undo' ? 'bg-slate-900 text-white border-slate-800' : 
          'bg-emerald-600 text-white border-emerald-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              {status.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-base font-black">{status.msg}</p>
              {status.type === 'success' && (
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                  {getCategoryLabel(status.lastAction!.category)}: ৳{status.lastAction!.amount}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status.type === 'success' && status.undoId && (
              <button onClick={() => handleUndo(status.undoId!)} className="px-8 py-3.5 bg-white text-emerald-700 rounded-2xl text-xs font-black uppercase hover:scale-105 transition-all active:scale-95 shadow-lg">
                <RotateCcw className="w-4 h-4 inline mr-2" /> Undo
              </button>
            )}
            <button onClick={() => setStatus(null)} className="p-3 hover:bg-black/10 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
      )}

      {/* Quick Entry Grid */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100 no-print relative overflow-hidden">
        <div className="relative z-10 space-y-12">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
               <ShoppingBag className="w-6 h-6 text-emerald-600" /> কুইক বিক্রয় এন্ট্রি
            </h4>
            {selectedCategory && (
              <button onClick={() => {setSelectedCategory(null); setSelectedProduct(null);}} className="px-6 py-2.5 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all shadow-sm">নতুন সিলেকশন</button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-5">
            {Object.values(ServiceCategory).map((cat) => (
              <button
                key={cat as string}
                onClick={() => { setSelectedCategory(cat as string); setSelectedProduct(null); }}
                className={`relative group flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${
                  selectedCategory === cat ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-2xl z-10' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200 shadow-inner'
                }`}
              >
                <div className={`mb-4 p-4 rounded-2xl ${selectedCategory === cat ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                  {CATEGORY_ICONS[cat as string]}
                </div>
                <span className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">{CATEGORY_LABELS[cat as string]}</span>
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8">
              <div className="lg:col-span-5 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">টাকার পরিমাণ</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-black text-emerald-600">৳</span>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="0" 
                      className="w-full pl-16 pr-8 py-10 bg-slate-50 border-4 border-transparent focus:border-emerald-500 focus:bg-white rounded-[3rem] text-5xl font-black text-slate-800 outline-none transition-all shadow-inner" 
                    />
                  </div>
                  <button 
                    onClick={() => handleInstantSale(parseFloat(amount))} 
                    disabled={isSubmitting || !amount || parseFloat(amount) <= 0} 
                    className="px-14 py-10 bg-slate-900 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-3xl shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    সেভ
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">কুইক বাটন (Presets)</label>
                <div className="grid grid-cols-3 gap-4">
                  {getPresetsForCategory(selectedCategory).map((preset) => (
                    <button 
                      key={preset} 
                      onClick={() => handleInstantSale(preset)} 
                      disabled={isSubmitting} 
                      className={`h-28 rounded-[2.5rem] text-3xl font-black border-4 transition-all active:scale-90 ${activePreset === preset ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl scale-105' : 'bg-white border-slate-50 text-slate-600 hover:border-emerald-400 shadow-lg'}`}
                    >
                      ৳{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary & Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col">
          <h4 className="text-xs font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-widest">
            <History className="w-6 h-6 text-emerald-600" /> আজকের এন্ট্রি সমূহ
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
            {todayTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] group border-2 border-transparent hover:border-slate-200 transition-all">
                 <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-2xl bg-white shadow-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {CATEGORY_ICONS[tx.category] || <Wallet className="w-5 h-5"/>}
                   </div>
                   <div>
                     <p className="text-sm font-black text-slate-800">{getCategoryLabel(tx.category)}</p>
                     <p className="text-[10px] font-bold text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <p className="text-base font-black text-emerald-600">৳{tx.amount}</p>
                   <button onClick={() => onDeleteTransaction(tx.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
              </div>
            ))}
            {todayTransactions.length === 0 && <div className="py-24 text-center text-slate-300 italic text-xs font-black uppercase tracking-widest">আজ কোনো লেনদেন হয়নি</div>}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer hover:bg-emerald-950 transition-all" onClick={() => setActiveView?.('reports')}>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <BarChart3 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black tracking-tight">বিস্তারিত রিপোর্ট দেখুন</h4>
                <p className="text-slate-400 text-sm font-bold mt-1">আজ, এই মাস বা পুরো বছরের বিস্তারিত হিসাব ও প্রিন্ট কপি</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-black group-hover:translate-x-2 transition-transform">
               <span>সম্পূর্ণ হিসাব</span>
               <ChevronRight className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <h4 className="text-[10px] font-black text-emerald-600 mb-8 flex items-center gap-2 uppercase tracking-widest">
                <ArrowDownCircle className="w-5 h-5" /> আজ মোট আয় (ক্যাটাগরি)
              </h4>
              <div className="space-y-4">
                {categorySummary.income.map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-emerald-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">{CATEGORY_ICONS[cat] || <Wallet className="w-5 h-5"/>}</div>
                      <span className="text-sm font-black text-slate-700">{getCategoryLabel(cat)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-emerald-600 tracking-tight">৳{data.total.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.count} বার</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <h4 className="text-[10px] font-black text-rose-600 mb-8 flex items-center gap-2 uppercase tracking-widest">
                <ArrowUpCircle className="w-5 h-5" /> আজ মোট ব্যয় (ক্যাটাগরি)
              </h4>
              <div className="space-y-4">
                {categorySummary.expense.map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-rose-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-rose-600 shadow-sm">{CATEGORY_ICONS[cat] || <Wallet className="w-5 h-5"/>}</div>
                      <span className="text-sm font-black text-slate-700">{getCategoryLabel(cat)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-rose-600 tracking-tight">৳{data.total.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.count} বার</p>
                    </div>
                  </div>
                ))}
                {categorySummary.expense.length === 0 && <div className="py-24 text-center text-slate-300 italic text-xs">আজ কোনো ব্যয় নেই</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
