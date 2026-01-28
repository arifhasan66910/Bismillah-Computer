
import React, { useState } from 'react';
import { ServiceCategory, SaleRecord } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Trash2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

interface SalesEntryProps {
  onAddSale: (sale: SaleRecord) => void;
  onDeleteSale: (id: string) => void;
  sales: SaleRecord[];
}

const SalesEntry: React.FC<SalesEntryProps> = ({ onAddSale, onDeleteSale, sales }) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a service category');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const newSale: SaleRecord = {
      id: crypto.randomUUID(),
      category: selectedCategory,
      amount: numAmount,
      timestamp: new Date().toISOString()
    };

    onAddSale(newSale);
    setAmount('');
    setSelectedCategory(null);
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
          <h3 className="text-white font-black text-xl tracking-tight">Register New Sale</h3>
          <p className="text-emerald-100 text-xs font-medium">Capture transaction details instantly</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">Sale recorded successfully!</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">
              Service Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.values(ServiceCategory).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 border-emerald-600 text-white scale-105 shadow-xl shadow-emerald-100'
                      : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:scale-102'
                  }`}
                >
                  <div className={`mb-3 p-2 rounded-xl ${selectedCategory === cat ? 'bg-white/20' : 'bg-slate-200/50'}`}>
                    {CATEGORY_ICONS[cat]}
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tighter text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="amount" className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">
              Sale Amount
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="text-2xl font-black text-emerald-600 group-focus-within:text-emerald-500 transition-colors">৳</span>
              </div>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-8 py-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[2rem] text-3xl font-black text-slate-800 transition-all outline-none placeholder:text-slate-300 shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 transition-all active:scale-95 group overflow-hidden relative"
          >
            <span className="relative z-10">Confirm Transaction</span>
            <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-slate-800 font-black text-sm tracking-tight">Recent Activity</h3>
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full uppercase tracking-widest">
            Today
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Time</th>
                <th className="px-8 py-5">Service</th>
                <th className="px-8 py-5 text-right">Price</th>
                <th className="px-8 py-5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.length > 0 ? (
                sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-500">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                          {CATEGORY_ICONS[sale.category]}
                        </div>
                        <span className="text-xs font-black text-slate-800 tracking-tight">{sale.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-black text-slate-900">
                      ৳{sale.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center">
                      <button 
                        onClick={() => onDeleteSale(sale.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-300 font-medium text-sm italic">
                    No transactions captured yet today.
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

export default SalesEntry;
