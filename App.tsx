
import React, { useState, useEffect } from 'react';
import { ViewType, Transaction } from './types';
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
import { Loader2, Plus, LayoutDashboard, Wallet, BarChart3, Users, Search, Package } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('bismillah_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.warn('Transactions table not found');
      }
      if (data) setTransactions(data as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('bismillah_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bismillah_auth');
  };

  const addTransactions = async (newTxs: Transaction[]) => {
    setTransactions(prev => [...newTxs, ...prev]);
    try {
      const { error } = await supabase.from('transactions').insert(newTxs);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving transactions:', err);
      alert('Error saving to cloud.');
      fetchTransactions();
    }
  };

  const deleteTransaction = async (id: string) => {
    const original = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      setTransactions(original);
      alert('Delete failed.');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <div className="hidden lg:flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header activeView={activeView} onLogout={handleLogout} setActiveView={setActiveView} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-md z-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-slate-100">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">ক্লাউড সিঙ্কিং হচ্ছে...</p>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto h-full">
            {activeView === 'dashboard' && <Dashboard transactions={transactions} />}
            {activeView === 'inventory' && <Inventory />}
            {activeView === 'accounting' && (
              <Accounting 
                onAddTransactions={addTransactions} 
                transactions={transactions} 
                onDeleteTransaction={deleteTransaction} 
              />
            )}
            {activeView === 'reports' && <Reports transactions={transactions} />}
            {activeView === 'customers' && <CustomerManagement />}
            {activeView === 'form_filling' && <FormFilling />}
          </div>
        </main>

        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 pb-6 safe-area-bottom z-40">
          <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-2 ${activeView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">হোম</span>
          </button>
          <button onClick={() => setActiveView('inventory')} className={`flex flex-col items-center p-2 ${activeView === 'inventory' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">স্টক</span>
          </button>
          <button onClick={() => setActiveView('accounting')} className="flex flex-col items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-full -mt-10 shadow-lg border-4 border-slate-50 active:scale-90 transition-all">
            <Plus className="w-8 h-8" />
          </button>
          <button onClick={() => setActiveView('customers')} className={`flex flex-col items-center p-2 ${activeView === 'customers' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">কাস্টমার</span>
          </button>
          <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center p-2 ${activeView === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">হিসাব</span>
          </button>
        </nav>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 1.5rem); }
      `}</style>
    </div>
  );
};

export default App;
