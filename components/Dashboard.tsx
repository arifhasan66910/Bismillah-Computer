
import React, { useState, useEffect, useRef } from 'react';
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
import { Transaction, ServiceCategory, Product } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { 
  TrendingUp, CreditCard, PlayCircle, Calendar, Wallet, 
  TrendingDown, Plus, Trash2, CheckCircle2, AlertCircle, Zap, Settings2, X, Save, ShoppingBag, ChevronRight, Search, Loader2
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  onAddTransaction: (tx: Transaction) => void;
  onInventoryAction: (productId: string, type: 'in' | 'out', qty: number, price: number, desc?: string) => Promise<boolean | undefined>;
  onDeleteTransaction: (id: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
const DEFAULT_PHOTOCOPY_PRESETS = [2, 5, 10, 20, 50, 100];
const DEFAULT_STATIONERY_PRESETS = [5, 10, 20, 50, 100, 500];

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, onAddTransaction, onInventoryAction, onDeleteTransaction }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom Presets State
  const [photocopyPresets, setPhotocopyPresets] = useState<number[]>(DEFAULT_PHOTOCOPY_PRESETS);
  const [stationeryPresets, setStationeryPresets] = useState<number[]>(DEFAULT_STATIONERY_PRESETS);
  const [isEditingPresets, setIsEditingPresets] = useState<'Photocopy' | 'Stationery' | null>(null);
  const [presetInput, setPresetInput] = useState('');

  useEffect(() => {
    // Load Photocopy Presets
    const savedPhotoPresets = localStorage.getItem('photocopy_presets');
    if (savedPhotoPresets) {
      try { setPhotocopyPresets(JSON.parse(savedPhotoPresets)); } catch (e) { setPhotocopyPresets(DEFAULT_PHOTOCOPY_PRESETS); }
    }
    // Load Stationery Presets
    const savedStatPresets = localStorage.getItem('stationery_presets');
    if (savedStatPresets) {
      try { setStationeryPresets(JSON.parse(savedStatPresets)); } catch (e) { setStationeryPresets(DEFAULT_STATIONERY_PRESETS); }
    }
  }, []);

  // Auto-focus search input when Stationery is selected
  useEffect(() => {
    if (selectedCategory === 'Stationery' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedCategory]);

  const handleSavePresets = () => {
    const newPresets = presetInput
      .split(',')
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v) && v > 0);
    
    if (newPresets.length === 0) {
      alert('সঠিক অ্যামাউন্ট লিখুন (উদা: ৫, ১০, ২০)');
      return;
    }
    
    if (isEditingPresets === 'Photocopy') {
      setPhotocopyPresets(newPresets);
      localStorage.setItem('photocopy_presets', JSON.stringify(newPresets));
    } else if (isEditingPresets === 'Stationery') {
      setStationeryPresets(newPresets);
      localStorage.setItem('stationery_presets', JSON.stringify(newPresets));
    }
    setIsEditingPresets(null);
  };

  const openPresetEditor = (type: 'Photocopy' | 'Stationery') => {
    const current = type === 'Photocopy' ? photocopyPresets : stationeryPresets;
    setPresetInput(current.join(', '));
    setIsEditingPresets(type);
  };

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

  // Instant Submission for Presets
  const handleInstantSale = async (presetValue: number) => {
    if (!selectedCategory || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      if (selectedCategory === 'Stationery' && selectedProduct) {
        // Product specific sale
        const success = await onInventoryAction(
          selectedProduct.id!, 
          'out', 
          1, 
          presetValue,
          `Quick Sale: ${selectedProduct.name_bn || selectedProduct.name}`
        );
        if (!success) {
          setIsSubmitting(false);
          return;
        }
      } else {
        // General category sale
        const newTx: Transaction = {
          id: crypto.randomUUID(),
          type: 'income',
          category: selectedCategory,
          amount: presetValue,
          timestamp: new Date().toISOString(),
          description: 'Instant Preset Sale'
        };
        onAddTransaction(newTx);
      }

      setAmount('');
      setSelectedCategory(null);
      setSelectedProduct(null);
      setProductSearchQuery('');
      setStatus({ type: 'success', msg: 'বিক্রয় সফল হয়েছে!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'বিক্রয় করা সম্ভব হয়নি' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amount || isNaN(parseFloat(amount))) {
      setStatus({ type: 'error', msg: 'সঠিক তথ্য দিন' });
      return;
    }
    await handleInstantSale(parseFloat(amount));
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setProductSearchQuery('');
    setAmount('');
  };

  const filteredProducts = products.filter(p => {
    if (!productSearchQuery) return true;
    const q = productSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || 
      (p.name_bn && p.name_bn.toLowerCase().includes(q))
    );
  });

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

        <div className="space-y-6">
          {/* Main Category Selection */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.values(ServiceCategory).slice(0, 5).map((cat) => (
              <button
                key={cat as string}
                type="button"
                onClick={() => handleCategorySelect(cat as string)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white scale-105 shadow-lg'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 shadow-sm'
                }`}
              >
                <div className="mb-1">{CATEGORY_ICONS[cat as string]}</div>
                <span className="text-[9px] font-black uppercase text-center">{CATEGORY_LABELS[cat as string]}</span>
              </button>
            ))}
          </div>

          {/* Conditional Sub-menus */}
          {selectedCategory === 'Stationery' && (
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ShoppingBag className="w-3 h-3 text-emerald-600" />
                   প্রডাক্ট খুঁজুন ও নির্বাচন করুন:
                 </h5>
                 <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="প্রডাক্টের নাম লিখুন..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-xl text-sm font-bold outline-none transition-all shadow-sm"
                   />
                   {productSearchQuery && (
                     <button onClick={() => setProductSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-rose-500 transition-colors">
                       <X className="w-3 h-3" />
                     </button>
                   )}
                 </div>
                 {selectedProduct && (
                   <button onClick={() => setSelectedProduct(null)} className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-widest">Clear Selection</button>
                 )}
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredProducts.length > 0 ? filteredProducts.map(p => (
                   <button
                     key={p.id}
                     onClick={() => {
                       setSelectedProduct(p);
                       setAmount(p.sale_price_min.toString());
                     }}
                     className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col justify-between h-[80px] group ${
                       selectedProduct?.id === p.id 
                         ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-100' 
                         : 'bg-white border-slate-100 hover:border-emerald-200'
                     }`}
                   >
                     <p className={`text-[10px] font-black line-clamp-2 leading-tight uppercase tracking-tighter transition-colors ${selectedProduct?.id === p.id ? 'text-emerald-700' : 'text-slate-800'}`}>
                       {p.name_bn || p.name}
                     </p>
                     <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] font-bold ${p.current_stock === 0 ? 'text-rose-500 line-through' : 'text-emerald-600'}`}>৳{p.sale_price_min}</span>
                        <span className={`text-[8px] font-black px-1.5 rounded-md ${p.current_stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{p.current_stock}</span>
                     </div>
                   </button>
                 )) : (
                   <div className="col-span-full py-12 text-center text-slate-300 flex flex-col items-center gap-2">
                     <Search className="w-8 h-8 opacity-20" />
                     <p className="text-xs italic font-bold uppercase tracking-widest">"{productSearchQuery}" নামে কোনো প্রডাক্ট মেলেনি</p>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Amount and Action Area */}
          {(selectedCategory) && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
              <form onSubmit={handleManualSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-3 text-slate-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 px-2 overflow-hidden">
                  <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">
                    {selectedProduct ? (selectedProduct.name_bn || selectedProduct.name) : CATEGORY_LABELS[selectedCategory]}
                  </span>
                </div>
                <div className="lg:col-span-6">
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
                <div className="lg:col-span-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || (selectedCategory === 'Stationery' && selectedProduct?.current_stock === 0)}
                    className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {selectedProduct?.current_stock === 0 ? 'স্টক নেই' : 'নিশ্চিত করুন'}
                  </button>
                </div>
              </form>

              {/* Quick Presets Area - Now with Instant Submit */}
              {(selectedCategory === 'Photocopy' || selectedCategory === 'Stationery') && (
                <div className="flex flex-wrap items-center gap-2 pt-2 animate-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-1.5 mr-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {CATEGORY_LABELS[selectedCategory]} কুইক পে (ইন্সট্যান্ট):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {(selectedCategory === 'Photocopy' ? photocopyPresets : stationeryPresets).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleInstantSale(preset)}
                        disabled={isSubmitting || (selectedCategory === 'Stationery' && selectedProduct?.current_stock === 0)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 active:scale-90 shadow-sm flex items-center gap-1.5 ${
                          amount === preset.toString()
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                        }`}
                      >
                        ৳{preset}
                      </button>
                    ))}
                    <button 
                      type="button"
                      onClick={() => openPresetEditor(selectedCategory as 'Photocopy' | 'Stationery')}
                      className="p-2 text-slate-300 hover:text-emerald-600 transition-all ml-1 bg-white border border-slate-100 rounded-xl"
                      title="বাটন কাস্টমাইজ করুন"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preset Customization Modal */}
      {isEditingPresets && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-black text-sm uppercase tracking-wider">{CATEGORY_LABELS[isEditingPresets]} বাটন কাস্টমাইজ</h4>
              </div>
              <button onClick={() => setIsEditingPresets(null)} className="p-1 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">টাকার পরিমাণগুলো লিখুন (কমা দিয়ে)</label>
                <input 
                  type="text" 
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                  placeholder="যেমন: ২, ৫, ১০, ২০"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-xl font-bold text-slate-800 outline-none"
                  autoFocus
                />
                <p className="text-[9px] text-slate-400 font-medium px-1">উদাহরণ: ২, ৫, ১০, ২০, ৫০, ১০০</p>
              </div>
              <button 
                onClick={handleSavePresets}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-50 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

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
                        {tx.service_name && <span className="text-emerald-600">{tx.service_name} • </span>}
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
