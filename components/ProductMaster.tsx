
import React, { useState, useMemo } from 'react';
import { Product, ProductType, UnitType, Transaction, TransactionType, UserRole, InventoryStats, Customer, StockMetric } from '../types';
import { calculateCustomerInventory } from '../utils';

interface ProductMasterProps {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  stats: Record<string, InventoryStats>;
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
  userRole: UserRole;
  canEdit: boolean;
  canDelete: boolean;
}

const ProductMaster: React.FC<ProductMasterProps> = ({ 
  products, customers, transactions, stats, onAdd, onUpdate, onDelete, onAddTransaction, userRole, canEdit, canDelete 
}) => {
  // Filter products to only show Packing Bags for Factory Inventory
  const factoryProducts = useMemo(() => products.filter(p => p.id === 'prod-bags'), [products]);

  const getPartnerBreakdown = (productId: string) => {
    return customers.map(c => {
      const inv = calculateCustomerInventory(c.id, transactions, products);
      return {
        customerName: c.name,
        metrics: inv[productId] || { quantity: 0, weight: 0 }
      };
    }).filter(p => p.metrics.quantity !== 0 || p.metrics.weight !== 0);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Factory Inventory</h2>
          <p className="text-slate-500 font-medium italic">Finished goods tracking for Packing Bags.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {factoryProducts.map(p => {
          const s = stats[p.id] || { 
            global: {quantity:0, weight:0}, 
            factory: {quantity:0, weight:0}, 
            partners: {quantity:0, weight:0},
            in: {quantity:0, weight:0},
            out: {quantity:0, weight:0}
          };
          const isLowStock = s.global.quantity <= (p.minStockLevel || 0);
          
          return (
            <div key={p.id} className={`bg-white rounded-[4rem] border-2 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col ${isLowStock ? 'border-orange-200' : 'border-slate-50 hover:border-[#4DB848]/30'}`}>
              <div className="p-10 flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-20 h-20 flex items-center justify-center rounded-[2rem] shadow-lg ${isLowStock ? 'bg-orange-500 text-white' : 'bg-[#4DB848]/10 text-[#4DB848]'}`}>
                    <i className={`fa-solid ${isLowStock ? 'fa-triangle-exclamation' : 'fa-box-open'} text-4xl`}></i>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#4DB848] uppercase tracking-[0.2em] mb-1">
                      Global Pool Status
                    </p>
                    <h4 className={`text-4xl font-black tracking-tighter ${isLowStock ? 'text-orange-500' : 'text-[#003366]'}`}>
                      {s.global.quantity} <span className="text-xs uppercase text-slate-300">Pcs</span>
                    </h4>
                    {isLowStock && (
                      <div className="mt-2 flex items-center justify-end space-x-2">
                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Low Stock Alert</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-3xl font-black text-[#003366] uppercase tracking-tighter leading-none mb-3">{p.name}</h3>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-4 py-1 rounded-full border border-slate-100 uppercase tracking-widest">{p.specification}</span>
                  <span className="text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest bg-[#4DB848]/5 text-[#4DB848]">
                    Finished Product
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Factory Reserve</p>
                    <div className="flex justify-between items-end">
                      <p className="text-xl font-black text-[#003366]">{s.factory.quantity} <span className="text-[10px]">Pcs</span></p>
                    </div>
                  </div>
                  <div className="bg-[#003366] p-6 rounded-[2.5rem] text-white">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Safety Limit</p>
                    <div className="flex justify-between items-end">
                      <p className="text-xl font-black text-[#4DB848]">{p.minStockLevel} <span className="text-[10px]">Pcs</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                    <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Production</p>
                    <p className="text-lg font-black text-emerald-700">{s.in.quantity} <span className="text-[8px]">Pcs</span></p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                    <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Dispatched</p>
                    <p className="text-lg font-black text-orange-700">{s.out.quantity} <span className="text-[8px]">Pcs</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-10 py-6 flex justify-between items-center border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Node ID: {p.id}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductMaster;
