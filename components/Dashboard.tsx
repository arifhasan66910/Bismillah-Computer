
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
  TrendingUp, CreditCard, Calendar, Wallet, 
  TrendingDown, Plus, Trash2, CheckCircle2, AlertCircle, Zap, Settings2, X, Save, ShoppingBag, ChevronRight, Search, Loader2, RotateCcw
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  onAddTransaction: (tx: Partial<Transaction>) => Promise<{success: boolean, data?: Transaction[], error?: string}>;
  onInventoryAction: (productId: string, type: 'out' | 'in', qty: number, price: number, desc?: string) => Promise<{success: boolean, data?: Transaction[], error?: string}>;
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
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string, undoId?: string } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [photocopyPresets, setPhotocopyPresets] = useState<number[]>(DEFAULT_PHOTOCOPY_PRESETS);
  const [stationeryPresets, setStationeryPresets] = useState<number[]>(DEFAULT_STATIONERY_PRESETS);
  const [isEditingPresets, setIsEditingPresets] = useState<'Photocopy' | 'Stationery' | null>(null);
  const [presetInput, setPresetInput] = useState('');

  useEffect(() => {
    const savedPhotoPresets = localStorage.getItem('photocopy_presets');
    if (savedPhotoPresets) {
      try { setPhotocopyPresets(JSON.parse(savedPhotoPresets)); } catch (e) { setPhotocopyPresets(DEFAULT_PHOTOCOPY_PRESETS); }
    }
    const savedStatPresets = localStorage.getItem('stationery_presets');
    if (savedStatPresets) {
      try { setStationeryPresets(JSON.parse(savedStatPresets)); } catch (e) { setStationeryPresets(DEFAULT_STATIONERY_PRESETS); }
    }
  }, []);

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
      alert('সঠিক অ্যামাউন্ট লিখুন');
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

  const categoryData = Object.values(ServiceCategory).map(cat => ({
    name: CATEGORY_LABELS[cat as string] || (cat as string),
    value: transactions.filter(s => s.type === 'income' && s.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const handleInstantSale = async (presetValue: number) => {
    if (!selectedCategory || isSubmitting) return;

    const catAtClick = selectedCategory;
    const prodAtClick = selectedProduct;

    setIsSubmitting(true);
    setActivePreset(presetValue);
    setStatus(null);
    
    try {
      let result: {success: boolean, data?: Transaction[], error?: string};
      
      if (catAtClick === 'Stationery' && prodAtClick) {
        result = await onInventoryAction(
          prodAtClick.id!, 
          'out', 
          1, 
          presetValue,
          `ইন্সট্যান্ট বিক্রয়: ${prodAtClick.name_bn || prodAtClick.name}`
        );
      } else {
        result = await onAddTransaction({
          type: 'income',
          category: catAtClick,
          amount: presetValue,
          timestamp: new Date().toISOString(),
          description: catAtClick === 'Stationery' ? 'জেনারেল স্টেশনারি বিক্রয়' : 'ইন্সট্যান্ট বিক্রয়'
        });
      }

      if (result.success) {
        setAmount('');
        setSelectedCategory(null);
        setSelectedProduct(null);
        setProductSearchQuery('');
        
        const addedId = result.data?.[0]?.id;
        setStatus({ 
          type: 'success', 
          msg: 'বিক্রয় সফল হয়েছে!', 
          undoId: addedId 
        });
      } else {
        setStatus({ type: 'error', msg: `ব্যর্থ হয়েছে: ${result.error || 'Unknown database error'}` });
      }
    } catch (err: any) {
      console.error('Logic Error:', err);
      setStatus({ type: 'error', msg: 'অ্যাপ্লিকেশন এরর ঘটেছে' });
    } finally {
      setIsSubmitting(false);
      setActivePreset(null);
      // Automatically clear status after 8 seconds
      setTimeout(() => {
        setStatus(prev => (prev?.undoId ? null : prev));
      }, 8000);
    }
  };

  const handleUndo = (id: string) => {
    onDeleteTransaction(id);
    setStatus(null);
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
    setStatus(null);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800">আসসালামু আলাইকুম!</h2>
          <p className="text-slate-500 font-medium">বিসমিল্লাহ কম্পিউটার উলিপুর - আজকের সারসংক্ষেপ</p>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-right">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">আজকের তারিখ</p>
          <p className="text-sm font-bold text-emerald-800">{new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          দ্রুত বিক্রয় এন্ট্রি (Quick Sale)
        </h4>

        {status && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            <div className="flex items-center gap-3">
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-bold">{status.msg}</p>
            </div>
            {status.type === 'success' && status.undoId && (
              <button 
                onClick={() => handleUndo(status.undoId!)}
                className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                পূর্বাবস্থায় ফেরান (Undo)
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
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

          {selectedCategory === 'Stationery' && (
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ShoppingBag className="w-3 h-3 text-emerald-600" />
                   ইনভেন্টরি প্রডাক্ট বাছাই করুন (ঐচ্ছিক):
                 </h5>
                 <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="প্রডাক্ট খুঁজুন..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-xl text-sm font-bold outline-none shadow-sm"
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredProducts.map(p => (
                   <button
                     key={p.id}
                     onClick={() => { setSelectedProduct(p); setAmount(p.sale_price_min.toString()); }}
                     className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col justify-between h-[70px] ${
                       selectedProduct?.id === p.id ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-50' : 'bg-white border-slate-100 hover:border-emerald-200'
                     }`}
                   >
                     <p className={`text-[10px] font-black line-clamp-2 uppercase tracking-tighter ${selectedProduct?.id === p.id ? 'text-emerald-700' : 'text-slate-800'}`}>
                       {p.name_bn || p.name}
                     </p>
                     <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-bold text-emerald-600">৳{p.sale_price_min}</span>
                        <span className="text-[8px] font-black text-slate-400">S:{p.current_stock}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {selectedCategory && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
              <form onSubmit={handleManualSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-3 text-slate-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 px-2 overflow-hidden">
                  <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">
                    {selectedProduct ? (selectedProduct.name_bn || selectedProduct.name) : CATEGORY_LABELS[selectedCategory]}
                  </span>
                </div>
                <div className="lg:col-span-6 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600">৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="টাকার পরিমাণ"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl text-lg font-black text-slate-800 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="lg:col-span-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || (selectedCategory === 'Stationery' && selectedProduct && selectedProduct.current_stock === 0)}
                    className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'নিশ্চিত করুন'}
                  </button>
                </div>
              </form>

              {(selectedCategory === 'Photocopy' || selectedCategory === 'Stationery') && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">কুইক পে বাটন:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {(selectedCategory === 'Photocopy' ? photocopyPresets : stationeryPresets).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleInstantSale(preset)}
                        disabled={isSubmitting || (selectedCategory === 'Stationery' && selectedProduct && selectedProduct.current_stock === 0)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center gap-2 ${
                          activePreset === preset
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30 shadow-sm active:scale-90'
                        }`}
                      >
                        {activePreset === preset && <Loader2 className="w-3 h-3 animate-spin" />}
                        ৳{preset}
                      </button>
                    ))}
                    <button onClick={() => openPresetEditor(selectedCategory as 'Photocopy' | 'Stationery')} className="p-2 text-slate-300 hover:text-emerald-600 transition-all bg-white border border-slate-100 rounded-xl">
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preset Editor Modal */}
      {isEditingPresets && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              কুইক পে বাটন পরিবর্তন
            </h5>
            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase">কমার ( , ) দিয়ে আলাদা করে টাকার পরিমাণ লিখুন</p>
            <input
              type="text"
              value={presetInput}
              onChange={(e) => setPresetInput(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-slate-800 outline-none mb-6"
              placeholder="10, 20, 50, 100"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleSavePresets} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all">সেভ করুন</button>
              <button onClick={() => setIsEditingPresets(null)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black">বন্ধ</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">আয়ের গ্রাফ</h4>
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
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">এখনও কোনো লেনদেন নেই</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6 px-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> সাম্প্রতিক লেনদেন
          </h4>
          <div className="space-y-3">
            {transactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-emerald-100 transition-all group">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 bg-white shadow-sm rounded-xl ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {CATEGORY_ICONS[tx.category] || <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{CATEGORY_LABELS[tx.category] || tx.category}</p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {tx.description && <span className="text-slate-500">{tx.description} • </span>}
                      {new Date(tx.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'} ৳{tx.amount}
                  </p>
                  <button onClick={() => onDeleteTransaction(tx.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
