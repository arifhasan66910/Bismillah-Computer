
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import { Search, UserPlus, Save, Trash2, Phone, CreditCard, Home, User, Users as UsersIcon, Loader2, CheckCircle2 } from 'lucide-react';

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
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentCustomers(data);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.ilike.%${val}%,name.ilike.%${val}%`)
      .limit(5);
    
    if (data) setSuggestions(data);
    setIsSearching(false);
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(customer);
    setSuggestions([]);
    setSearchQuery('');
    setMessage({ type: 'success', text: 'Customer details auto-filled!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', formData.phone)
        .single();

      let error;
      if (existing) {
        // Update existing
        const { error: err } = await supabase
          .from('customers')
          .update(formData)
          .eq('phone', formData.phone);
        error = err;
      } else {
        // Insert new
        const { error: err } = await supabase
          .from('customers')
          .insert([formData]);
        error = err;
      }

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Customer information saved successfully!' });
      setFormData({ name: '', phone: '', nid: '', father_name: '', mother_name: '', address: '' });
      fetchRecentCustomers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving customer' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Customer Management</h3>
            <p className="text-slate-500 text-sm">Search and manage customer records for Online Forms</p>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>
            <input
              type="text"
              placeholder="Search by Name or Phone Number..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
            />
            
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-none"
                  >
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <UserPlus className="w-5 h-5" />
                <h4 className="font-bold">Customer Information Form</h4>
              </div>
              <button 
                onClick={() => setFormData({ name: '', phone: '', nid: '', father_name: '', mother_name: '', address: '' })}
                className="text-emerald-100 hover:text-white text-xs font-bold"
              >
                Clear Form
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Customer Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NID Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.nid}
                      onChange={e => setFormData({...formData, nid: e.target.value})}
                      placeholder="National ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Father's Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.father_name}
                      onChange={e => setFormData({...formData, father_name: e.target.value})}
                      placeholder="Father's Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mother's Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.mother_name}
                      onChange={e => setFormData({...formData, mother_name: e.target.value})}
                      placeholder="Mother's Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={1}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Village, Post, Thana, District"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                <span>Save Customer Record</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-6">
              <UsersIcon className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-800">Recently Added</h4>
            </div>
            
            <div className="space-y-4">
              {recentCustomers.length > 0 ? (
                recentCustomers.map((rc) => (
                  <button
                    key={rc.id}
                    onClick={() => setFormData(rc)}
                    className="w-full text-left p-3 rounded-xl border border-slate-50 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                  >
                    <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-700">{rc.name}</p>
                    <p className="text-xs text-slate-500">{rc.phone}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {rc.created_at ? new Date(rc.created_at).toLocaleDateString() : 'Just now'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100">Load Details</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-slate-400 text-sm py-4">No recent customers</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-xl text-white">
            <h4 className="font-bold mb-2">Pro Tip!</h4>
            <p className="text-sm text-emerald-100 leading-relaxed">
              সিস্টেম অটো-ফিল করার জন্য কাস্টমারের ফোন নম্বর অথবা নামের প্রথম ৩টি অক্ষর টাইপ করুন। পুরাতন কাস্টমার হলে তার এনআইডি এবং ঠিকানা নিজে নিজেই চলে আসবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
