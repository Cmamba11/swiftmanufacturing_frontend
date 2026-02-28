
import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, UserRole, Customer, ProductType, InventoryStats } from '../types';
import { calculateCustomerInventory } from '../utils';

interface DispatchProps {
  products: Product[];
  customers: Customer[];
  stats: Record<string, InventoryStats>;
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  userRole: UserRole;
  canSubmit: boolean;
}

const Dispatch: React.FC<DispatchProps> = ({ products, customers, stats, transactions, onAddTransaction, userRole, canSubmit }) => {
  const [isNonPartner, setIsNonPartner] = useState(false);
  const [nonPartnerName, setNonPartnerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    weight: number;
  }>>([{ productId: '', quantity: 0, weight: 0 }]);

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 0, weight: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    
    if (!isNonPartner && !customerId) {
      alert("Please select a partner or specify a non-partner name.");
      return;
    }
    if (isNonPartner && !nonPartnerName) {
      alert("Please enter the name of the non-partner customer.");
      return;
    }

    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid item to dispatch.");
      return;
    }

    // Validate stock for all items first
    for (const item of validItems) {
      const prod = products.find(p => p.id === item.productId);
      const isRoller = prod?.type === ProductType.ROLLER;
      
      let availableQty = 0;
      let availableWgt = 0;

      if (!isNonPartner && customerId && isRoller) {
        const custInv = calculateCustomerInventory(customerId, transactions, products);
        availableQty = custInv[item.productId]?.quantity || 0;
        availableWgt = custInv[item.productId]?.weight || 0;
      } else {
        const factoryStock = stats[item.productId]?.factory || { quantity: 0, weight: 0 };
        availableQty = factoryStock.quantity;
        availableWgt = factoryStock.weight;
      }

      if (item.quantity > availableQty || (isRoller && item.weight > availableWgt)) {
        alert(`Insufficient stock for ${prod?.name || 'item'}!`);
        return;
      }
    }

    // Execute transactions
    const finalCustomerId = isNonPartner ? `guest-${Date.now()}` : customerId;
    const finalNotes = isNonPartner ? `[Non-Partner: ${nonPartnerName}] ${notes}` : notes;
    const ref = referenceNumber || `DELV-${Date.now().toString().slice(-6)}`;

    validItems.forEach((item, idx) => {
      const prod = products.find(p => p.id === item.productId);
      const isRoller = prod?.type === ProductType.ROLLER;
      
      // If it's a Roller and a Partner is selected, it's an ISSUANCE from their stock
      const type = (!isNonPartner && isRoller) ? TransactionType.ISSUANCE : TransactionType.DISPATCH_OUT;

      onAddTransaction({
        id: `trx-disp-${Date.now()}-${idx}`,
        productId: item.productId,
        customerId: finalCustomerId,
        type: type,
        quantity: Number(item.quantity),
        weight: isRoller ? Number(item.weight) : 0,
        referenceNumber: ref,
        vehicleId: vehicleId,
        timestamp: Date.now(),
        recordedBy: userRole,
        notes: finalNotes
      });
    });

    setItems([{ productId: '', quantity: 0, weight: 0 }]);
    setCustomerId('');
    setNonPartnerName('');
    setVehicleId('');
    setReferenceNumber('');
    setNotes('');
    alert('Multi-item dispatch successful!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#E31E24] p-6 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-[#1E2E62] opacity-20 rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center">
              <i className="fa-solid fa-truck-fast mr-3 md:mr-4 text-white"></i>
              Factory Issuing & Dispatch
            </h2>
            <p className="text-red-100 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">Issue Rollers or Packing Bags to Partners or Walk-in Customers</p>
          </div>
        </div>
        
        {canSubmit ? (
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10">
          <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Details</h3>
              <button 
                type="button" 
                onClick={() => setIsNonPartner(!isNonPartner)}
                className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border transition-all w-full md:w-auto ${isNonPartner ? 'bg-[#E31E24] text-white border-[#E31E24]' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {isNonPartner ? 'Switch to Registered Partner' : 'Walk-in / Non-Partner'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {isNonPartner ? (
                <div>
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Customer Name (Non-Partner)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Customer Name"
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#E31E24] focus:outline-none font-black text-[#1E2E62]"
                    value={nonPartnerName}
                    onChange={e => setNonPartnerName(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Receiving Partner</label>
                  <select 
                    required
                    value={customerId}
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#E31E24] focus:outline-none font-black text-[#1E2E62] transition-colors appearance-none"
                    onChange={e => setCustomerId(e.target.value)}
                  >
                    <option value="">-- Choose Account --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Vehicle Plate #</label>
                <input 
                  type="text" 
                  placeholder="VEH-XXXX"
                  className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#E31E24] focus:outline-none font-mono font-black text-[#1E2E62]"
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material List</h3>
              {canSubmit && (
                <button 
                  type="button" 
                  onClick={addItem}
                  className="text-[9px] font-black uppercase text-[#E31E24] hover:text-red-700 flex items-center"
                >
                  <i className="fa-solid fa-circle-plus mr-2"></i> Add Another Item
                </button>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProd = products.find(p => p.id === item.productId);
                const isRoller = selectedProd?.type === ProductType.ROLLER;
                
                let stock = { quantity: 0, weight: 0 };
                if (!isNonPartner && customerId && isRoller) {
                  const custInv = calculateCustomerInventory(customerId, transactions, products);
                  stock = custInv[item.productId] || { quantity: 0, weight: 0 };
                } else {
                  stock = stats[item.productId]?.factory || { quantity: 0, weight: 0 };
                }

                return (
                  <div key={index} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group">
                    {canSubmit && items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                      <div className="lg:col-span-5">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Product</label>
                        <select 
                          required
                          value={item.productId}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-[#1E2E62]"
                          onChange={e => updateItem(index, 'productId', e.target.value)}
                        >
                          <option value="">-- Select Material --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-3">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity (Pcs)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            required
                            min="1"
                            placeholder="0"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-[#1E2E62]"
                            value={item.quantity || ''}
                            onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                          {item.productId && (
                            <p className="absolute -bottom-5 left-0 text-[8px] font-bold text-slate-400">
                              Avail: {stock.quantity}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-4">
                        {isRoller ? (
                          <>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Weight (KG)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                required
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-[#E31E24]"
                                value={item.weight || ''}
                                onChange={e => updateItem(index, 'weight', Number(e.target.value))}
                              />
                              <p className="absolute -bottom-5 left-0 text-[8px] font-bold text-slate-400">
                                Avail: {stock.weight} KG
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="h-[46px] flex items-center px-4 bg-slate-100 rounded-xl border border-dashed border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Weight Required</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Delivery Reference</label>
              <input 
                type="text" 
                placeholder="DELV-XXXX"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#E31E24] focus:outline-none font-mono font-black text-[#1E2E62]"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Additional Notes</label>
              <input 
                type="text" 
                placeholder="Any special instructions..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#E31E24] focus:outline-none font-medium text-[#1E2E62]"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6">
            {canSubmit && (
              <button 
                type="submit" 
                className="w-full bg-[#1E2E62] text-white py-6 rounded-[2rem] font-black text-xl hover:bg-[#152044] transition-all shadow-xl shadow-blue-100 flex justify-center items-center uppercase tracking-widest"
              >
                <i className="fa-solid fa-truck-loading mr-3"></i>
                Confirm Multi-Item Issuance
              </button>
            )}
          </div>
        </form>
        ) : (
          <div className="p-6 md:p-10">
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-[10px] uppercase tracking-widest">
              Read-only mode: your role can view dispatch records but cannot access the dispatch form.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dispatch;
