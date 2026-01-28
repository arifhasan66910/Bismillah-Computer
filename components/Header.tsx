
import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { ViewType } from '../types';

interface HeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLabel = NAVIGATION_ITEMS.find(item => item.id === activeView)?.label;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 md:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
          <h2 className="text-xl font-bold text-slate-800">{currentLabel}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-semibold text-slate-900">অপারেটর</p>
            <p className="text-xs text-slate-500">বিসমিল্লাহ কম্পিউটার</p>
          </div>
          <div className="h-10 w-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full font-bold">
            ব
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-2xl py-4 flex flex-col space-y-2 px-4 animate-in slide-in-from-top duration-300">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewType);
                setIsMenuOpen(false);
              }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                activeView === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 border-t border-slate-100 pt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">লগ-আউট</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
