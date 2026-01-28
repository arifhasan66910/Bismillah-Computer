
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import { 
  Search, UserPlus, Save, Phone, User, Users as UsersIcon, 
  Loader2, CheckCircle2, AlertCircle, ImageIcon, PenTool, X, Trash2,
  GraduationCap, Ruler
} from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const initialFormState: Customer = {
    name: '', name_bn: '', phone: '', email: '', nid: '', dob: '', gender: 'Male', religion: 'Islam', blood_group: '',
    marital_status: 'Single', spouse_name: '', father_name: '', father_name_bn: '', mother_name: '', mother_name_bn: '',
    address: '', height: '', weight: '', chest: '', photo_url: '', signature_url: '',
    edu1_roll: '', edu1_reg: '', edu1_result: '', edu1_group: '', edu1_board: '', edu1_year: '', edu1_inst: '',
    edu2_roll: '', edu2_reg: '', edu2_result: '', edu2_group: '', edu2_board: '', edu2_year: '', edu2_inst: '',
    edu3_subject: '', edu3_result: '', edu3_year: '', edu3_uni: '', edu3_inst: '', edu3_duration: '',
    edu4_subject: '', edu4_result: '', edu4_year: '', edu4_uni: '', edu4_duration: ''
  };

  const [formData, setFormData] = useState<Customer>(initialFormState);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'family' | 'media' | 'edu'>('basic');

  useEffect(() => {
    fetchRecentCustomers();
  }, []);

  const fetchRecentCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(6);
    if (data) setRecentCustomers(data);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase.from('customers').select('*').or(`phone.ilike.%${val}%,name.ilike.%${val}%,nid.ilike.%${val}%`).limit(5);
    if (data) setSuggestions(data);
    setIsSearching(false);
  };

  const selectCustomer = (customer: Customer) => {
    const sanitizedData = { ...initialFormState, ...customer };
    Object.keys(sanitizedData).forEach(key => {
      if ((sanitizedData as any)[key] === null) (sanitizedData as any)[key] = '';
    });
    setFormData(sanitizedData);
    setSuggestions([]);
    setSearchQuery('');
    setMessage({ type: 'success', text: 'প্রোফাইল লোড হয়েছে!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const resizeImage = (file: File, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else reject('Canvas Error');
        };
        img.onerror = () => reject('Image Load Error');
      };
      reader.onerror = () => reject('File Read Error');
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const base64 = await (type === 'photo' ? resizeImage(file, 300, 300) : resizeImage(file, 300, 80));
      setFormData(prev => ({
        ...prev,
        [type === 'photo' ? 'photo_url' : 'signature_url']: base64
      }));
    } catch (err) {
      alert('ছবি আপলোডে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const payload = { ...formData };
      if (!payload.id || String(payload.id).trim() === '') delete payload.id;
      if (!payload.dob || payload.dob === '') payload.dob = null;

      const { data, error } = await supabase
        .from('customers')
        .upsert(payload, { onConflict: 'phone' })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const saved = data[0];
        Object.keys(saved).forEach(key => { if (saved[key] === null) saved[key] = ''; });
        setFormData(saved);
      }
      
      setMessage({ type: 'success', text: 'প্রোফাইল সফলভাবে সেভ হয়েছে!' });
      fetchRecentCustomers();
    } catch (err: any) {
      console.error('Save Error:', err);
      setMessage({ type: 'error', text: err.message || 'সেভ করা সম্ভব হয়নি।' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রোফাইলটি চিরতরে মুছে ফেলতে চান?')) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      
      await fetchRecentCustomers();
      if (formData.id === id) setFormData(initialFormState);
      alert('সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err: any) {
      console.error('Delete Error:', err);
      alert(err.message || 'মুছে ফেলা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-800">কাস্টমার ডাটাবেজ</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বিসমিল্লাহ কম্পিউটার উলিপুর</p>
        </div>
        <div className="relative flex-1 max-md:w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>
          <input
            type="text"
            placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all shadow-inner"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
              {suggestions.map((c) => (
                <button key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 border-b border-slate-50 last:border-none">
                  <div className="text-left">
                    <p className="font-black text-slate-800 text-sm">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{c.phone}</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">বাছাই</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6" />
            <h4 className="font-black text-lg uppercase">প্রোফাইল এন্ট্রি</h4>
          </div>
          
          <div className="flex bg-black/10 p-1 rounded-2xl overflow-x-auto">
            {['basic', 'family', 'media', 'edu'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                {tab === 'basic' ? 'ব্যক্তিগত' : tab === 'family' ? 'পারিবারিক' : tab === 'media' ? 'ছবি ও স্বাক্ষর' : 'শিক্ষা ও মাপ'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 md:p-10 space-y-10">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">নাম (English)</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="FULL NAME" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">নাম (বাংলা)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.name_bn} onChange={e => setFormData({...formData, name_bn: e.target.value})} placeholder="মোঃ..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px) font-black text-slate-400 uppercase tracking-widest px-2">মোবাইল নম্বর</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">NID নম্বর</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} placeholder="জাতীয় পরিচয়পত্র" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">জন্ম তারিখ</label>
                <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ধর্ম</label>
                <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800 appearance-none" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})}>
                  <option value="Islam">Islam</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বর্তমান ঠিকানা</label>
                <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-slate-800 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা" />
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-left-4 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পিতার নাম (English)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">পিতার নাম (বাংলা)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.father_name_bn} onChange={e => setFormData({...formData, father_name_bn: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">মাতার নাম (English)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.mother_name} onChange={e => setFormData({...formData, mother_name: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">মাতার নাম (বাংলা)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.mother_name_bn} onChange={e => setFormData({...formData, mother_name_bn: e.target.value})} />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আবেদনকারীর ছবি</label>
                    <span className="text-[9px] font-black text-emerald-600">নির্ধারিত সাইজ: ৩০০x৩০০</span>
                  </div>
                </div>
                
                <div className="relative aspect-square w-full max-w-[250px] mx-auto bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden hover:border-emerald-200 transition-all">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} className="w-full h-full object-cover" alt="Photo" />
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400">ছবি আপলোড</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">স্বাক্ষর</label>
                    <span className="text-[9px] font-black text-emerald-600">নির্ধারিত সাইজ: ৩০০x৮০</span>
                  </div>
                </div>
                
                <div className="relative h-[100px] w-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden hover:border-emerald-200 transition-all">
                  {formData.signature_url ? (
                    <img src={formData.signature_url} className="w-full h-full object-contain p-2" alt="Signature" />
                  ) : (
                    <div className="text-center p-6">
                      <PenTool className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-[10px] font-black text-slate-400">স্বাক্ষর আপলোড</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edu' && (
            <div className="space-y-12 animate-in slide-in-from-left-4 duration-300">
              {/* Physical Stats Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                  <Ruler className="w-5 h-5 text-emerald-600" />
                  <h5 className="text-sm font-black text-slate-800 uppercase">শারীরিক মাপ ও অন্যান্য</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">রক্তের গ্রুপ</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                      <option value="">বাছাই করুন</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">উচ্চতা</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="e.g. 5'6\" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ওজন</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 65kg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বুকের মাপ</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold text-slate-800" value={formData.chest} onChange={e => setFormData({...formData, chest: e.target.value})} placeholder="e.g. 32-34\" />
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-10">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                  <h5 className="text-sm font-black text-slate-800 uppercase">শিক্ষাগত যোগ্যতা</h5>
                </div>

                {/* SSC/Dakhil */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                  <h6 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">মাধ্যমিক (SSC / Dakhil / Equiv.)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input placeholder="রোল নম্বর" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_roll} onChange={e => setFormData({...formData, edu1_roll: e.target.value})} />
                    <input placeholder="রেজি নম্বর" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_reg} onChange={e => setFormData({...formData, edu1_reg: e.target.value})} />
                    <input placeholder="ফলাফল (GPA)" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_result} onChange={e => setFormData({...formData, edu1_result: e.target.value})} />
                    <input placeholder="বিভাগ/গ্রুপ" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_group} onChange={e => setFormData({...formData, edu1_group: e.target.value})} />
                    <input placeholder="বোর্ড" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_board} onChange={e => setFormData({...formData, edu1_board: e.target.value})} />
                    <input placeholder="পাশের সাল" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_year} onChange={e => setFormData({...formData, edu1_year: e.target.value})} />
                    <input placeholder="প্রতিষ্ঠানের নাম" className="md:col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu1_inst} onChange={e => setFormData({...formData, edu1_inst: e.target.value})} />
                  </div>
                </div>

                {/* HSC/Alim */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                  <h6 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">উচ্চ মাধ্যমিক (HSC / Alim / Equiv.)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input placeholder="রোল নম্বর" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_roll} onChange={e => setFormData({...formData, edu2_roll: e.target.value})} />
                    <input placeholder="রেজি নম্বর" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_reg} onChange={e => setFormData({...formData, edu2_reg: e.target.value})} />
                    <input placeholder="ফলাফল (GPA)" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_result} onChange={e => setFormData({...formData, edu2_result: e.target.value})} />
                    <input placeholder="বিভাগ/গ্রুপ" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_group} onChange={e => setFormData({...formData, edu2_group: e.target.value})} />
                    <input placeholder="বোর্ড" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_board} onChange={e => setFormData({...formData, edu2_board: e.target.value})} />
                    <input placeholder="পাশের সাল" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_year} onChange={e => setFormData({...formData, edu2_year: e.target.value})} />
                    <input placeholder="প্রতিষ্ঠানের নাম" className="md:col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu2_inst} onChange={e => setFormData({...formData, edu2_inst: e.target.value})} />
                  </div>
                </div>

                {/* Graduation */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                  <h6 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">স্নাতক (Graduation / Fazil)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input placeholder="বিষয় / কোর্স" className="md:col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu3_subject} onChange={e => setFormData({...formData, edu3_subject: e.target.value})} />
                    <input placeholder="ফলাফল (CGPA)" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu3_result} onChange={e => setFormData({...formData, edu3_result: e.target.value})} />
                    <input placeholder="পাশের সাল" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu3_year} onChange={e => setFormData({...formData, edu3_year: e.target.value})} />
                    <input placeholder="বিশ্ববিদ্যালয়" className="md:col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu3_uni} onChange={e => setFormData({...formData, edu3_uni: e.target.value})} />
                    <input placeholder="প্রতিষ্ঠানের নাম" className="md:col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={formData.edu3_inst} onChange={e => setFormData({...formData, edu3_inst: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-4">
            <button type="submit" disabled={isLoading} className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
              <span>প্রোফাইল সেভ করুন</span>
            </button>
            <button type="button" onClick={() => setFormData(initialFormState)} className="px-10 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] font-black text-lg transition-all">রিসেট</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h4 className="font-black text-slate-800 mb-6 flex items-center space-x-3"><UsersIcon className="w-6 h-6 text-emerald-600" /> <span>সাম্প্রতিক প্রোফাইল</span></h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentCustomers.map((rc) => (
            <div key={rc.id} onClick={() => selectCustomer(rc)} className="group cursor-pointer p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-emerald-100 hover:bg-white transition-all shadow-sm flex items-center space-x-4 relative">
              <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                {rc.photo_url ? (
                  <img src={rc.photo_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-emerald-600 bg-emerald-50">{rc.name?.charAt(0) || 'C'}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-800 truncate">{rc.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{rc.phone}</p>
              </div>
              <button 
                onClick={(e) => deleteCustomer(rc.id!, e)} 
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {recentCustomers.length === 0 && <p className="col-span-full text-center py-10 text-slate-300 italic font-bold">কোনো ডাটা নেই</p>}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
