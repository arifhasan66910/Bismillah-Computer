
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, UserRole } from '../types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../constants';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, Save, History, 
  Trash2, AlertCircle, CheckCircle2, ListPlus, Settings, Plus, X, Loader2,
  LayoutGrid, PlusCircle, Edit3, RefreshCcw, Search, Calendar, FileText, GripVertical
} from 'lucide-react';

interface AccountingProps {
  onAddTransactions: (ts: Transaction[]) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => Promise<{ success: boolean; error?: string }>;
  onUpdateCategory: (id: string | undefined, updates: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  onReorderCategories: (reordered: Category[]) => void;
  onDeleteTransaction: (id: string) => void;
  transactions: Transaction[];
  userRole: UserRole;
  categories: Category[];
  onDeleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => void;
}

const AVAILABLE_ICONS = [
  'Zap', 'ShoppingBag', 'Camera', 'FileText', 'PenTool', 'Home', 'Lightbulb', 'UserCheck', 
  'MoreHorizontal', 'Package', 'BookOpen', 'Printer', 'Stamp', 'Phone', 'Mail', 'Smartphone',
  'Cpu', 'Monitor', 'MousePointer', 'HardDrive', 'Wifi', 'CreditCard', 'BadgePercent', 'Tag',
  'Briefcase', 'Heart', 'Star', 'Gift', 'Truck', 'Wrench', 'Coffee', 'User', 'Shield'
];

const Accounting: React.FC<AccountingProps> = ({ 
  onAddTransactions, 
  onUpdateTransaction,
  onUpdateCategory,
  onReorderCategories,
  onDeleteTransaction, 
  transactions, 
  userRole, 
  categories, 
  onDeleteCategory,
  refreshData
}) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'list' | 'categories'>('entry');
  const [type, setType] = useState<TransactionType>('income');
  const [bulkEntries, setBulkEntries] = useState<Record<string, { amount: string, desc: string }>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modals state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states for new category
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('income');
  const [newCatIcon, setNewCatIcon] = useState('Zap');
  
  // Category Edit Form States
  const [editLabel, setEditLabel] = useState('');
  const [editName, setEditName] = useState('');

  // Load editing category data when editingCategory state changes
  useEffect(() => {
    if (editingCategory) {
      setEditLabel(editingCategory.label || '');
      setEditName(editingCategory.name || '');
    }
  }, [editingCategory]);

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatLabel.trim() || userRole !== 'admin') return;

    setIsLoading(true);
    try {
      const nextOrder = categories.length;
      const { error } = await supabase.from('categories').insert([{ 
        name: newCatLabel.trim().replace(/\s+/g, '_'), 
        label: newCatLabel.trim(), 
        type: newCatType,
        sort_order: nextOrder
      }]);
      if (error) throw error;
      setNewCatLabel('');
      refreshData();
      setStatus({ type: 'success', msg: 'ক্যাটাগরি সফলভাবে যোগ হয়েছে!' });
      setShowQuickAdd(false);
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'ক্যাটাগরি যোগ করা যায়নি।' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editLabel.trim()) return;
    
    setIsLoading(true);
    const updates: Partial<Category> = { 
      label: editLabel.trim(), 
      name: editName.trim() || editLabel.trim().replace(/\s+/g, '_')
    };

    const res = await onUpdateCategory(editingCategory.id, updates);

    if (res.success) {
      setEditingCategory(null);
      setStatus({ type: 'success', msg: 'ক্যাটাগরি আপডেট হয়েছে!' });
    } else {
      setStatus({ type: 'error', msg: 'আপডেট করা সম্ভব হয়নি: ' + (res.error || '') });
    }
    setIsLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  const handleUpdateTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setIsLoading(true);
    const res = await onUpdateTransaction(editingTransaction.id, {
      amount: editingTransaction.amount,
      description: editingTransaction.description,
      category: editingTransaction.category
    });
    if (res.success) {
      setEditingTransaction(null);
      setStatus({ type: 'success', msg: 'লেনদেনের তথ্য আপডেট হয়েছে!' });
    } else {
      setStatus({ type: 'error', msg: 'আপডেট করা যায়নি।' });
    }
    setIsLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  const handleInputChange = (cat: string, field: 'amount' | 'desc', value: string) => {
    setBulkEntries(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] || { amount: '', desc: '' }), [field]: value }
    }));
  };

  const handleSubmitTransactions = (e: React.FormEvent) => {
    e.preventDefault();
    const entries = (Object.entries(bulkEntries) as [string, { amount: string, desc: string }][])
      .filter(([_, d]) => parseFloat(d.amount) > 0)
      .map(([cat, d]) => ({
        type, category: cat, amount: parseFloat(d.amount), description: d.desc, timestamp: new Date().toISOString()
      })) as any;

    if (entries.length === 0) {
      setStatus({ type: 'error', msg: 'অনুগ্রহ করে অন্তত একটি ঘরে টাকার পরিমাণ দিন।' });
      return;
    }
    onAddTransactions(entries);
    setBulkEntries({});
    setStatus({ type: 'success', msg: 'লেনদেনের তথ্য সফলভাবে সেভ হয়েছে!' });
    setTimeout(() => setStatus(null), 3000);
  };

  const renderIcon = (iconName: string | undefined, name: string, size: string = "w-4 h-4") => {
    if (iconName && (LucideIcons as any)[iconName]) {
      const Icon = (LucideIcons as any)[iconName];
      return <Icon className={size} />;
    }
    return CATEGORY_ICONS[name] || <LucideIcons.Zap className={size} />;
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number, sectionType: TransactionType) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const fullList = [...categories];
    const draggedItem = fullList[draggedIndex];
    const targetItem = fullList[targetIndex];

    if (draggedItem.type !== targetItem.type) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...categories];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    const finalOrder = newOrder.map((cat, i) => ({ ...cat, sort_order: i }));
    onReorderCategories(finalOrder);
    setDraggedIndex(null);
  };

  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  const filteredTxs = transactions.filter(tx => 
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Navigation Header */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-3xl shadow-sm border border-slate-100 no-print">
        <button onClick={() => setActiveTab('entry')} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'entry' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
          <ListPlus className="w-4 h-4" /> <span>লেনদেন এন্ট্রি</span>
        </button>
        <button onClick={() => setActiveTab('list')} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
          <History className="w-4 h-4" /> <span>লেনদেন তালিকা</span>
        </button>
        {userRole === 'admin' && (
          <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'categories' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Settings className="w-4 h-4" /> <span>ক্যাটাগরি কন্ট্রোল</span>
          </button>
        )}
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 no-print animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-bold">{status.msg}</p>
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <div className={`px-8 py-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div>
              <h3 className="font-black text-2xl tracking-tight">লেনদেন হিসাব</h3>
              <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-1">সবগুলো এন্ট্রি একসাথে সেভ করতে পারবেন</p>
            </div>
            <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm no-print">
              <button onClick={() => { setType('income'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70'}`}>আয় (Income)</button>
              <button onClick={() => { setType('expense'); setBulkEntries({}); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-lg' : 'text-white/70'}`}>ব্যয় (Expense)</button>
            </div>
          </div>

          <form onSubmit={handleSubmitTransactions} className="p-8 space-y-6">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {(type === 'income' ? incomeCats : expenseCats).map((cat) => (
                <div key={cat.id || cat.name} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-3xl border-2 transition-all ${parseFloat(bulkEntries[cat.name]?.amount || '0') > 0 ? (type === 'income' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-slate-50 border-transparent'}`}>
                  <div className="flex items-center space-x-4 min-w-[200px]">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                      {renderIcon(cat.icon, cat.name, "w-5 h-5")}
                    </div>
                    <span className="text-sm font-black text-slate-700">{cat.label}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">৳</span>
                      <input type="number" placeholder="পরিমাণ" value={bulkEntries[cat.name]?.amount || ''} onChange={(e) => handleInputChange(cat.name, 'amount', e.target.value)} className="w-full pl-8 pr-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-black outline-none transition-all" />
                    </div>
                    <input type="text" placeholder="নোট বা বিবরণ..." value={bulkEntries[cat.name]?.desc || ''} onChange={(e) => handleInputChange(cat.name, 'desc', e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold outline-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <h4 className={`text-3xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳ {(Object.values(bulkEntries) as { amount: string, desc: string }[]).reduce((a: number, c) => a + (parseFloat(c.amount) || 0), 0).toLocaleString()}</h4>
              <button type="submit" className={`w-full md:w-auto px-12 py-5 rounded-[2rem] text-white font-black text-lg flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                <Save className="w-6 h-6" /> <span>সেভ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center space-x-3">
               <History className="w-6 h-6 text-blue-600" />
               <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">সব লেনদেন তালিকা</h4>
             </div>
             <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="বিবরণ বা ক্যাটাগরি দিয়ে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">তারিখ</th>
                  <th className="px-8 py-5">ক্যাটাগরি</th>
                  <th className="px-8 py-5">বিবরণ</th>
                  <th className="px-8 py-5 text-right">পরিমাণ</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.slice(0, 100).map(tx => (
                  <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-400">{new Date(tx.timestamp).toLocaleDateString('bn-BD')}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className="text-xs font-black text-slate-700">{(categories.find(c=>c.name===tx.category)?.label) || tx.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-500 italic">{tx.description || '-'}</td>
                    <td className={`px-8 py-5 text-right font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{tx.amount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingTransaction(tx)} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-100" title="সম্পাদনা করুন"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteTransaction(tx.id)} className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-100" title="মুছে ফেলুন"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left duration-300">
          {/* Income Cats */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-8 px-2">
              <h4 className="font-black text-emerald-600 text-lg flex items-center gap-2">
                <ArrowDownCircle className="w-6 h-6" /> <span>আয়ের ক্যাটাগরি</span>
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-300 uppercase hidden sm:block">টেনে সাজান</p>
                <button onClick={() => { setNewCatType('income'); setShowQuickAdd(true); }} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat, idx) => cat.type === 'income' && (
                <div 
                  key={cat.id || cat.name} 
                  draggable 
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx, 'income')}
                  className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border-2 transition-all cursor-move ${draggedIndex === idx ? 'opacity-30 border-emerald-500 scale-95 border-dashed' : 'border-transparent hover:border-emerald-100'}`}
                >
                   <div className="flex items-center gap-4">
                     <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                     <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-600">{renderIcon(cat.icon, cat.name)}</div>
                     <span className="text-sm font-black text-slate-700">{cat.label}</span>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setEditingCategory(cat)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors" title="সম্পাদনা করুন"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => onDeleteCategory(cat.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="মুছে ফেলুন"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Cats */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-8 px-2">
              <h4 className="font-black text-rose-600 text-lg flex items-center gap-2">
                <ArrowUpCircle className="w-6 h-6" /> <span>ব্যয়ের ক্যাটাগরি</span>
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-300 uppercase hidden sm:block">টেনে সাজান</p>
                <button onClick={() => { setNewCatType('expense'); setShowQuickAdd(true); }} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat, idx) => cat.type === 'expense' && (
                <div 
                  key={cat.id || cat.name} 
                  draggable 
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx, 'expense')}
                  className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border-2 transition-all cursor-move ${draggedIndex === idx ? 'opacity-30 border-rose-500 scale-95 border-dashed' : 'border-transparent hover:border-rose-100'}`}
                >
                   <div className="flex items-center gap-4">
                     <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-rose-400" />
                     <div className="p-2.5 bg-white rounded-xl shadow-sm text-rose-600">{renderIcon(cat.icon, cat.name)}</div>
                     <span className="text-sm font-black text-slate-700">{cat.label}</span>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setEditingCategory(cat)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors" title="সম্পাদনা করুন"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => onDeleteCategory(cat.id!)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="মুছে ফেলুন"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h5 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-600" /> লেনদেন সংশোধন</h5>
               <button onClick={() => setEditingTransaction(null)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleUpdateTxSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">টাকার পরিমাণ</label>
                  <input type="number" required value={editingTransaction.amount} onChange={e=>setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বিবরণ</label>
                  <input type="text" value={editingTransaction.description || ''} onChange={e=>setEditingTransaction({...editingTransaction, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ক্যাটাগরি</label>
                  <select value={editingTransaction.category} onChange={e=>setEditingTransaction({...editingTransaction, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold appearance-none">
                    {categories.filter(c=>c.type === editingTransaction.type).map(c=>(
                      <option key={c.id || c.name} value={c.name}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-700 transition-all">পরিবর্তন নিশ্চিত করুন</button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h5 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : <Settings className="w-5 h-5 text-emerald-600" />}
                <span>ক্যাটাগরি সম্পাদনা</span>
               </h5>
               <button onClick={() => setEditingCategory(null)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleUpdateCategorySubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ক্যাটাগরির নাম (বাংলা)</label>
                  <input required value={editLabel} onChange={e => {
                    setEditLabel(e.target.value);
                    if (!editName) setEditName(e.target.value.trim().replace(/\s+/g, '_'));
                  }} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">সিস্টেম স্ল্যাগ (Internal Name)</label>
                  <input required value={editName} onChange={e=>setEditName(e.target.value.replace(/\s+/g, '_'))} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-400" />
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                   <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">আইকন বাছাই অপশনটি আপাতত বন্ধ রাখা হয়েছে। আপনার ক্যাটাগরির নামের ওপর ভিত্তি করে সিস্টেম অটোমেটিক আইকন সেট করবে।</p>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl disabled:opacity-50">
                   {isLoading ? 'আপডেট হচ্ছে...' : 'আপডেট নিশ্চিত করুন'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Quick Add Cat Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h5 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><PlusCircle className="w-5 h-5 text-emerald-600" /> নতুন {newCatType === 'income' ? 'আয়' : 'ব্যয়'} ক্যাটাগরি</h5>
               <button onClick={() => setShowQuickAdd(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleAddCategory} className="space-y-6">
                <input required autoFocus value={newCatLabel} onChange={e=>setNewCatLabel(e.target.value)} placeholder="ক্যাটাগরির নাম দিন..." className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-slate-800 shadow-inner" />
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-emerald-700 transition-all">সেভ করুন</button>
             </form>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </div>
  );
};

export default Accounting;
