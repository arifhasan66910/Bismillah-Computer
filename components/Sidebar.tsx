
import React from 'react';
import { LogOut } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout }) => {
  return (
    <div className="w-64 bg-emerald-800 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-emerald-700">
        <h1 className="text-xl font-bold tracking-tight">বিসমিল্লাহ কম্পিউটার</h1>
        <p className="text-emerald-300 text-xs font-medium uppercase mt-1">উলিপুর ড্যাশবোর্ড</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ViewType)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeView === item.id 
                ? 'bg-emerald-700 text-white shadow-lg' 
                : 'text-emerald-100 hover:bg-emerald-700/50'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-emerald-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-emerald-900/50 text-emerald-200 hover:bg-red-900/40 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">লগ-আউট</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
