
import React, { useState } from 'react';
import { Product, Transaction, Customer, TransactionType, ProductType } from '../types';

interface LedgerProps {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  onVoid: (id: string) => void;
  canVoid: boolean;
}

const Ledger: React.FC<LedgerProps> = ({ products, transactions, customers, onVoid, canVoid }) => {
  const [filter, setFilter] = useState('');

  const filteredTransactions = transactions.filter(t => {
    const p = products.find(prod => prod.id === t.productId);
    const c = customers.find(cust => cust.id === t.customerId);
    const searchStr = `${p?.name} ${t.referenceNumber} ${t.type} ${c?.name || ''} ${t.vehicleId || ''}`.toLowerCase();
    return searchStr.includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Audit Ledger</h2>
          <p className="text-slate-500 font-medium">Immutable record of material movements and asset verification.</p>
        </div>
        <div className="relative w-full md:w-[450px]">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search Reference, SKU, Carrier..."
            className="w-full pl-16 pr-8 py-4 md:py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2rem] focus:border-[#4DB848] focus:outline-none shadow-sm font-black text-[#003366] transition-all"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#003366] text-white/50 text-[9px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-10 py-7">Log Entry</th>
                <th className="px-6 py-7">Identifier</th>
                <th className="px-6 py-7">Classification</th>
                <th className="px-6 py-7">Carrier Node</th>
                <th className="px-6 py-7">Contractor / Node</th>
                <th className="px-6 py-7 text-right">Units (Pcs)</th>
                <th className="px-6 py-7 text-right">Weight (KG)</th>
                <th className="px-10 py-7 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => {
                const p = products.find(prod => prod.id === t.productId);
                const c = customers.find(cust => cust.id === t.customerId);
                const isIncrease = t.type.includes('In') || (t.type === TransactionType.ADJUSTMENT && t.quantity > 0);
                const isRoller = p?.type === ProductType.ROLLER;

                return (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${t.voided ? 'opacity-40 grayscale italic bg-slate-50' : ''}`}>
                    <td className="px-10 py-6">
                      <div className="text-xs font-black text-[#003366]">{new Date(t.timestamp).toLocaleDateString()}</div>
                      <div className="text-[9px] font-mono font-bold text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="px-4 py-1.5 bg-slate-100 text-[#003366] rounded-xl inline-block text-[10px] font-black font-mono border border-slate-200">
                        {t.referenceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="font-black text-[#003366] text-xs uppercase tracking-tight">{p?.name}</div>
                      <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em]">{p?.type}</div>
                      {t.shift && (
                        <div className="mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[7px] font-black uppercase inline-block">
                          {t.shift}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 font-mono font-black text-[#003366] text-xs">
                      {t.vehicleId || 'Internal'}
                      {t.rollsUsed !== undefined && t.rollsUsed > 0 && (
                        <div className="text-[8px] text-slate-400 mt-1">
                          Rolls: {t.rollsUsed}
                        </div>
                      )}
                      {t.kgUsed !== undefined && t.kgUsed > 0 && (
                        <div className="text-[8px] text-[#E31E24] mt-0.5">
                          Used: {t.kgUsed} KG
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 text-[10px] text-slate-600 font-black uppercase tracking-tight">
                      {c?.name || (
                        t.customerId?.startsWith('guest-') 
                          ? (t.notes?.match(/\[Non-Partner: (.*?)\]/)?.[1] || 'Walk-in Customer')
                          : (t.type === TransactionType.PRODUCTION_IN ? 'Plant Input' : 'Inventory Fix')
                      )}
                    </td>
                    <td className={`px-6 py-6 text-right font-mono font-black text-lg ${isIncrease ? 'text-[#4DB848]' : 'text-orange-500'}`}>
                      {isIncrease ? '+' : '-'}{Math.abs(t.quantity || 0)}
                    </td>
                    <td className={`px-6 py-6 text-right font-mono font-black text-lg ${isIncrease ? 'text-[#4DB848]' : 'text-orange-500'}`}>
                      {isRoller ? `${isIncrease ? '+' : '-'}${Math.abs(t.weight || 0)}` : '-'}
                    </td>
                    <td className="px-10 py-6 text-center">
                      {t.voided ? (
                        <span className="text-orange-600 font-black text-[9px] uppercase border border-orange-200 px-3 py-1.5 rounded-xl bg-orange-50">Invalidated</span>
                      ) : (
                        canVoid ? (
                          <button onClick={() => onVoid(t.id)} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Void Entry">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-[#4DB848]/10 text-[#4DB848] rounded-xl">
                            <i className="fa-solid fa-check-circle"></i>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
