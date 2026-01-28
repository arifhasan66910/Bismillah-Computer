
import React, { useState, useEffect } from 'react';
import { ViewType, SaleRecord } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SalesEntry from './components/SalesEntry';
import Reports from './components/Reports';
import CustomerManagement from './components/CustomerManagement';
import { supabase } from './lib/supabase';
import { Loader2, Plus, LayoutDashboard, Search, BarChart3, Users } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('bismillah_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      if (data) setSales(data as SaleRecord[]);
    } catch (err) {
      console.error('Error fetching sales:', err);
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

  const addSale = async (newSale: SaleRecord) => {
    setSales(prev => [newSale, ...prev]);
    try {
      const { error } = await supabase
        .from('sales')
        .insert([{ id: newSale.id, category: newSale.category, amount: newSale.amount, timestamp: newSale.timestamp }]);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving sale:', err);
      alert('Error saving to cloud.');
    }
  };

  const deleteSale = async (id: string) => {
    const originalSales = [...sales];
    setSales(prev => prev.filter(s => s.id !== id));
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      setSales(originalSales);
      alert('Could not delete from cloud.');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header activeView={activeView} onLogout={handleLogout} setActiveView={setActiveView} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-md z-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-slate-100 scale-110">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-800 tracking-widest uppercase">Syncing Cloud</p>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto h-full">
            {activeView === 'dashboard' && <Dashboard sales={sales} />}
            {activeView === 'sales' && <SalesEntry onAddSale={addSale} sales={sales} onDeleteSale={deleteSale} />}
            {activeView === 'reports' && <Reports sales={sales} />}
            {activeView === 'customers' && <CustomerManagement />}
          </div>
        </main>

        {/* Bottom Mobile Navigation */}
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 pb-6 safe-area-bottom z-40">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button 
            onClick={() => setActiveView('customers')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeView === 'customers' ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Clients</span>
          </button>
          <button 
            onClick={() => setActiveView('sales')}
            className="flex flex-col items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-full -mt-10 shadow-lg shadow-emerald-200 active:scale-90 transition-all border-4 border-slate-50"
          >
            <Plus className="w-8 h-8" />
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeView === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Reports</span>
          </button>
          <button 
            onClick={() => { /* Placeholder for future feature */ }}
            className={`flex flex-col items-center p-2 rounded-xl transition-all text-slate-300`}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Search</span>
          </button>
        </nav>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1.5rem);
        }
      `}</style>
    </div>
  );
};

export default App;
