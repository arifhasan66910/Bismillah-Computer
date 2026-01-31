import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Customer, DueRecord, UserRole } from '../types';
// Fixed: Removed non-existent 'WhatsApp' icon and unused imports 'User', 'Phone', 'Save'
import { 
  Search, BookOpen, PlusCircle, MinusCircle, History, 
  Send, Loader2, Trash2, 
  AlertCircle, CheckCircle2, ChevronRight, X, MessageSquare 
} from 'lucide-react';

interface DuesProps {
  userRole: UserRole;
}

const Dues: React.FC<DuesProps> = ({ userRole }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dueRecords, setDueRecords] = useState<DueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Entry Form
  const [entryType, setEntryType] = useState<'credit' | 'payment'>('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: custData } = await supabase.from('customers').select('*').order('name', { ascending: true });
      if (custData) setCustomers(custData);
      
      const { data: recData } = await supabase
        .from('due_records')
        .select('*, customers(name, phone)')
        .order('timestamp', { ascending: false });
      
      if (recData) {
        setDueRecords(recData.map(r => ({
          ...r,
          customer_name: (r as any).customers?.name,
          customer_phone: (r as any).customers?.phone
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const customerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    dueRecords.forEach(r => {
      if (!balances[r.customer_id]) balances[r.customer_id] = 0;
      if (r.type === 'credit') balances[r.customer_id] += r.amount;
      else balances[r.customer_id] -= r.amount;
    });
    return balances;
  }, [dueRecords]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    ).slice(0, 10);
  }, [customers, searchQuery]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || isNaN(parseFloat(amount))) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('due_records').insert([{
        customer_id: selectedCustomer.id,
        amount: parseFloat(amount),
        type: entryType,
        note,
        timestamp: new Date().toISOString()
      }]).select();

      if (error) throw error;
      
      setStatus({ type: 'success', msg: 'রেকর্ড সেভ হয়েছে!' });
      setAmount('');
      setNote('');
      fetchInitialData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const deleteRecord = async (id: string) => {
    if (userRole !== 'admin' || !confirm('মুছে ফেলতে চান?')) return;
    try {
      await supabase.from('due_records').delete().eq('id', id);
      fetchInitialData();
    } catch (err) {
      alert('Error');
    }
  };

  const handleSendReminder = (customer: Customer, bal: number) => {
    const msg = `আসসালামু আলাইকুম ${customer.name}, বিসমিল্লাহ কম্পিউটার উলিপুর থেকে আপনার কাছে মোট ${bal} টাকা বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।`;
    const url = `https://wa.me/88${customer.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Fixed line 120: Added explicit types for reduce parameters to avoid unknown type errors.
  const totalDuesAll = Object.values(customerBalances).reduce((a: number, b: number) => a + (b > 0 ? b : 0), 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Stats */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">বাকীর হিসাব (Credit)</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">কাস্টমার বকেয়া ম্যানেজমেন্ট</p>
          </div>
        </div>
        {userRole === 'admin' && (
          <div className="bg-rose-50 px-8 py-5 rounded-[2rem] border border-rose-100 flex flex-col items-center md:items-end relative z-10">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">মোট বকেয়া (মার্কেটে)</p>
            <h3 className="text-3xl font-black text-rose-700 tracking-tighter">৳{totalDuesAll.toLocaleString()}</h3>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entry Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
               <PlusCircle className="w-4 h-4 text-emerald-600" /> নতুন লেনদেন এন্ট্রি
            </h4>

            {status && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-xs font-bold">{status.msg}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Type Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setEntryType('credit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${entryType === 'credit' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>বাকী দিচ্ছি (Credit)</button>
                <button onClick={() => setEntryType('payment')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${entryType === 'payment' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>টাকা পাচ্ছি (Payment)</button>
              </div>

              {/* Customer Search */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">কাস্টমার বাছাই করুন</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="নাম বা মোবাইল..." 
                    value={selectedCustomer ? selectedCustomer.name : searchQuery}
                    onChange={(e) => {
                      if (selectedCustomer) setSelectedCustomer(null);
                      setSearchQuery(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-800 outline-none"
                  />
                  {selectedCustomer && (
                    <button onClick={() => setSelectedCustomer(null)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-rose-500"><X className="w-4 h-4" /></button>
                  )}
                </div>
                {searchQuery && !selectedCustomer && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-30 overflow-hidden">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setSearchQuery(''); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-none">
                        <div className="text-left">
                          <p className="font-black text-slate-800 text-sm">{c.name}</p>
                          <p className="text-[9px] font-bold text-slate-400">{c.phone}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && <p className="p-4 text-center text-xs text-slate-300">পাওয়া যায়নি</p>}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">টাকার পরিমাণ</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600">৳</span>
                    <input required type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-xl outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">নোট (ঐচ্ছিক)</label>
                  <input type="text" placeholder="বিবরণ..." value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-800 outline-none" />
                </div>
                <button type="submit" disabled={isLoading || !selectedCustomer} className={`w-full py-5 rounded-2xl text-white font-black text-lg shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all ${entryType === 'credit' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'} disabled:opacity-50`}>
                  {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : (entryType === 'credit' ? <MinusCircle className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />)}
                  <span>এন্ট্রি করুন</span>
                </button>
              </form>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <MessageSquare className="absolute -bottom-4 -right-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">কুইক রিমাইন্ডার</h5>
            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
              "কাস্টমারকে তার বকেয়া মনে করিয়ে দিতে ডানদিকের রিমাইন্ডার বাটনে ক্লিক করুন। এটি অটোমেটিক হোয়াটসঅ্যাপে মেসেজ টাইপ করে দিবে।"
            </p>
          </div>
        </div>

        {/* Ledger Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h4 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" /> লেনদেন ইতিহাস
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">কাস্টমার</th>
                    <th className="px-8 py-5 text-center">টাইপ</th>
                    <th className="px-8 py-5 text-right">পরিমাণ</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dueRecords.slice(0, 20).map(r => (
                    <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-700 text-sm">{r.customer_name}</p>
                        <p className="text-[9px] font-bold text-slate-400">{r.note || (r.type === 'credit' ? 'বকেয়া' : 'পরিশোধ')}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${r.type === 'credit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {r.type === 'credit' ? 'বাকী (Out)' : 'জমা (In)'}
                        </span>
                      </td>
                      <td className={`px-8 py-5 text-right font-black text-sm ${r.type === 'credit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ৳{r.amount.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {userRole === 'admin' && (
                          <button onClick={() => deleteRecord(r.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dueRecords.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic">কোনো রেকর্ড নেই</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h4 className="font-black text-slate-800 text-sm uppercase mb-6 flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-emerald-600" /> বর্তমান বকেয়া কাস্টমার তালিকা
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.filter(c => (customerBalances[c.id!] || 0) > 0).map(c => (
                <div key={c.id} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-rose-600 shadow-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{c.name}</p>
                      <p className="text-[10px] font-bold text-rose-600 uppercase">বকেয়া: ৳{customerBalances[c.id!].toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSendReminder(c, customerBalances[c.id!])}
                    className="p-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export default Dues;