
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, UserRole } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { supabase } from '../lib/supabase';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, Save, History, 
  Trash2, AlertCircle, CheckCircle2, ListPlus, Settings, Plus, X, Loader2,
  LayoutGrid, PlusCircle
} from 'lucide-react';

interface AccountingProps {
  onAddTransactions: (ts: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
  transactions: Transaction[];
  userRole: UserRole;
}

const Accounting: React.FC<AccountingProps> = ({ onAddTransactions, onDeleteTransaction, transactions, userRole }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'categories'>('entry');
  const [type, setType] = useState<TransactionType>('income');
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkEntries, setBulkEntries] = useState<Record<string, { amount: string, desc: string }>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // New Category Form State
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('income');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (data) setCategories(data);
  };

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatLabel.trim() || userRole !== 'admin') return;
    
    setIsLoading(true);
    const name = newCatLabel.trim();
    const { error } = await supabase.from('categories').insert([{ 
      name, 
      label: newCatLabel, 
      type: newCatType 
    }]);

    if (!error) {
      setNewCatLabel('');
      await fetchCategories();
      setStatus({ type: 'success', msg: 'নতুন ক্যাটাগরি যোগ হয়েছে!' });
      setShowQuickAdd(false);
    } else {
      setStatus({ type: 'error', msg: 'ক্যাটাগরি যোগ করা যায়নি। হয়তো এই নামে আগে থেকেই আছে।' });
    }
    setIsLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  const deleteCategory = async (id: string) => {
    if (userRole !== 'admin') return;
    if (!confirm('আপনি কি এই ক্যাটাগরি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      fetchCategories();
      setStatus({ type: 'success', msg: 'ক্যাটাগরি মুছে ফেলা হয়েছে।' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleInputChange = (cat: string, field: 'amount' | 'desc', value: string) => {
    setBulkEntries(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || { amount: '', desc: '' }),
        [field]: value
      }
    }));
  };

  const calculateTotal = () => {
    // Add explicit type for curr to fix "Property 'amount' does not exist on type 'unknown'"
    return Object.values(bulkEntries).reduce((acc: number, curr: { amount: string; desc: string }) => acc + (parseFloat(curr.amount) || 0), 0);
  };

  const handleSubmitTransactions = (e: React.FormEvent) => {
    e.preventDefault();
    const entriesToSubmit = Object.entries(bulkEntries)
      // Add explicit type for data to fix "Property 'amount' does not exist on type 'unknown'"
      .filter(([_, data]: [string, { amount: string; desc: string }]) => parseFloat(data.amount) > 0)
      // Add explicit type for data to fix "Property 'amount' and 'desc' does not exist on type 'unknown'"
      .map(([cat, data]: [string, { amount: string; desc: string }]) => ({
        type,
        category: cat,
        amount: parseFloat(data.amount),
        description: data.desc,
        timestamp: new Date().toISOString()
      })) as any;

    if (entriesToSubmit.length === 0) {
      setStatus({ type: 'error', msg: 'অন্তত একটি ক্যাটাগরিতে টাকার পরিমাণ দিন' });
      return;
    }

    onAddTransactions(entriesToSubmit);
    setBulkEntries({});
    setStatus({ type: 'success', msg: `${entriesToSubmit.length}টি লেনদেন সফলভাবে সেভ হয়েছে!` });
    setTimeout(() => setStatus(null), 3000);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 w-fit no-print">
          <button 
            onClick={() => setActiveTab('entry')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'entry' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ListPlus className="w-4 h-4" />
            <span>লেনদেন এন্ট্রি</span>
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'categories' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4" />
              <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
            </button>
          )}
        </div>

        {activeTab === 'entry' ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
            <div className={`px-8 py-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <div>
                <h3 className="font-black text-2xl tracking-tight">লেনদেন হিসাব</h3>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-1">ক্যাটাগরি অনুযায়ী এন্ট্রি দিন</p>
              </div>
              <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm no-print">
                <button onClick={() => { setType('income'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70'}`}>আয় (Income)</button>
                <button onClick={() => { setType('expense'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-lg' : 'text-white/70'}`}>ব্যয় (Expense)</button>
              </div>
            </div>

            <form onSubmit={handleSubmitTransactions} className="p-8 space-y-6">
              {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 no-print animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold">{status.msg}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar no-print">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-3xl border-2 transition-all ${parseFloat(bulkEntries[cat.name]?.amount || '0') > 0 ? (type === 'income' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-center space-x-4 min-w-[160px]">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                        {CATEGORY_ICONS[cat.name] || <Wallet className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-black text-slate-700">{cat.label}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">৳</span>
                        <input type="number" placeholder="পরিমাণ" value={bulkEntries[cat.name]?.amount || ''} onChange={(e) => handleInputChange(cat.name, 'amount', e.target.value)} className="w-full pl-8 pr-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-black outline-none transition-all" />
                      </div>
                      <input type="text" placeholder="নোট..." value={bulkEntries[cat.name]?.desc || ''} onChange={(e) => handleInputChange(cat.name, 'desc', e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold outline-none" />
                    </div>
                  </div>
                ))}

                {userRole === 'admin' && (
                  <button 
                    type="button" 
                    onClick={() => { setNewCatType(type); setShowQuickAdd(true); }}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2 font-black text-xs uppercase"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>নতুন {type === 'income' ? 'আয়' : 'ব্যয়'} ক্যাটাগরি যোগ করুন</span>
                  </button>
                )}
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট পরিমাণ</p>
                  <h4 className={`text-4xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{calculateTotal().toLocaleString()}</h4>
                </div>
                <button type="submit" className={`w-full md:w-auto px-12 py-5 rounded-[2rem] text-white font-black text-lg flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}>
                  <Save className="w-6 h-6" />
                  <span>সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          userRole === 'admin' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300 no-print">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center space-x-2">
                  <LayoutGrid className="w-6 h-6 text-emerald-600" />
                  <span>ক্যাটাগরি কাস্টমাইজ</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* List Income Categories */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" /> আয়ের ক্যাটাগরি সমূহ
                    </h5>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {categories.filter(c => c.type === 'income').map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-emerald-100 transition-all">
                          <span className="text-sm font-black text-slate-700">{cat.label}</span>
                          <button onClick={() => deleteCategory(cat.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* List Expense Categories */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4" /> ব্যয়ের ক্যাটাগরি সমূহ
                    </h5>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {categories.filter(c => c.type === 'expense').map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-rose-100 transition-all">
                          <span className="text-sm font-black text-slate-700">{cat.label}</span>
                          <button onClick={() => deleteCategory(cat.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                 <h4 className="font-black text-lg mb-4">নতুন ক্যাটাগরি যোগ করুন</h4>
                 <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4">
                  <input 
                    required
                    type="text" 
                    placeholder="নাম (যেমন: স্ট্যাম্প বিক্রি)" 
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    className="flex-1 px-6 py-4 bg-white/10 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-white outline-none"
                  />
                  <select 
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                    className="px-6 py-4 bg-white/10 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-white outline-none appearance-none min-w-[150px]"
                  >
                    <option value="income" className="bg-slate-900">আয় (Income)</option>
                    <option value="expense" className="bg-slate-900">ব্যয় (Expense)</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    <span>সেভ</span>
                  </button>
                </form>
              </div>
            </div>
          )
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sticky top-24 no-print">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>সাম্প্রতিক লেনদেন</span>
            </h4>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {transactions.slice(0, 15).map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{CATEGORY_LABELS[tx.category] || tx.category}</p>
                    <p className="text-[9px] font-bold text-slate-400">{new Date(tx.timestamp).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'income' ? '+' : '-'}৳{tx.amount}</p>
                  {userRole === 'admin' && (
                    <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                নতুন {newCatType === 'income' ? 'আয়' : 'ব্যয়'} ক্যাটাগরি
              </h5>
              <button onClick={() => setShowQuickAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ক্যাটাগরির নাম (বাংলায়)</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="যেমন: স্ট্যাম্প বিক্রি" 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-slate-800 outline-none" 
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={isLoading || !newCatLabel.trim()} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  <span>সেভ করুন</span>
                </button>
                <button type="button" onClick={() => setShowQuickAdd(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black">বাতিল</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Accounting;
