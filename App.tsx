
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, Transaction, Product, Category, UserRole, UserProfile } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Accounting from './components/Accounting';
import Reports from './components/Reports';
import Inventory from './components/Inventory';
import Dues from './components/Dues';
import { supabase } from './lib/supabase';
import { Loader2, Plus, LayoutDashboard, BarChart3, Package, BookOpen, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
      if (txError) console.warn("Transactions error:", txError.message);
      if (txData) setTransactions(txData as Transaction[]);

      const { data: pData, error: pError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (pError) console.warn("Products error:", pError.message);
      if (pData) setProducts(pData as Product[]);

      const { data: cData, error: cError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (!cError && cData && cData.length > 0) {
        setCategories(cData as Category[]);
      } else {
        const defaultCats = [
          { name: 'Photocopy', label: 'ফটোকপি', type: 'income', icon: 'Copy', sort_order: 0 },
          { name: 'Online_Form', label: 'অনলাইন ফরম', type: 'income', icon: 'FileText', sort_order: 1 },
          { name: 'Photography', label: 'ফটোগ্রাফি', type: 'income', icon: 'Camera', sort_order: 2 },
          { name: 'Stamp_Seal', label: 'স্ট্যাম্প/সিল', type: 'income', icon: 'PenTool', sort_order: 3 },
          { name: 'Print_Service', label: 'কম্পিউটার প্রিন্ট', type: 'income', icon: 'Printer', sort_order: 4 },
          { name: 'Paper_A4', label: 'A4 পেপার ক্রয়', type: 'expense', icon: 'FileText', sort_order: 5 },
          { name: 'Paper_Legal', label: 'লিগ্যাল পেপার ক্রয়', type: 'expense', icon: 'FileText', sort_order: 6 },
          { name: 'Paper_A3', label: 'A3 পেপার ক্রয়', type: 'expense', icon: 'FileText', sort_order: 7 },
          { name: 'Ink_Toner', label: 'ইনক/টোনার', type: 'expense', icon: 'Zap', sort_order: 8 },
          { name: 'Repairs', label: 'মেরামত (ফটোকপি/প্রিন্টার)', type: 'expense', icon: 'Wrench', sort_order: 9 },
          { name: 'Elec_Bill', label: 'বিদ্যুৎ বিল', type: 'expense', icon: 'Lightbulb', sort_order: 10 },
          { name: 'Guard_Bill', label: 'গার্ড বিল', type: 'expense', icon: 'Shield', sort_order: 11 },
          { name: 'Salary', label: 'স্টাফ বেতন', type: 'expense', icon: 'UserCheck', sort_order: 12 },
          { name: 'Food', label: 'খাবার খরচ', type: 'expense', icon: 'Coffee', sort_order: 13 },
          { name: 'Conveyance', label: 'যাতায়াত খরচ', type: 'expense', icon: 'Truck', sort_order: 14 },
        ];
        setCategories(defaultCats as any);
      }
    } catch (err: any) {
      console.error('Data loading error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserProfile(data as UserProfile);
        setUserRole(data.role);
      } else {
        setUserRole('staff');
      }
    } catch (err) {
      setUserRole('staff');
    } finally {
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    const initializeAuth = async () => {
      const isLocalAdmin = localStorage.getItem('is_local_admin') === 'true';
      if (isLocalAdmin) {
        setIsAuthenticated(true);
        setUserRole('admin');
        setUserProfile({ id: '00000000-0000-0000-0000-000000000000', role: 'admin', full_name: 'Bismillah Admin' });
        await fetchData();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        await fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      } else if (localStorage.getItem('is_local_admin') !== 'true') {
        setIsAuthenticated(false);
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData, fetchProfile]);

  const addTransactions = async (txs: Partial<Transaction>[]) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const payload = txs.map(tx => ({
        ...tx,
        timestamp: tx.timestamp || new Date().toISOString(),
        created_by: userProfile?.id === '00000000-0000-0000-0000-000000000000' ? null : (userProfile?.id || null)
      }));
      const { data, error } = await supabase.from('transactions').insert(payload).select();
      if (error) throw error;
      if (data) setTransactions(prev => [...(data as Transaction[]), ...prev]);
      return { success: true, data: data as Transaction[] };
    } catch (err: any) {
      setGlobalError(`লেনদেন সেভ করতে সমস্যা হয়েছে: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransactionInDB = async (id: string, updates: Partial<Transaction>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('transactions').update(updates).eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান? এটি মুছে ফেললে আপনার ব্যালেন্স ও রিপোর্টেও পরিবর্তন আসবে।')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      alert('মুছে ফেলা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryInDB = async (id: string | undefined, updates: Partial<Category>) => {
    setIsLoading(true);
    try {
      // Remove 'icon' to avoid schema mismatch errors as requested
      const cleanUpdates: any = {};
      if (updates.name) cleanUpdates.name = updates.name;
      if (updates.label) cleanUpdates.label = updates.label;
      if (updates.type) cleanUpdates.type = updates.type;
      if (typeof updates.sort_order === 'number') cleanUpdates.sort_order = updates.sort_order;

      if (id) {
        const { error } = await supabase.from('categories').update(cleanUpdates).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([cleanUpdates]);
        if (error) throw error;
      }
      await fetchData(); 
      return { success: true };
    } catch (err: any) {
      console.error("Category update failed:", err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryOrder = async (reorderedCats: Category[]) => {
    setCategories(reorderedCats);
    try {
      const updates = reorderedCats.map((cat, index) => {
        if (!cat.id) return Promise.resolve();
        return supabase.from('categories').update({ sort_order: index }).eq('id', cat.id);
      });
      await Promise.all(updates);
    } catch (err) {
      console.warn("Failed to persist category order", err);
    }
  };

  const deleteCategoryFromDB = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরি মুছে ফেলতে চান?')) return { success: false };
    setIsLoading(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') return { success: false, error: 'এই ক্যাটাগরিতে পূর্বের লেনদেনের ডাটা থাকায় মুছে ফেলা যাচ্ছে না।' };
        throw error;
      }
      setCategories(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'মুছে ফেলা সম্ভব হয়নি। ' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleInventoryAction = async (productId: string, type: 'in' | 'out', qty: number, price: number, desc?: string) => {
    setIsLoading(true);
    try {
      const { data: product, error: pError } = await supabase.from('products').select('*').eq('id', productId).single();
      if (pError || !product) throw new Error('প্রডাক্ট খুঁজে পাওয়া যায়নি।');
      const newStock = type === 'in' ? product.current_stock + qty : product.current_stock - qty;
      await supabase.from('products').update({ current_stock: newStock }).eq('id', productId);
      await addTransactions([{
        type: type === 'in' ? 'expense' : 'income',
        category: product.category,
        amount: qty * price,
        description: desc || `${type === 'in' ? 'ক্রয়' : 'বিক্রয়'}: ${product.name}`,
        timestamp: new Date().toISOString()
      }]);
      await fetchData(); 
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setIsAuthenticated(false);
    setUserProfile(null);
    setTransactions([]);
    setProducts([]);
    setCategories([]);
    window.location.reload(); 
  };

  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter main-app-wrapper">
      <div className="hidden lg:flex sidebar-comp">
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} userRole={userRole} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative main-content-area">
        <Header activeView={activeView} onLogout={handleLogout} setActiveView={setActiveView} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {isLoading && (
            <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center loader-overlay">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">লোড হচ্ছে...</p>
              </div>
            </div>
          )}

          {globalError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold">{globalError}</p>
              <button onClick={() => setGlobalError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
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
            {activeView === 'accounting' && (
              <Accounting 
                onAddTransactions={(txs) => addTransactions(txs)} 
                onUpdateTransaction={updateTransactionInDB}
                onUpdateCategory={updateCategoryInDB}
                onReorderCategories={updateCategoryOrder}
                transactions={transactions} 
                onDeleteTransaction={deleteTransaction} 
                userRole={userRole} 
                categories={categories}
                onDeleteCategory={deleteCategoryFromDB}
                refreshData={fetchData}
              />
            )}
            {activeView === 'dues' && <Dues userRole={userRole} />}
            {activeView === 'reports' && userRole === 'admin' ? (
              <Reports transactions={transactions} />
            ) : activeView === 'reports' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                <BarChart3 className="w-20 h-20 mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-sm">রিপোর্ট শুধুমাত্র অ্যাডমিনের জন্য</p>
              </div>
            )}
          </div>
        </main>

        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 pb-6 safe-area-bottom z-40">
          <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-2 ${activeView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">হোম</span>
          </button>
          <button onClick={() => setActiveView('accounting')} className="flex flex-col items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-full -mt-10 shadow-lg border-4 border-slate-50">
            <Plus className="w-8 h-8" />
          </button>
          <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center p-2 ${activeView === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">হিসাব</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
