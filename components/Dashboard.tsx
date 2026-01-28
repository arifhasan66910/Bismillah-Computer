
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { SaleRecord, ServiceCategory } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { TrendingUp, Users, Package, CreditCard } from 'lucide-react';

interface DashboardProps {
  sales: SaleRecord[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  const today = new Date().toLocaleDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
  const totalSalesVal = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTodayVal = todaySales.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by category for Chart
  const categoryData = Object.values(ServiceCategory).map(cat => ({
    name: cat,
    value: sales.filter(s => s.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Today's Sales</p>
            <h3 className="text-2xl font-bold text-slate-800">৳{totalTodayVal.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Life-time Sales</p>
            <h3 className="text-2xl font-bold text-slate-800">৳{totalSalesVal.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">Items</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Transactions</p>
            <h3 className="text-2xl font-bold text-slate-800">{sales.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Avg Order Value</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ৳{sales.length ? Math.round(totalSalesVal / sales.length).toLocaleString() : 0}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Sales by Category</h4>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                <p>No sales data to display</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h4>
          <div className="space-y-4">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      {CATEGORY_ICONS[sale.category]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sale.category}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">৳{sale.amount}</p>
                    <p className="text-[10px] text-slate-400">Successful</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No recent transactions</p>
            )}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            View All Sales
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import { BarChart3 } from 'lucide-react';
