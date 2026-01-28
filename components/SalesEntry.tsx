
import React, { useState } from 'react';
// Import Transaction and ServiceCategory from types
import { ServiceCategory, Transaction } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import { Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SalesEntryProps {
  // Use Transaction type
  onAddSale: (sale: Transaction) => void;
  onDeleteSale: (id: string) => void;
  // Use Transaction type
  sales: Transaction[];
}

const SalesEntry: React.FC<SalesEntryProps> = ({ onAddSale, onDeleteSale, sales }) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('দয়া করে ক্যাটাগরি সিলেক্ট করুন');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    // Use Transaction type and include 'type' property
    const newSale: Transaction = {
      id: crypto.randomUUID(),
      type: 'income',
      category: selectedCategory as string,
      amount: numAmount,
      timestamp: new Date().toISOString()
    };

    onAddSale(newSale);
    setAmount('');
    setSelectedCategory(null);
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
          <h3 className="font-black text-xl tracking-tight">নতুন বিক্রি এন্ট্রি করুন</h3>
          <p className="text-emerald-100 text-xs">দ্রুত লেনদেনের তথ্য সংরক্ষণ করুন</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-bold">সফলভাবে সেভ হয়েছে!</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">সার্ভিস ক্যাটাগরি</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.values(ServiceCategory).map((cat) => (
                <button
                  key={cat as string}
                  type="button"
                  onClick={() => setSelectedCategory(cat as ServiceCategory)}
                  className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 border-emerald-600 text-white scale-105 shadow-xl shadow-emerald-100'
                      : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className={`mb-3 p-2 rounded-xl ${selectedCategory === cat ? 'bg-white/20' : 'bg-slate-200/50'}`}>
                    {CATEGORY_ICONS[cat as string]}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-center">{CATEGORY_LABELS[cat as string]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="amount" className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">টাকার পরিমাণ</label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
                <span className="text-2xl font-black text-emerald-600">৳</span>
              </div>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-8 py-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[2rem] text-3xl font-black text-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all"
          >
            লেনদেন নিশ্চিত করুন
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-slate-800 font-black text-sm">সাম্প্রতিক তালিকা</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">সময়</th>
                <th className="px-8 py-5">সার্ভিস</th>
                <th className="px-8 py-5 text-right">টাকা</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.length > 0 ? (
                sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                      {new Date(sale.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-slate-800">{CATEGORY_LABELS[sale.category]}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-black text-slate-900">৳{sale.amount}</td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => onDeleteSale(sale.id)} className="p-2 text-slate-200 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-300 italic">কোনো বিক্রি নেই।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesEntry;
