
import React, { useState, useMemo } from 'react';
import { SaleRecord, ReportPeriod, ServiceCategory } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Calendar, ChevronDown, Download, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportsProps {
  sales: SaleRecord[];
}

const Reports: React.FC<ReportsProps> = ({ sales }) => {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredData = useMemo(() => {
    return sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      const saleDateStr = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // If search date is provided, filter specifically by that date
      if (searchDate && saleDateStr !== searchDate) return false;

      // Category search
      if (searchTerm && !s.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // Standard period filters (only applied if searchDate is empty)
      if (!searchDate) {
        const now = new Date();
        if (period === 'daily') {
          return saleDate.toDateString() === now.toDateString();
        } else if (period === 'monthly') {
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        } else if (period === 'yearly') {
          return saleDate.getFullYear() === now.getFullYear();
        }
      }
      
      return true;
    });
  }, [sales, period, searchDate, searchTerm]);

  const summaryByCategory = useMemo(() => {
    const categories = Object.values(ServiceCategory);
    return categories.map(cat => ({
      category: cat,
      total: filteredData.filter(s => s.category === cat).reduce((acc, curr) => acc + curr.amount, 0),
      count: filteredData.filter(s => s.category === cat).length
    })).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  const grandTotal = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {(['daily', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setSearchDate(''); }}
                className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  period === p && !searchDate
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-medium outline-none transition-all"
              />
            </div>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenue</p>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800">৳{grandTotal.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-1">Based on current filters</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Sales</p>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800">{filteredData.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Transactions found</p>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Category Breakdown</h3>
              <button className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                    <th className="px-6 py-4 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryByCategory.filter(i => i.total > 0).map((item) => {
                    const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
                    return (
                      <tr key={item.category} className="group hover:bg-slate-50/80 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                              {CATEGORY_ICONS[item.category as ServiceCategory]}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{item.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">{item.count}</td>
                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">৳{item.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(0)}%</span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {summaryByCategory.every(i => i.total === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No sales found for this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction History (Small screens view / Sidebar) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800">History</h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                {searchDate ? searchDate : period}
              </span>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 no-scrollbar">
              {filteredData.length > 0 ? (
                filteredData.map((sale) => (
                  <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-white transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-emerald-600">{CATEGORY_ICONS[sale.category]}</div>
                        <span className="text-xs font-black text-slate-800">{sale.category}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">৳{sale.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-sm">
                  No transactions found.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-bold text-sm text-emerald-400 mb-2">Upcoming Features</h4>
              <ul className="text-[11px] space-y-2 text-slate-300">
                <li className="flex items-center space-x-2 opacity-60">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <span>Inventory Management</span>
                </li>
                <li className="flex items-center space-x-2 opacity-60">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <span>SMS Alerts for Customers</span>
                </li>
              </ul>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
