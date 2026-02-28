
import React, { useState, useMemo } from 'react';
import { Customer, Product, Transaction, TransactionType, UserRole, ProductType, StockMetric, UnitType } from '../types';
import { calculateCustomerInventory } from '../utils';

interface CustomerInsightsProps {
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  onAddCustomer: (c: Customer) => void;
  onUpdateCustomer: (updated: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
  onAddProduct: (p: Product) => void;
  userRole: UserRole;
  canEdit: boolean;
  canAdjustAssets: boolean;
}

const CustomerInsights: React.FC<CustomerInsightsProps> = ({ 
  customers, products, transactions, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onAddTransaction, onAddProduct, userRole, canEdit, canAdjustAssets
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newCust, setNewCust] = useState<Partial<Customer>>({});
  const [adjustData, setAdjustData] = useState({ customerId: '', productId: '', newProductName: '', quantity: 0, weight: 0, mode: 'set' as 'add' | 'delete' | 'set' });

  const openAdjustModal = (productId: string = '', customerId: string = '') => {
    const targetCustId = customerId || selectedCustomerId || '';
    const current = productId && targetCustId ? calculateCustomerInventory(targetCustId, transactions, products)[productId] : { quantity: 0, weight: 0 };
    
    setAdjustData({ 
      customerId: targetCustId, 
      productId, 
      newProductName: '',
      quantity: current?.quantity || 0, 
      weight: current?.weight || 0, 
      mode: 'set' 
    });
    setShowAdjustModal(true);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerInv: Record<string, StockMetric> = useMemo(() => calculateCustomerInventory(selectedCustomerId, transactions, products), [selectedCustomerId, transactions, products]);
  
  const customerTransactions = useMemo(() => {
    return transactions.filter(t => t.customerId === selectedCustomerId).sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedCustomerId, transactions]);
  
  const handleAddCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;
    const c: Customer = { id: `c-${Date.now()}`, name: newCust.name, contact: newCust.contact || '', address: newCust.address || '' };
    onAddCustomer(c);
    setSelectedCustomerId(c.id);
    setShowModal(false);
    setNewCust({});
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCustomerId = adjustData.customerId || selectedCustomerId;
    if (!targetCustomerId) return;

    let targetProductId = adjustData.productId;

    if (!targetProductId) return;

    let finalQty = 0;
    let finalWgt = 0;

    if (adjustData.mode === 'set') {
      const current = calculateCustomerInventory(targetCustomerId, transactions, products)[targetProductId] || { quantity: 0, weight: 0 };
      finalQty = adjustData.quantity - current.quantity;
      finalWgt = adjustData.weight - current.weight;
    } else {
      finalQty = adjustData.mode === 'add' ? adjustData.quantity : -adjustData.quantity;
      finalWgt = adjustData.mode === 'add' ? adjustData.weight : -adjustData.weight;
    }

    if (finalQty === 0 && finalWgt === 0) {
      setShowAdjustModal(false);
      return;
    }

    onAddTransaction({
      id: `adj-${Date.now()}`,
      productId: targetProductId,
      customerId: targetCustomerId,
      type: TransactionType.ADJUSTMENT,
      quantity: finalQty,
      weight: finalWgt,
      referenceNumber: `ADJ-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      recordedBy: userRole,
      notes: adjustData.mode === 'set' ? 'Stock Take / Balance Reset' : `${adjustData.mode === 'add' ? 'Partner Production' : 'Manual Removal'} (${adjustData.mode})`
    });

    setShowAdjustModal(false);
    setAdjustData({ customerId: '', productId: '', newProductName: '', quantity: 0, weight: 0, mode: 'set' });
    if (targetCustomerId !== selectedCustomerId) {
      setSelectedCustomerId(targetCustomerId);
    }
  };

  const selectedAdjProduct = products.find(p => p.id === adjustData.productId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#1E2E62] tracking-tighter uppercase">Partner Assets</h2>
          <p className="text-slate-500 font-medium italic">Monitoring Count and KG of Roller assets held by manufacturing partners.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {canAdjustAssets && (
            <button 
              onClick={() => openAdjustModal()}
              className="bg-emerald-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center uppercase tracking-widest text-[10px] md:text-xs w-full sm:w-auto"
            >
              <i className="fa-solid fa-screwdriver-wrench mr-3"></i> Update Stock
            </button>
          )}
          {canEdit && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#E31E24] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-[#c1181d] transition-all shadow-xl shadow-red-900/10 flex items-center justify-center uppercase tracking-widest text-[10px] md:text-xs w-full sm:w-auto"
            >
              <i className="fa-solid fa-user-plus mr-3"></i> Register Partner
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 overflow-hidden h-fit shadow-sm lg:sticky lg:top-6">
          <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Directory</h3>
            <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-black">{customers.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[300px] lg:max-h-[600px] overflow-y-auto">
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className={`w-full text-left px-4 md:px-6 py-4 md:py-5 transition-all ${selectedCustomerId === c.id ? 'bg-[#1E2E62] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <p className="font-black truncate text-sm md:text-base">{c.name}</p>
                <p className={`text-[9px] md:text-[10px] font-bold truncate opacity-70`}>{c.contact}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          {selectedCustomer ? (
            <>
              <div className="bg-[#1E2E62] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-[#E31E24] opacity-10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">{selectedCustomer.name}</h3>
                    <div className="flex items-center mt-3 text-blue-200">
                      <i className="fa-solid fa-location-dot mr-2 text-[#E31E24]"></i>
                      <span className="text-xs md:text-sm font-bold tracking-tight">{selectedCustomer.address}</span>
                    </div>
                  </div>
                  {canAdjustAssets && (
                    <button 
                      onClick={() => openAdjustModal()}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest border border-white/20 w-full md:w-auto"
                    >
                      <i className="fa-solid fa-screwdriver-wrench mr-2"></i> Adjust Assets
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100">
                <h3 className="text-xl md:text-2xl font-black text-[#1E2E62] uppercase tracking-tighter flex items-center mb-6 md:mb-10">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-[#E31E24] text-white rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-6 shadow-xl shadow-red-200">
                    <i className="fa-solid fa-dharmachakra text-xl md:text-2xl"></i>
                  </div>
                  Roller Custody Position
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Cast entries to avoid unknown property errors when accessing StockMetric fields */}
                  {(Object.entries(customerInv) as [string, StockMetric][]).some(([pId, m]) => {
                    const p = products.find(prod => prod.id === pId);
                    return p?.type === ProductType.ROLLER && (m.quantity !== 0 || m.weight !== 0);
                  }) ? (
                    (Object.entries(customerInv) as [string, StockMetric][]).map(([pId, m]) => {
                      const p = products.find(prod => prod.id === pId);
                      if (!p || p.type !== ProductType.ROLLER || (m.quantity === 0 && m.weight === 0)) return null;
                      const isCritical = m.weight <= p.minStockLevel;

                      return (
                        <div key={pId} className="group bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-transparent hover:border-[#1E2E62]/20 hover:bg-white transition-all duration-300">
                          <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg border border-slate-100 group-hover:scale-110 transition-transform">
                              <i className="fa-solid fa-dharmachakra text-2xl md:text-3xl text-[#1E2E62]"></i>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl md:text-3xl font-black tracking-tighter ${isCritical ? 'text-[#E31E24]' : 'text-emerald-600'}`}>
                                {m.quantity} <span className="text-[8px] md:text-[10px] uppercase">Pcs</span>
                              </p>
                              <p className={`text-2xl md:text-3xl font-black tracking-tighter ${isCritical ? 'text-[#E31E24]' : 'text-[#1E2E62]'}`}>
                                {m.weight} <span className="text-[8px] md:text-[10px] uppercase">KG</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-lg md:text-xl font-black text-[#1E2E62] mb-1">{p.name}</p>
                              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety Limit: {p.minStockLevel} KG</p>
                            </div>
                            {canAdjustAssets && (
                              <button 
                                onClick={() => openAdjustModal(p.id)}
                                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#1E2E62]/5 text-[#1E2E62] rounded-lg md:rounded-xl hover:bg-[#1E2E62] hover:text-white transition-all shadow-inner"
                                title="Adjust this asset"
                              >
                                <i className="fa-solid fa-plus-minus text-[10px]"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-1 md:col-span-2 py-12 md:py-20 bg-slate-50 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <i className="fa-solid fa-ghost text-3xl md:text-4xl text-slate-200 mb-4 md:mb-6"></i>
                      <h4 className="text-lg md:text-xl font-black text-[#1E2E62] mb-2 uppercase">Zero Roller Balance</h4>
                      <p className="text-slate-400 max-w-xs font-medium uppercase text-[8px] md:text-[10px] tracking-widest">No Rollers currently in possession.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100">
                <h3 className="text-2xl font-black text-[#1E2E62] uppercase tracking-tighter flex items-center mb-10">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mr-6 shadow-xl shadow-slate-300">
                    <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
                  </div>
                  Asset Issuing History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                        <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                        <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customerTransactions.length > 0 ? customerTransactions.map(t => {
                        const p = products.find(prod => prod.id === t.productId);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 text-[11px] font-bold text-slate-500">{new Date(t.timestamp).toLocaleDateString()}</td>
                            <td className="py-4 font-black text-[#1E2E62] text-xs uppercase">{p?.name || 'Unknown'}</td>
                            <td className="py-4">
                              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                                t.type === TransactionType.DISPATCH_OUT ? 'bg-orange-100 text-orange-600' :
                                t.type === TransactionType.RETURN_IN ? 'bg-emerald-100 text-emerald-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="py-4 text-right font-black text-[#1E2E62] text-xs">{t.quantity}</td>
                            <td className="py-4 text-right font-black text-[#E31E24] text-xs">{t.weight?.toFixed(1) || '0.0'} KG</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No transaction history found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-32 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
              <i className="fa-solid fa-users-viewfinder text-5xl text-slate-200 mb-8"></i>
              <h3 className="text-2xl font-black text-[#1E2E62] mb-4 uppercase">Select Account Profile</h3>
            </div>
          )}
        </div>
      </div>

      {showAdjustModal && canAdjustAssets && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#1E2E62] p-10 text-white">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Update Partner Stock</h3>
              <p className="text-blue-200 font-bold uppercase text-[10px] tracking-widest">Administrative Asset Correction</p>
            </div>
            <form onSubmit={handleAdjustStock} className="p-10 space-y-8">
              <div className="flex space-x-2">
                <button type="button" onClick={() => setAdjustData({...adjustData, mode: 'set'})} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${adjustData.mode === 'set' ? 'bg-[#1E2E62] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Set Balance</button>
                <button type="button" onClick={() => setAdjustData({...adjustData, mode: 'add'})} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${adjustData.mode === 'add' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Add (+)</button>
                <button type="button" onClick={() => setAdjustData({...adjustData, mode: 'delete'})} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${adjustData.mode === 'delete' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Remove (-)</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Partner Account</label>
                  <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[#1E2E62]" value={adjustData.customerId} onChange={e => setAdjustData({...adjustData, customerId: e.target.value})}>
                    <option value="">-- Select Partner --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Asset SKU</label>
                  <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[#1E2E62]" value={adjustData.productId} onChange={e => setAdjustData({...adjustData, productId: e.target.value})}>
                    <option value="">-- Select Asset --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Count (Pcs)</label>
                    <input type="number" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-[#1E2E62]" value={adjustData.quantity || ''} onChange={e => setAdjustData({...adjustData, quantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Weight (KG)</label>
                    <input type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-[#E31E24]" value={adjustData.weight || ''} onChange={e => setAdjustData({...adjustData, weight: Number(e.target.value)})} />
                  </div>
                </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className={`flex-1 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest ${adjustData.mode === 'add' ? 'bg-emerald-600' : 'bg-red-600'}`}>Apply Change</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && canEdit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#1E2E62] p-10 text-white flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase tracking-tighter">New Account</h3>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-4 rounded-2xl"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <form onSubmit={handleAddCust} className="p-10 space-y-8">
              <input type="text" required placeholder="Partner Company Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[#1E2E62]" onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input type="text" placeholder="Representative Contact" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[#1E2E62]" onChange={e => setNewCust({...newCust, contact: e.target.value})} />
              <textarea placeholder="Logistics Address" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium" rows={3} onChange={e => setNewCust({...newCust, address: e.target.value})} />
              <button type="submit" className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest">Register Partner</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInsights;
