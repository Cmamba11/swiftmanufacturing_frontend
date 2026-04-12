
import React, { useState, useMemo } from 'react';
import { Product, ProductType, UnitType, Transaction, TransactionType, UserRole, InventoryStats, Customer, StockMetric, Shift, MachineType, ProductionRecord } from '../types';
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
  canManageInventory: boolean;
}

const ProductMaster: React.FC<ProductMasterProps> = ({ 
  products, customers, transactions, stats, onAdd, onUpdate, onDelete, onAddTransaction, userRole, canEdit, canDelete, canManageInventory 
}) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 0,
    weight: 0,
    date: new Date().toISOString().split('T')[0],
    shift: Shift.DAY,
    referenceNumber: '',
    notes: ''
  });

  // Show only 'Packing Bags' in Factory Inventory
  const factoryProducts = useMemo(() => {
    return products.filter(p => p.type === ProductType.PACKING_BAG);
  }, [products]);

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || stockForm.quantity <= 0) return;

    // Use the selected date for the timestamp
    const timestamp = new Date(stockForm.date).getTime();

    // Update Factory Inventory
    onAddTransaction({
      id: `trx-stock-${Date.now()}`,
      productId: selectedProductId,
      type: TransactionType.PRODUCTION_IN,
      quantity: Number(stockForm.quantity),
      weight: Number(stockForm.weight),
      shift: stockForm.shift,
      referenceNumber: stockForm.referenceNumber || `STK-${stockForm.date}`,
      timestamp: timestamp,
      recordedBy: userRole,
      notes: stockForm.notes || 'Manual Stock Update'
    });

    setShowStockModal(false);
    setStockForm({
      quantity: 0,
      weight: 0,
      date: new Date().toISOString().split('T')[0],
      shift: Shift.DAY,
      referenceNumber: '',
      notes: ''
    });
    alert('Inventory updated successfully.');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Factory Inventory</h2>
          <p className="text-slate-500 font-medium italic">Finished goods tracking for Packing Bags.</p>
        </div>
        {canManageInventory && factoryProducts.length > 0 ? (
          <button 
            onClick={() => {
              setSelectedProductId(factoryProducts[0].id);
              setShowStockModal(true);
            }}
            className="bg-[#4DB848] text-[#003366] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#45a641] transition-all shadow-lg shadow-green-900/10 flex items-center group"
          >
            <i className="fa-solid fa-plus-circle mr-3 text-xl group-hover:rotate-90 transition-transform"></i>
            Add Stock
          </button>
        ) : !canManageInventory && (
          <div className="flex items-center bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">
            <i className="fa-solid fa-lock text-slate-400 mr-3"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">View Only Mode: Elevated permissions required to update stock</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {factoryProducts.length > 0 ? factoryProducts.map(p => {
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
                {canManageInventory && (
                  <button 
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setShowStockModal(true);
                    }}
                    className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] hover:bg-[#002855] transition-all flex items-center shadow-md hover:shadow-lg active:scale-95"
                  >
                    <i className="fa-solid fa-plus-circle mr-2 text-[#4DB848]"></i>
                    Update Stock Level
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 py-32 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <i className="fa-solid fa-box-open text-6xl text-slate-200 mb-8"></i>
            <h3 className="text-2xl font-black text-[#003366] mb-4 uppercase">No Packing Bags Found</h3>
            <p className="text-slate-400 font-medium uppercase text-xs tracking-widest">Register packing bags in the system to track factory inventory.</p>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#003366] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Update Factory Stock</h3>
                <p className="text-[#4DB848] text-[10px] font-black uppercase tracking-widest mt-1">Manual Inventory Adjustment</p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]"
                    value={stockForm.date}
                    onChange={e => setStockForm({...stockForm, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Shift</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]"
                    value={stockForm.shift}
                    onChange={e => setStockForm({...stockForm, shift: e.target.value as Shift})}
                  >
                    {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity (Pcs)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-2xl text-[#003366]"
                    value={stockForm.quantity || ''}
                    onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight (KG)</label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    step="0.01"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-2xl text-[#003366]"
                    value={stockForm.weight || ''}
                    onChange={e => setStockForm({...stockForm, weight: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. BATCH-001"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]"
                  value={stockForm.referenceNumber}
                  onChange={e => setStockForm({...stockForm, referenceNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                <textarea 
                  placeholder="Additional details..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-medium text-[#003366] h-24 resize-none"
                  value={stockForm.notes}
                  onChange={e => setStockForm({...stockForm, notes: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-[#003366] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#002855] transition-all shadow-xl uppercase tracking-widest">
                Confirm Stock Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaster;
