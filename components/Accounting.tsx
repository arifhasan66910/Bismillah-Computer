
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Save, History, Trash2, AlertCircle, CheckCircle2, ChevronRight, ListPlus } from 'lucide-react';

interface AccountingProps {
  onAddTransactions: (ts: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
  transactions: Transaction[];
}

const Accounting: React.FC<AccountingProps> = ({ onAddTransactions, onDeleteTransaction, transactions }) => {
  const [type, setType] = useState<TransactionType>('income');
  const [bulkEntries, setBulkEntries] = useState<Record<string, { amount: string, desc: string }>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const incomeCategories = ['Photocopy', 'Stationery', 'Photography', 'Online Form', 'Stamp/Seal', 'Others'];
  const expenseCategories = ['Rent', 'Electricity', 'Salary', 'Stationery', 'Others'];
  
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entriesToSubmit = Object.entries(bulkEntries)
      .filter(([_, data]) => parseFloat(data.amount) > 0)
      .map(([cat, data]) => ({
        id: crypto.randomUUID(),
        type,
        category: cat,
        amount: parseFloat(data.amount),
        description: data.desc,
        timestamp: new Date().toISOString()
      }));

    if (entriesToSubmit.length === 0) {
      setStatus({ type: 'error', msg: 'অন্তত একটি ক্যাটাগরিতে টাকার পরিমাণ দিন' });
      return;
    }

    onAddTransactions(entriesToSubmit);
    setBulkEntries({});
    setStatus({ type: 'success', msg: `${entriesToSubmit.length}টি লেনদেন সফলভাবে সেভ হয়েছে!` });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
      {/* Main Entry Form */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          {/* Form Header */}
          <div className={`px-8 py-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ListPlus className="w-5 h-5 opacity-80" />
                <h3 className="font-black text-2xl tracking-tight">একসাথে অনেক লেনদেন এন্ট্রি</h3>
              </div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">ক্যাটাগরি অনুযায়ী পরিমাণ ও নোট বসান</p>
            </div>
            
            <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm">
              <button 
                onClick={() => { setType('income'); setBulkEntries({}); }} 
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${type === 'income' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>আয় (Income)</span>
              </button>
              <button 
                onClick={() => { setType('expense'); setBulkEntries({}); }} 
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center space-x-2 ${type === 'expense' ? 'bg-white text-rose-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>ব্যয় (Expense)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
            {status && (
              <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-bold">{status.msg}</p>
              </div>
            )}

            <div className="space-y-4">
              {currentCategories.map((cat) => (
                <div 
                  key={cat} 
                  className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-3xl border-2 transition-all ${
                    parseFloat(bulkEntries[cat]?.amount || '0') > 0 
                      ? (type === 'income' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200') 
                      : 'bg-slate-50 border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-[180px]">
                    <div className={`p-3 rounded-2xl bg-white shadow-sm ${parseFloat(bulkEntries[cat]?.amount || '0') > 0 ? (type === 'income' ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}`}>
                      {CATEGORY_ICONS[cat] || <Wallet className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-black text-slate-700">{CATEGORY_LABELS[cat] || cat}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">৳</span>
                      <input 
                        type="number" 
                        placeholder="পরিমাণ" 
                        value={bulkEntries[cat]?.amount || ''}
                        onChange={(e) => handleInputChange(cat, 'amount', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-black outline-none transition-all"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="নোট/বিবরণ..." 
                      value={bulkEntries[cat]?.desc || ''}
                      onChange={(e) => handleInputChange(cat, 'desc', e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট যোগফল</p>
                <h4 className={`text-3xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{calculateTotal().toLocaleString()}</h4>
              </div>
              <button 
                type="submit" 
                className={`w-full md:w-auto px-12 py-5 rounded-[2rem] text-white font-black text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all active:scale-95 ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                <Save className="w-6 h-6" />
                <span>সবগুলো সেভ করুন</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sticky top-24">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>সাম্প্রতিক লেনদেন</span>
            </h4>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">লাইভ</span>
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
                    <p className="text-[9px] font-bold text-slate-400">
                      {new Date(tx.timestamp).toLocaleDateString('bn-BD')} | {new Date(tx.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
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
            {transactions.length === 0 && <p className="text-center text-xs text-slate-400 py-12 italic">কোনো লেনদেন পাওয়া যায়নি।</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
