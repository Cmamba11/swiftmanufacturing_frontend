
import React, { useState } from 'react';
import { Product, Transaction, TransactionType, UserRole, ProductType, Customer, Shift } from '../types';

interface ReceivingProps {
  products: Product[];
  customers: Customer[]; // Added customers
  onAddTransaction: (t: Transaction) => void;
  userRole: UserRole;
  canCreate: boolean;
}

const Receiving: React.FC<ReceivingProps> = ({ products, customers, onAddTransaction, userRole, canCreate }) => {
  const [formData, setFormData] = useState({
    productId: 'prod-bags',
    customerId: '', 
    quantity: 0,
    weight: 0,
    date: new Date().toISOString().split('T')[0],
    shift: Shift.DAY,
    referenceNumber: '',
    notes: ''
  });

  const isBag = true;
  const isRoller = false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      return;
    }
    if (formData.quantity <= 0) return;
    
    const timestamp = new Date(formData.date).getTime();

   
onAddProduction({
  id: `prod-rec-${Date.now()}`,
  date: formData.date,
  shift: formData.shift,
  machineType: MachineType.EXTRUSION_BAGS,
  actualOutputKg: Number(formData.weight),
  actualCount: Number(formData.quantity),
  timestamp: Date.now()
});

    setFormData({ 
      productId: '', 
      customerId: '', 
      quantity: 0, 
      weight: 0, 
      date: new Date().toISOString().split('T')[0],
      shift: Shift.DAY,
      referenceNumber: '', 
      notes: '' 
    });
    alert('Intake recorded. Branded stock allocated to Partner.');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#003366] p-6 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-[#4DB848] opacity-10 rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center">
              <i className="fa-solid fa-industry mr-4 md:mr-5 text-[#4DB848]"></i>
              Production Intake
            </h2>
            <p className="text-[#4DB848] font-bold uppercase text-[8px] md:text-[10px] tracking-[0.3em] mt-2 md:mt-3">Recording Finished Goods from Production</p>
          </div>
        </div>
        
        {canCreate ? (
        <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-8 md:space-y-10">
          <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Date</label>
                <input 
                  type="date"
                  required
                  value={formData.date}
                  className="w-full px-6 md:px-8 py-4 md:py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none text-base md:text-lg font-black text-[#003366]"
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift</label>
                <select 
                  required
                  value={formData.shift}
                  className="w-full px-6 md:px-8 py-4 md:py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none text-base md:text-lg font-black text-[#003366] appearance-none"
                  onChange={e => setFormData({...formData, shift: e.target.value as Shift})}
                >
                  {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8">
              <div className="space-y-3 md:space-y-4">
                <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Identity</label>
                <div className="relative">
                  <div className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-100 border-2 border-slate-200 rounded-[1.5rem] md:rounded-[2rem] text-base md:text-lg font-black text-[#003366] flex items-center justify-between">
                    <span>Packing Bags</span>
                    <i className="fa-solid fa-lock text-slate-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:gap-10">
            <div className="space-y-3 md:space-y-4">
              <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Bags Produced (Decimal)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  value={formData.quantity || ''}
                  className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none text-2xl md:text-3xl font-black text-[#003366] transition-all"
                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                />
                <span className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase text-[9px] md:text-[10px]">
                  Bags
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
              <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Protocol</label>
              <input 
                type="text" 
                placeholder="PROD-XXX"
                className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none font-mono font-black text-[#003366]"
                value={formData.referenceNumber}
                onChange={e => setFormData({...formData, referenceNumber: e.target.value})}
              />
            </div>
            <div className="space-y-3 md:space-y-4">
              <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Notes</label>
              <input 
                type="text" 
                placeholder="Batch info, machine notes..."
                className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none font-medium text-[#003366]"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 md:pt-8">
            <button 
              type="submit" 
              className="w-full bg-[#003366] text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-xl md:text-2xl hover:bg-[#002855] transition-all shadow-2xl flex justify-center items-center uppercase tracking-[0.2em]"
            >
              Authorize Intake
            </button>
          </div>
        </form>
        ) : (
          <div className="m-6 md:m-12 p-8 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-[10px] uppercase tracking-widest">
            Read-only mode: your role can view production intake data but cannot access the intake form.
          </div>
        )}
      </div>
    </div>
  );
};

export default Receiving;
