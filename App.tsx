
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, Transaction, Product, Category, UserRole, UserProfile } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Accounting from './components/Accounting';
import Reports from './components/Reports';
import CustomerManagement from './components/CustomerManagement';
import FormFilling from './components/FormFilling';
import Inventory from './components/Inventory';
import { supabase } from './lib/supabase';
import { Loader2, Plus, LayoutDashboard, Wallet, BarChart3, Users, Package, AlertCircle, Database, Copy, CheckCircle2, X } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<boolean>(false);
  const [showSetupHelper, setShowSetupHelper] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const fetchProfile = async (userId: string) => {
    try {
      setProfileError(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
          setProfileError(true);
        }
        setUserRole('staff');
        return;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('Unexpected profile error:', err);
      setUserRole('staff');
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
      if (txError) throw txError;
      if (txData) setTransactions(txData as Transaction[]);

      const { data: pData, error: pError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (pError) throw pError;
      if (pData) setProducts(pData as Product[]);

      const { data: cData, error: cError } = await supabase
        .from('categories')
        .select('*');
      if (cError) throw cError;
      if (cData) setCategories(cData as Category[]);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fix: Added logic to handle adding multiple transactions to Supabase and update state
  const addTransactions = async (txs: Partial<Transaction>[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(txs.map(tx => ({
          ...tx,
          created_by: userProfile?.id,
          timestamp: tx.timestamp || new Date().toISOString()
        })))
        .select();

      if (error) throw error;
      if (data) {
        setTransactions(prev => [...(data as Transaction[]), ...prev]);
        return { success: true, data: data as Transaction[] };
      }
      return { success: false, error: 'No data returned' };
    } catch (err: any) {
      console.error('Add transaction error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Added logic to handle deleting a transaction and update state
  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err: any) {
      console.error('Delete transaction error:', err);
    }
  };

  // Fix: Added inventory logic that syncs stock updates with financial transactions
  const handleInventoryAction = async (productId: string, type: 'in' | 'out', qty: number, price: number, desc?: string) => {
    setIsLoading(true);
    try {
      const { data: product, error: pError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (pError || !product) throw new Error('Product not found');

      const newStock = type === 'in' ? product.current_stock + qty : product.current_stock - qty;
      if (newStock < 0) throw new Error('Insufficient stock');

      const { error: uError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', productId);
      
      if (uError) throw uError;

      const { error: lError } = await supabase
        .from('inventory_logs')
        .insert([{
          product_id: productId,
          type,
          quantity: qty,
          unit_price: price,
          total_price: qty * price,
          timestamp: new Date().toISOString()
        }]);
      
      if (lError) throw lError;

      const txResult = await addTransactions([{
        type: type === 'in' ? 'expense' : 'income',
        category: product.category,
        amount: qty * price,
        description: desc || `${type === 'in' ? 'স্টক ক্রয়' : 'বিক্রয়'}: ${product.name}`,
        timestamp: new Date().toISOString()
      }]);

      if (!txResult.success) throw new Error(txResult.error);

      await fetchData(); 
      return { success: true, data: txResult.data };
    } catch (err: any) {
      console.error('Inventory action error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    fetchData();
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    localStorage.clear();
  };

  const sqlCode = `-- ১. প্রোফাইল টেবিল তৈরি (Profiles Table)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text check (role in ('admin', 'staff')) default 'staff',
  full_name text
);

-- ২. অটো প্রোফাইল তৈরির ফাংশন (Function)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  return new;
end;
$$ language plpgsql security definer;

-- ৩. ট্রিগার সেটআপ (Trigger)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ৪. নিজেকে অ্যাডমিন বানানো (আপনার ইমেইল দিয়ে নিচের অংশ পরিবর্তন করুন)
-- ইমেইলটি একাউন্ট তৈরির পর একবার এই কমান্ডটি রান করলেই হবে
update public.profiles 
set role = 'admin' 
where id in (select id from auth.users where email = '${userProfile ? userProfile.id : 'আপনার-ইমেইল@ঠিকানা.কম'}');`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter main-app-wrapper">
      <style>{`
        @media print {
          * {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
            box-shadow: none !important;
          }
          
          body, html, #root, .main-app-wrapper, main {
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .sidebar-comp, .header-comp, .nav-comp, .no-print, button, .loader-overlay, .profile-notice {
            display: none !important;
            visibility: hidden !important;
          }

          main { padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: none !important; width: 100% !important; margin: 0 !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; }
        }
      `}</style>

      <div className="hidden lg:flex sidebar-comp">
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} userRole={userRole} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="header-comp">
          <Header activeView={activeView} onLogout={handleLogout} setActiveView={setActiveView} />
        </div>
        
        {profileError && (
          <div className="profile-notice bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between no-print z-50">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>আপনার প্রোফাইল ডাটাবেজে পাওয়া যায়নি। অ্যাডমিন হিসেবে লগইন করতে সেটিংস প্রয়োজন।</span>
            </div>
            <button 
              onClick={() => setShowSetupHelper(true)} 
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
            >
              সেটিংস গাইড দেখুন
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-md z-50 flex items-center justify-center loader-overlay">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest italic">ডাটা লোড হচ্ছে...</p>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto h-full">
            {activeView === 'dashboard' && (
              <Dashboard 
                transactions={transactions} 
                products={products}
                categories={categories}
                onAddTransaction={(tx) => addTransactions([tx])}
                onInventoryAction={handleInventoryAction}
                onDeleteTransaction={deleteTransaction}
                userRole={userRole}
                setActiveView={setActiveView}
              />
            )}
            {activeView === 'inventory' && <Inventory products={products} onInventoryAction={handleInventoryAction} refreshData={fetchData} />}
            {activeView === 'accounting' && <Accounting onAddTransactions={(txs) => addTransactions(txs)} transactions={transactions} onDeleteTransaction={deleteTransaction} userRole={userRole} />}
            {activeView === 'reports' && userRole === 'admin' ? (
              <Reports transactions={transactions} />
            ) : activeView === 'reports' ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 no-print py-20">
                <BarChart3 className="w-20 h-20 mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-sm">রিপোর্ট শুধুমাত্র মালিকের (Admin) জন্য সংরক্ষিত</p>
                <p className="text-xs font-medium mt-2">আপনার রোল বর্তমানে: {userRole.toUpperCase()}</p>
                <button 
                  onClick={() => setShowSetupHelper(true)}
                  className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl"
                >
                  <Database className="w-4 h-4" />
                  কিভাবে অ্যাডমিন হবো?
                </button>
              </div>
            ) : null}
            {activeView === 'customers' && <CustomerManagement />}
            {activeView === 'form_filling' && <FormFilling />}
          </div>
        </main>

        {/* Database Setup Helper Modal */}
        {showSetupHelper && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-lg font-black text-slate-800">অ্যাডমিন সেটআপ গাইড</h5>
                    <p className="text-xs font-bold text-slate-400">নিচে দেওয়া ধাপগুলো অনুসরণ করুন</p>
                  </div>
                </div>
                <button onClick={() => setShowSetupHelper(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">১</span>
                       সুপাবেস ড্যাশবোর্ড (SQL Editor)
                    </p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      আপনার <b>Supabase</b> একাউন্টে লগইন করুন, বাম পাশের মেনু থেকে <b>SQL Editor</b> এ ক্লিক করুন এবং <b>New Query</b> বাটনে ক্লিক করুন।
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-sm font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">২</span>
                       নিচের কোডটি কপি ও রান করুন
                    </p>
                    <div className="relative group">
                      <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                        {sqlCode}
                      </pre>
                      <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase"
                      >
                        {copiedSql ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiedSql ? 'কপি হয়েছে' : 'কোড কপি করুন'}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-600 font-bold mt-4 flex items-start gap-2 italic">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      মনে রাখবেন: কোডের ৪ নম্বর লাইনে আপনার ইমেইল দিয়ে পরিবর্তন করতে হবে অথবা একাউন্ট তৈরির পর এটি রান করতে হবে।
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-sm font-black text-emerald-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">৩</span>
                       অ্যাপ রিফ্রেশ করুন
                    </p>
                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                      SQL রান করার পর অ্যাপটি একবার রিফ্রেশ করুন। এখন আপনি <b>Admin</b> হিসেবে সকল ফিচার এবং রিপোর্ট দেখতে পাবেন।
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/50 rounded-b-[3rem]">
                 <button onClick={() => setShowSetupHelper(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">বুঝেছি, ধন্যবাদ!</button>
              </div>
            </div>
          </div>
        )}

        <nav className="nav-comp lg:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 pb-6 safe-area-bottom z-40">
          <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-2 ${activeView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">হোম</span>
          </button>
          <button onClick={() => setActiveView('inventory')} className={`flex flex-col items-center p-2 ${activeView === 'inventory' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">স্টক</span>
          </button>
          <button onClick={() => setActiveView('accounting')} className="flex flex-col items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-full -mt-10 shadow-lg border-4 border-slate-50 active:scale-95 transition-all">
            <Plus className="w-8 h-8" />
          </button>
          <button onClick={() => setActiveView('customers')} className={`flex flex-col items-center p-2 ${activeView === 'customers' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">কাস্টমার</span>
          </button>
          {userRole === 'admin' && (
            <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center p-2 ${activeView === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <BarChart3 className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">হিসাব</span>
            </button>
          )}
        </nav>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 1.2rem); }
      `}</style>
    </div>
  );
};

export default App;
