
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
// Import missing AlertCircle icon
import { Search, UserPlus, Save, Phone, CreditCard, Home, User, Users as UsersIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    nid: '',
    father_name: '',
    mother_name: '',
    address: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchRecentCustomers();
  }, []);

  const fetchRecentCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setRecentCustomers(data);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase.from('customers').select('*').or(`phone.ilike.%${val}%,name.ilike.%${val}%`).limit(5);
    if (data) setSuggestions(data);
    setIsSearching(false);
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(customer);
    setSuggestions([]);
    setSearchQuery('');
    setMessage({ type: 'success', text: 'কাস্টমারের তথ্য লোড হয়েছে!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', formData.phone).single();
      let error;
      if (existing) {
        const { error: err } = await supabase.from('customers').update(formData).eq('phone', formData.phone);
        error = err;
      } else {
        const { error: err } = await supabase.from('customers').insert([formData]);
        error = err;
      }
      if (error) throw error;
      setMessage({ type: 'success', text: 'তথ্য সফলভাবে সেভ হয়েছে!' });
      setFormData({ name: '', phone: '', nid: '', father_name: '', mother_name: '', address: '' });
      fetchRecentCustomers();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'সেভ করতে সমস্যা হয়েছে' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">কাস্টমার তথ্য ও অনুসন্ধান</h3>
            <p className="text-slate-500 text-sm">অনলাইন ফরম ও সার্ভিসের জন্য কাস্টমার ডাটাবেস</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>
            <input
              type="text"
              placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50">
                {suggestions.map((c) => (
                  <button key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 border-b last:border-none">
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">বাছাই করুন</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <h4 className="font-bold">কাস্টমার প্রোফাইল ফরম</h4>
              </div>
              <button onClick={() => setFormData({ name: '', phone: '', nid: '', father_name: '', mother_name: '', address: '' })} className="text-emerald-100 text-xs">মুছে ফেলুন</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">পুরো নাম</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="নাম লিখুন" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">মোবাইল নম্বর</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="017XXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">জাতীয় পরিচয়পত্র (NID)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} placeholder="NID নম্বর" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">পিতার নাম</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} placeholder="পিতার নাম" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">মাতার নাম</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.mother_name} onChange={e => setFormData({...formData, mother_name: e.target.value})} placeholder="মাতার নাম" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">ঠিকানা</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea rows={1} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="ঠিকানা লিখুন" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                <span>তথ্য সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center space-x-2"><UsersIcon className="w-5 h-5" /> <span>সাম্প্রতিক কাস্টমার</span></h4>
            <div className="space-y-4">
              {recentCustomers.map((rc) => (
                <button key={rc.id} onClick={() => setFormData(rc)} className="w-full text-left p-3 rounded-xl border hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                  <p className="font-bold text-sm text-slate-800">{rc.name}</p>
                  <p className="text-xs text-slate-500">{rc.phone}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
