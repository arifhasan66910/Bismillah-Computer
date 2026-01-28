
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { supabase } from '../lib/supabase';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, Save, History, 
  Trash2, AlertCircle, CheckCircle2, ListPlus, Settings, Plus, X, Loader2 
} from 'lucide-react';

interface AccountingProps {
  onAddTransactions: (ts: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
  transactions: Transaction[];
}

const Accounting: React.FC<AccountingProps> = ({ onAddTransactions, onDeleteTransaction, transactions }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'categories'>('entry');
  const [type, setType] = useState<TransactionType>('income');
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkEntries, setBulkEntries] = useState<Record<string, { amount: string, desc: string }>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('income');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (data) setCategories(data);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    
    setIsLoading(true);
    const name = newCatLabel.trim().replace(/\s+/g, '_');
    const { error } = await supabase.from('categories').insert([{ 
      name, 
      label: newCatLabel, 
      type: newCatType 
    }]);

    if (!error) {
      setNewCatLabel('');
      fetchCategories();
      setStatus({ type: 'success', msg: 'নতুন ক্যাটাগরি যোগ হয়েছে!' });
    } else {
      setStatus({ type: 'error', msg: 'ক্যাটাগরি যোগ করা যায়নি।' });
    }
    setIsLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('আপনি কি এই ক্যাটাগরি মুছে ফেলতে চান?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
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
    return Object.values(bulkEntries).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  };

  const handleSubmitTransactions = (e: React.FormEvent) => {
    e.preventDefault();
    const entriesToSubmit = Object.entries(bulkEntries)
      .filter(([_, data]) => parseFloat(data.amount) > 0)
      .map(([cat, data]) => ({
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
        <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 w-fit">
          <button 
            onClick={() => setActiveTab('entry')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'entry' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ListPlus className="w-4 h-4" />
            <span>লেনদেন এন্ট্রি</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'categories' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Settings className="w-4 h-4" />
            <span>ক্যাটাগরি কাস্টমাইজ</span>
          </button>
        </div>

        {activeTab === 'entry' ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
            <div className={`px-8 py-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <div>
                <h3 className="font-black text-2xl tracking-tight">লেনদেন হিসাব</h3>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-1">সবগুলো এন্ট্রি একসাথে করুন</p>
              </div>
              <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm">
                <button onClick={() => { setType('income'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70'}`}>আয়</button>
                <button onClick={() => { setType('expense'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-lg' : 'text-white/70'}`}>ব্যয়</button>
              </div>
            </div>

            <form onSubmit={handleSubmitTransactions} className="p-8 space-y-6">
              {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold">{status.msg}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCategories.map((cat) => (
                  <div key={cat.name} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-3xl border-2 transition-all ${parseFloat(bulkEntries[cat.name]?.amount || '0') > 0 ? (type === 'income' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-slate-50 border-transparent'}`}>
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
                {filteredCategories.length === 0 && <p className="text-center py-12 text-slate-400 font-bold italic">কোনো ক্যাটাগরি পাওয়া যায়নি। ক্যাটাগরি ম্যানেজ ট্যাব থেকে যোগ করুন।</p>}
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট পরিমাণ</p>
                  <h4 className={`text-4xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{calculateTotal().toLocaleString()}</h4>
                </div>
                <button type="submit" className={`w-full md:w-auto px-12 py-5 rounded-[2rem] text-white font-black text-lg flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  <Save className="w-6 h-6" />
                  <span>সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center space-x-2">
                <Plus className="w-6 h-6 text-emerald-600" />
                <span>নতুন ক্যাটাগরি যোগ করুন</span>
              </h4>
              <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4">
                <input 
                  required
                  type="text" 
                  placeholder="ক্যাটাগরির নাম (বাংলায়)" 
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-800 outline-none"
                />
                <select 
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                  className="px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-800 outline-none appearance-none min-w-[150px]"
                >
                  <option value="income">আয় (Income)</option>
                  <option value="expense">ব্যয় (Expense)</option>
                </select>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  <span>যোগ করুন</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['income', 'expense'].map((t) => (
                <div key={t} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h5 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${t === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t === 'income' ? 'আয় এর ক্যাটাগরি তালিকা' : 'ব্যয় এর ক্যাটাগরি তালিকা'}
                  </h5>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === t).map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200">
                        <span className="font-bold text-slate-700">{cat.label}</span>
                        <button onClick={() => deleteCategory(cat.id!)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sticky top-24">
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
                    <p className="text-xs font-black text-slate-800">{CATEGORY_LABELS[tx.category] || categories.find(c => c.name === tx.category)?.label || tx.category}</p>
                    <p className="text-[9px] font-bold text-slate-400">
                      {tx.description && <span className="text-emerald-600">{tx.description} • </span>}
                      {new Date(tx.timestamp).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'income' ? '+' : '-'}৳{tx.amount}</p>
                  <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
