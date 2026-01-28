
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, InventoryLog, Category } from '../types';
import { 
  Package, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, 
  Trash2, Edit3, Loader2, Save, X, AlertTriangle, TrendingUp, ShoppingCart,
  CheckCircle2, Languages
} from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onInventoryAction: (productId: string, type: 'in' | 'out', qty: number, price: number, desc?: string) => Promise<boolean | undefined>;
  refreshData: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onInventoryAction, refreshData }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'logs' | 'manage'>('stock');
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', name_bn: '', category: 'Stationery', purchase_price: 0, sale_price_min: 0, sale_price_max: 0, current_stock: 0, min_stock: 5
  });

  // Stock Action State (Purchase/Sale)
  const [stockAction, setStockAction] = useState<{product_id: string, type: 'in' | 'out', qty: string, price: string} | null>(null);

  useEffect(() => {
    fetchLogsAndCategories();
  }, [activeTab]);

  const fetchLogsAndCategories = async () => {
    setIsLoading(true);
    if (activeTab === 'logs') {
      const { data: lData } = await supabase.from('inventory_logs').select('*, products(name, name_bn)').order('timestamp', { ascending: false }).limit(50);
      if (lData) {
        setLogs(lData.map(l => ({ 
          ...l, 
          product_name: (l as any).products?.name,
          product_name_bn: (l as any).products?.name_bn 
        })));
      }
    }
    const { data: cData } = await supabase.from('categories').select('*');
    if (cData) setCategories(cData);
    setIsLoading(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from('products').upsert(editingProduct ? { ...productForm, id: editingProduct.id } : productForm);
      if (error) throw error;
      setEditingProduct(null);
      setProductForm({ name: '', name_bn: '', category: 'Stationery', purchase_price: 0, sale_price_min: 0, sale_price_max: 0, current_stock: 0, min_stock: 5 });
      refreshData();
    } catch (err) {
      alert('প্রোডাক্ট সেভ করা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAction) return;
    setIsLoading(true);
    
    const qty = parseInt(stockAction.qty);
    const price = parseFloat(stockAction.price);
    
    const success = await onInventoryAction(stockAction.product_id, stockAction.type, qty, price);
    
    if (success) {
      setStockAction(null);
      refreshData();
    }
    setIsLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রডাক্টটি মুছে ফেলতে চান?')) return;
    await supabase.from('products').delete().eq('id', id);
    refreshData();
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || 
      (p.name_bn && p.name_bn.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header & Tabs */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800">ইনভেন্টরি ম্যানেজমেন্ট</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">স্টেশনারি ও প্রডাক্ট ট্র্যাকিং</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setActiveTab('stock')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'stock' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>বর্তমান স্টক</button>
          <button onClick={() => setActiveTab('logs')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'logs' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>কেনা-বেচা লগ</button>
          <button onClick={() => setActiveTab('manage')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'manage' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>প্রডাক্ট লিস্ট</button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট প্রডাক্ট</p>
              <h4 className="text-2xl font-black text-slate-800">{products.length}</h4>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">স্টক শেষ</p>
              <h4 className="text-2xl font-black text-rose-600">{products.filter(p => p.current_stock === 0).length}</h4>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">কম স্টক (Low)</p>
              <h4 className="text-2xl font-black text-amber-600">{products.filter(p => p.current_stock > 0 && p.current_stock <= p.min_stock).length}</h4>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">উপলব্ধ স্টক</p>
              <h4 className="text-2xl font-black text-emerald-800">{products.reduce((acc, p) => acc + p.current_stock, 0)}</h4>
            </div>
          </div>

          {/* Search & List */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="নাম (বাংলা বা ইংরেজি) দিয়ে খুঁজুন..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">প্রডাক্টের নাম</th>
                    <th className="px-8 py-5">ক্যাটাগরি</th>
                    <th className="px-8 py-5 text-center">স্টক পরিমাণ</th>
                    <th className="px-8 py-5 text-right">বিক্রয় সীমা (৳)</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${p.current_stock === 0 ? 'bg-rose-500' : p.current_stock <= p.min_stock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{p.name}</p>
                            <p className="text-xs font-bold text-slate-400">{p.name_bn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase">{p.category}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black ${p.current_stock === 0 ? 'bg-rose-50 text-rose-600' : p.current_stock <= p.min_stock ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                          {p.current_stock}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-sm text-slate-700">
                        ৳{p.sale_price_min} - {p.sale_price_max}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setStockAction({ product_id: p.id!, type: 'in', qty: '', price: p.purchase_price.toString() })}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5"
                            title="মাল কিনুন (Stock In)"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase pr-1">কিনুন</span>
                          </button>
                          <button 
                            onClick={() => setStockAction({ product_id: p.id!, type: 'out', qty: '', price: p.sale_price_min.toString() })}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1.5"
                            title="মাল বিক্রি করুন (Stock Out)"
                            disabled={p.current_stock === 0}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase pr-1">বেচুন</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-300 italic">সার্চ রেজাল্টে কোনো প্রডাক্ট পাওয়া যায়নি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">কেনা ও বিক্রির বিস্তারিত হিসেব</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">তারিখ</th>
                  <th className="px-8 py-5">প্রডাক্ট</th>
                  <th className="px-8 py-5 text-center">টাইপ</th>
                  <th className="px-8 py-5 text-center">পরিমাণ</th>
                  <th className="px-8 py-5 text-right">রেট</th>
                  <th className="px-8 py-5 text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/30">
                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString('bn-BD')}</td>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-700 text-sm">{log.product_name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{log.product_name_bn}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${log.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {log.type === 'in' ? 'ক্রয় (In)' : 'বিক্রয় (Out)'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-slate-600">{log.quantity} পিস</td>
                    <td className="px-8 py-5 text-right font-black text-slate-800 text-sm">৳{log.unit_price}</td>
                    <td className="px-8 py-5 text-right font-black text-emerald-600 text-sm">৳{log.total_price}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-20 text-center text-slate-300 italic">কোনো রেকর্ড পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-left duration-300">
          {/* Form */}
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-24">
              <h4 className="font-black text-slate-800 mb-6 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>{editingProduct ? 'প্রডাক্ট আপডেট করুন' : 'নতুন প্রডাক্ট যোগ করুন'}</span>
              </h4>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">প্রডাক্টের নাম (English)</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. A4 Paper Rim" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">প্রডাক্টের নাম (বাংলা)</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.name_bn} onChange={e => setProductForm({...productForm, name_bn: e.target.value})} placeholder="যেমন: এ৪ পেপার রিম" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ক্যাটাগরি</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                    <option value="Stationery">Stationery</option>
                    <option value="Paper">Paper</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Ink/Toner">Ink/Toner</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ক্রয় মূল্য</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.purchase_price} onChange={e => setProductForm({...productForm, purchase_price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">মিনিমাম স্টক</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.min_stock} onChange={e => setProductForm({...productForm, min_stock: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বিক্রয় রেঞ্জ (Min)</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.sale_price_min} onChange={e => setProductForm({...productForm, sale_price_min: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বিক্রয় রেঞ্জ (Max)</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={productForm.sale_price_max} onChange={e => setProductForm({...productForm, sale_price_max: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <button type="submit" disabled={isLoading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2">
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    <span>সেভ করুন</span>
                  </button>
                  {editingProduct && (
                    <button type="button" onClick={() => { setEditingProduct(null); setProductForm({ name: '', name_bn: '', category: 'Stationery', purchase_price: 0, sale_price_min: 0, sale_price_max: 0, current_stock: 0, min_stock: 5 }); }} className="p-4 bg-slate-100 text-slate-400 rounded-2xl">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h4 className="font-black text-slate-800 text-sm uppercase">প্রডাক্ট কাস্টমাইজেশন তালিকা</h4>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">নাম ও ক্যাটাগরি</th>
                    <th className="px-8 py-5 text-right">ক্রয় মূল্য</th>
                    <th className="px-8 py-5 text-right">বিক্রয় সীমা</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800">{p.name}</p>
                        <p className="text-xs font-bold text-emerald-600">{p.name_bn}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.category}</p>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-600">৳{p.purchase_price}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-600">৳{p.sale_price_min} - {p.sale_price_max}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => { setEditingProduct(p); setProductForm(p); }} className="p-2 text-slate-300 hover:text-emerald-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(p.id!)} className="p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Stock Action Modal */}
      {stockAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 text-white flex items-center justify-between ${stockAction.type === 'in' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <div>
                <h4 className="text-xl font-black">{stockAction.type === 'in' ? 'স্টক ইন (ক্রয়)' : 'স্টক আউট (বিক্রয়)'}</h4>
                <p className="text-[10px] uppercase font-black opacity-80">{products.find(p => p.id === stockAction.product_id)?.name}</p>
              </div>
              <button onClick={() => setStockAction(null)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleStockActionSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পরিমাণ (পিস)</label>
                <input required type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-2xl text-slate-800 outline-none" value={stockAction.qty} onChange={e => setStockAction({...stockAction, qty: e.target.value})} placeholder="0" autoFocus />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ইউনিট রেট (৳)</label>
                <input required type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-xl text-slate-800 outline-none" value={stockAction.price} onChange={e => setStockAction({...stockAction, price: e.target.value})} />
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">মোট টাকা:</span>
                <span className="text-xl font-black text-slate-800">৳{(parseInt(stockAction.qty || '0') * parseFloat(stockAction.price || '0')).toLocaleString()}</span>
              </div>

              <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-3xl text-white font-black text-lg flex items-center justify-center space-x-2 shadow-xl ${stockAction.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}>
                {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                <span>লেনদেন নিশ্চিত করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
