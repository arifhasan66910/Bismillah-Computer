
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import { 
  Search, Loader2, User, FileText, Briefcase, Printer, Download, ChevronRight, 
  ImageIcon, PenTool, ClipboardCheck, Copy, CheckCircle2, X 
} from 'lucide-react';

const FormFilling: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [formType, setFormType] = useState<'job' | 'passport' | 'other'>('job');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadMedia = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDataField = (label: string, value: string | undefined, id: string) => {
    const displayValue = value || '-';
    const isCopied = copiedField === id;

    return (
      <div className="space-y-1 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
        <div 
          onClick={() => handleCopy(displayValue, id)}
          className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all cursor-pointer ${isCopied ? 'bg-emerald-50 border-emerald-500 scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
        >
          <span className={`text-sm font-bold truncate ${isCopied ? 'text-emerald-700' : 'text-slate-700'}`}>{displayValue}</span>
          {isCopied ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Smart Search */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-800">অটো-ফিল মোড</h3>
            <p className="text-sm text-slate-500 font-medium">কাস্টমারের তথ্য ও মিডিয়া নিমিষেই কপি করুন</p>
          </div>
          <div className="relative flex-[1.5] w-full">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
            </div>
            <input
              type="text"
              placeholder="সার্চ করে ডাটা লোড করুন..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-3xl outline-none text-lg font-black shadow-inner transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {suggestions.map((c) => (
                  <button key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-6 hover:bg-emerald-50 border-b border-slate-50">
                    <div className="text-left">
                      <p className="font-black text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 font-bold">{c.phone}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedCustomer ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem]">
          <ClipboardCheck className="w-20 h-20 text-slate-200 mb-4" />
          <h4 className="text-slate-400 font-black uppercase tracking-widest text-lg">শুরু করতে কাস্টমার প্রোফাইল লোড করুন</h4>
          <p className="text-slate-300 text-sm font-bold mt-2">নাম বা ফোন নম্বর দিয়ে উপরে সার্চ করুন</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 space-y-10">
          {/* Active Profile Header */}
          <div className="bg-emerald-600 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-100">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] border-4 border-white/20 overflow-hidden flex items-center justify-center">
                {selectedCustomer.photo_url ? (
                  <img src={selectedCustomer.photo_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black">{selectedCustomer.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h4 className="text-3xl font-black tracking-tight">{selectedCustomer.name}</h4>
                <p className="text-emerald-100 font-bold flex items-center mt-1">
                  {selectedCustomer.phone} • NID: {selectedCustomer.nid || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex bg-black/10 p-2 rounded-3xl">
              <button onClick={() => setFormType('job')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all ${formType === 'job' ? 'bg-white text-emerald-600 shadow-xl' : 'text-white/60 hover:text-white'}`}>চাকরির আবেদন</button>
              <button onClick={() => setFormType('passport')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all ${formType === 'passport' ? 'bg-white text-emerald-600 shadow-xl' : 'text-white/60 hover:text-white'}`}>পাসপোর্ট</button>
              <button onClick={() => setSelectedCustomer(null)} className="ml-4 p-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Media Assets */}
            <div className="lg:col-span-4 space-y-10">
              {/* Photo Box */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <ImageIcon className="w-3 h-3" /> <span>Photo (300x300)</span>
                  </h5>
                  {selectedCustomer.photo_url && (
                    <button 
                      onClick={() => downloadMedia(selectedCustomer.photo_url!, `${selectedCustomer.name}_photo.png`)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="aspect-square bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-center overflow-hidden group relative">
                  {selectedCustomer.photo_url ? (
                    <>
                      <img src={selectedCustomer.photo_url} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/10 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl transition-all pointer-events-none">READY TO USE</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">ছবি পাওয়া যায়নি</p>
                  )}
                </div>
              </div>

              {/* Signature Box */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <PenTool className="w-3 h-3" /> <span>Signature (300x80)</span>
                  </h5>
                  {selectedCustomer.signature_url && (
                    <button 
                      onClick={() => downloadMedia(selectedCustomer.signature_url!, `${selectedCustomer.name}_signature.png`)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="h-[100px] bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden group">
                  {selectedCustomer.signature_url ? (
                    <img src={selectedCustomer.signature_url} className="w-full h-full object-contain p-4" />
                  ) : (
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">স্বাক্ষর পাওয়া যায়নি</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">টিপস (অপারেটরদের জন্য)</h5>
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                  "সরাসরি কপি করতে বক্সে ক্লিক করুন। স্বাক্ষর বা ছবি ডাউনলোড করতে ডাউনলোড আইকনে ক্লিক করুন এবং ব্রাউজার থেকে সরাসরি ড্র্যাগ করে ফরমে আপলোড করুন।"
                </p>
              </div>
            </div>

            {/* Right Column: Text Data */}
            <div className="lg:col-span-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">বিস্তারিত তথ্য কপি করুন</h4>
                </div>
                <button className="text-slate-400 hover:text-emerald-600 transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderDataField('নাম (English)', selectedCustomer.name, 'name')}
                {renderDataField('নাম (বাংলা)', selectedCustomer.name_bn, 'name_bn')}
                {renderDataField('পিতার নাম (Eng)', selectedCustomer.father_name, 'f_name')}
                {renderDataField('পিতার নাম (বাংলা)', selectedCustomer.father_name_bn, 'f_name_bn')}
                {renderDataField('মাতার নাম (Eng)', selectedCustomer.mother_name, 'm_name')}
                {renderDataField('মাতার নাম (বাংলা)', selectedCustomer.mother_name_bn, 'm_name_bn')}
                {renderDataField('মোবাইল নম্বর', selectedCustomer.phone, 'phone')}
                {renderDataField('NID নম্বর', selectedCustomer.nid, 'nid')}
                {renderDataField('জন্ম তারিখ', selectedCustomer.dob, 'dob')}
                {renderDataField('ধর্ম', selectedCustomer.religion, 'religion')}
                {renderDataField('ঠিকানা (সম্পূর্ণ)', selectedCustomer.address, 'address')}
                
                {formType === 'job' && (
                  <>
                    <div className="md:col-span-2 pt-6 border-t border-slate-50 mt-4">
                      <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6">শারীরিক মাপ ও বৈবাহিক তথ্য</h5>
                    </div>
                    {renderDataField('উচ্চতা', selectedCustomer.height, 'height')}
                    {renderDataField('ওজন', selectedCustomer.weight, 'weight')}
                    {renderDataField('বুকের মাপ', selectedCustomer.chest, 'chest')}
                    {renderDataField('বৈবাহিক অবস্থা', selectedCustomer.marital_status, 'marital')}
                    {renderDataField('স্বামী/স্ত্রীর নাম', selectedCustomer.spouse_name, 'spouse')}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormFilling;
