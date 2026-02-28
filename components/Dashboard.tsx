
import React from 'react';
import { Product, Transaction, InventoryStats, ProductType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  products: Product[];
  stats: Record<string, InventoryStats>;
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, stats, transactions }) => {
  const chartData = products.map(p => {
    const s = stats[p.id];
    const globalMetric = s?.global || { quantity: 0, weight: 0 };
    const stockValue = p.type === ProductType.ROLLER ? globalMetric.weight : globalMetric.quantity;
    
    return {
      name: p.name,
      stock: stockValue,
      unit: p.unit,
      minStock: p.minStockLevel,
      factory: p.type === ProductType.ROLLER ? s?.factory.weight : s?.factory.quantity,
      partners: p.type === ProductType.ROLLER ? s?.partners.weight : s?.partners.quantity,
    };
  });

  const typeDistribution = [
    { name: 'Rollers', value: products.filter(p => p.type === ProductType.ROLLER).length },
    { name: 'Packing Bags', value: products.filter(p => p.type === ProductType.PACKING_BAG).length },
  ];

  const SWIFT_COLORS = {
    NAVY: '#003366',
    GREEN: '#4DB848',
    SLATE: '#64748B',
    EMERALD: '#10B981',
    ORANGE: '#F97316'
  };

  const COLORS = [SWIFT_COLORS.NAVY, SWIFT_COLORS.GREEN];

  const lowStockProducts = products.filter(p => {
    const s = stats[p.id];
    const globalMetric = s?.global || { quantity: 0, weight: 0 };
    const stockValue = p.type === ProductType.ROLLER ? globalMetric.weight : globalMetric.quantity;
    return stockValue <= p.minStockLevel;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Operations Hub</h2>
          <p className="text-slate-500 font-medium">Real-time oversight of manufacturing assets & distribution.</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Status</p>
          <p className="text-xs font-bold text-[#4DB848] uppercase flex items-center md:justify-end">
             <span className="w-1.5 h-1.5 bg-[#4DB848] rounded-full mr-2 animate-pulse"></span>
             Cloud Secured
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-[#4DB848]/30 transition-all">
          <div className="flex items-center space-x-5">
            <div className="bg-[#003366]/5 p-5 rounded-2xl text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition-all">
              <i className="fa-solid fa-boxes-stacked text-2xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active SKUs</p>
              <h3 className="text-3xl font-black text-[#003366] tracking-tight">{products.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-[#4DB848]/30 transition-all">
          <div className="flex items-center space-x-5">
            <div className="bg-[#4DB848]/5 p-5 rounded-2xl text-[#4DB848] group-hover:bg-[#4DB848] group-hover:text-white transition-all">
              <i className="fa-solid fa-truck-loading text-2xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7D Inbound</p>
              <h3 className="text-3xl font-black text-[#003366] tracking-tight">
                {transactions.filter(t => t.timestamp > Date.now() - 7*24*60*60*1000 && t.type === 'Production In').length}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-[#4DB848]/30 transition-all">
          <div className="flex items-center space-x-5">
            <div className="bg-orange-50 p-5 rounded-2xl text-orange-600">
              <i className="fa-solid fa-clipboard-check text-2xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7D Issuances</p>
              <h3 className="text-3xl font-black text-[#003366] tracking-tight">
                {transactions.filter(t => t.timestamp > Date.now() - 7*24*60*60*1000 && t.type === 'Issuance').length}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-[#4DB848]/30 transition-all">
          <div className="flex items-center space-x-5">
            <div className={`p-5 rounded-2xl ${lowStockProducts.length > 0 ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
              <i className="fa-solid fa-circle-exclamation text-2xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Warnings</p>
              <h3 className={`text-3xl font-black tracking-tight ${lowStockProducts.length > 0 ? 'text-orange-600' : 'text-[#003366]'}`}>
                {lowStockProducts.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black mb-10 flex items-center text-[#003366] uppercase tracking-widest">
            <div className="w-1.5 h-6 bg-[#4DB848] rounded-full mr-4"></div>
            Material Deployment Matrix
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <Bar name="Factory Reserve" dataKey="factory" stackId="a" fill={SWIFT_COLORS.NAVY} radius={[0, 0, 0, 0]} barSize={40} />
                <Bar name="Partner Possession" dataKey="partners" stackId="a" fill={SWIFT_COLORS.GREEN} radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-sm font-black mb-10 flex items-center text-[#003366] uppercase tracking-widest">
            <div className="w-1.5 h-6 bg-[#003366] rounded-full mr-4"></div>
            Portfolio Mix
          </h3>
          <div className="h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} innerRadius={80} outerRadius={110} paddingAngle={15} dataKey="value" stroke="none">
                  {typeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
             {typeDistribution.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                   <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.name}</span>
                   </div>
                   <span className="text-lg font-black text-[#003366]">{item.value} <span className="text-[10px] text-slate-300">SKUs</span></span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
