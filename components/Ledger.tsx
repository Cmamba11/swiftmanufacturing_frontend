import React, { useState, useMemo } from 'react';
import { 
  Product, 
  Transaction, 
  Customer, 
  TransactionType, 
  ProductType, 
  IssuingRecord, 
  SparePartIssuance, 
  SparePart,
  MaterialInboundRecord 
} from '../types';

interface LedgerProps {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  issuingRecords: IssuingRecord[];
  sparePartIssuances: SparePartIssuance[];
  spareParts: SparePart[];
  materialInboundRecords: MaterialInboundRecord[];
  onVoid: (id: string) => void;
  canVoid: boolean;
}

const Ledger: React.FC<LedgerProps> = ({ 
  products, 
  transactions, 
  customers, 
  issuingRecords,
  sparePartIssuances,
  spareParts,
  materialInboundRecords,
  onVoid, 
  canVoid 
}) => {
  const [filter, setFilter] = useState('');

  const unifiedEntries = useMemo(() => {
    const entries: any[] = [
      ...transactions.map(t => ({ 
        id: t.id,
        timestamp: Number(t.timestamp),
        reference: t.referenceNumber,
        type: t.type,
        classification: products.find(p => p.id === t.productId)?.name || 'Unknown Product',
        subClassification: products.find(p => p.id === t.productId)?.type || '',
        carrier: t.vehicleId || 'Internal',
        node: customers.find(c => c.id === t.customerId)?.name || 
              (t.customerId?.startsWith('guest-') ? (t.notes?.match(/\[Non-Partner: (.*?)\]/)?.[1] || 'Walk-in Customer') : 
              (t.type === TransactionType.PRODUCTION_IN ? 'Plant Input' : 'Inventory Fix')),
        quantity: t.quantity,
        weight: t.weight,
        unit: products.find(p => p.id === t.productId)?.type === ProductType.ROLLER ? 'KG' : 'Pcs',
        isIncrease: t.type.includes('In') || (t.type === TransactionType.ADJUSTMENT && t.quantity > 0),
        voided: t.voided,
        original: t,
        category: 'FINISH_GOODS'
      })),
      ...issuingRecords.map(r => ({
        id: r.id,
        timestamp: Number(r.timestamp),
        reference: `ISS-${r.id.slice(-4)}`,
        type: 'Material Issuance',
        classification: r.machineType,
        subClassification: 'Warehouse Issuing',
        carrier: r.shift,
        node: 'Production Floor',
        quantity: r.totalIssuedKg,
        weight: r.totalIssuedKg,
        unit: 'KG',
        isIncrease: false,
        voided: false,
        category: 'RAW_MATERIAL'
      })),
      ...sparePartIssuances.map(s => ({
        id: s.id,
        timestamp: Number(s.timestamp),
        reference: `SPR-${s.id.slice(-4)}`,
        type: 'Spare Issuing',
        classification: `Part ID: ${s.partId}`,
        subClassification: 'Maintenance',
        carrier: s.issuedTo,
        node: 'Technical Dept',
        quantity: s.quantity,
        weight: 0,
        unit: 'Pcs',
        isIncrease: false,
        voided: false,
        category: 'SPARE_PARTS'
      })),
      ...materialInboundRecords.map(m => ({
        id: m.id,
        timestamp: Number(m.timestamp),
        reference: `INB-${m.id.slice(-4)}`,
        type: 'Material Inbound',
        classification: m.grade,
        subClassification: 'Raw Material',
        carrier: m.recordedBy,
        node: 'Warehouse Inbound',
        quantity: m.amount,
        weight: m.amount * 25, // Assuming 25kg per bag
        unit: 'Bags',
        isIncrease: true,
        voided: false,
        category: 'RAW_MATERIAL'
      })),
      ...spareParts.map(p => ({
        id: p.id,
        timestamp: Number(p.timestamp),
        reference: `SP-IN-${p.id.slice(-4)}`,
        type: 'Spare Inbound',
        classification: p.name,
        subClassification: p.machineType,
        carrier: 'Warehouse',
        node: 'Inventory Inbound',
        quantity: p.quantity,
        weight: 0,
        unit: 'Pcs',
        isIncrease: true,
        voided: false,
        category: 'SPARE_PARTS'
      }))
    ];

    return entries
      .filter(e => {
        const searchStr = `${e.classification} ${e.reference} ${e.type} ${e.node} ${e.carrier}`.toLowerCase();
        return searchStr.includes(filter.toLowerCase());
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, issuingRecords, sparePartIssuances, spareParts, materialInboundRecords, products, customers, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Central Ledger</h2>
          <p className="text-slate-500 font-medium">Unified audit trail for all system movements and actions.</p>
        </div>
        <div className="relative w-full md:w-[450px]">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search Action, SKU, Node..."
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
                <th className="px-10 py-7">Timestamp</th>
                <th className="px-6 py-7">Reference</th>
                <th className="px-6 py-7">Action Type</th>
                <th className="px-6 py-7">Entity / SKU</th>
                <th className="px-6 py-7">Origin / Destination</th>
                <th className="px-6 py-7 text-right">Quantity</th>
                <th className="px-6 py-7 text-right">Weight (KG)</th>
                <th className="px-10 py-7 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedEntries.map(e => (
                <tr key={e.id} className={`hover:bg-slate-50/50 transition-colors ${e.voided ? 'opacity-40 grayscale italic bg-slate-50' : ''}`}>
                  <td className="px-10 py-6">
                    <div className="text-xs font-black text-[#003366]">{new Date(e.timestamp).toLocaleDateString()}</div>
                    <div className="text-[9px] font-mono font-bold text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="px-4 py-1.5 bg-slate-100 text-[#003366] rounded-xl inline-block text-[10px] font-black font-mono border border-slate-200">
                      {e.reference}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-black text-[#003366] text-xs uppercase tracking-tight">{e.type}</div>
                    <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em]">{e.category}</div>
                  </td>
                  <td className="px-6 py-6 font-mono font-black text-[#003366] text-xs">
                    <div className="font-black text-[#003366] text-xs uppercase tracking-tight">{e.classification}</div>
                    <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em]">{e.subClassification}</div>
                  </td>
                  <td className="px-6 py-6 text-[10px] text-slate-600 font-black uppercase tracking-tight">
                    <div className="text-[#003366]">{e.node}</div>
                    <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em]">{e.carrier}</div>
                  </td>
                  <td className={`px-6 py-6 text-right font-mono font-black text-lg ${e.isIncrease ? 'text-[#4DB848]' : 'text-orange-500'}`}>
                    {e.isIncrease ? '+' : '-'}{Math.abs(e.quantity || 0)}
                  </td>
                  <td className={`px-6 py-6 text-right font-mono font-black text-lg ${e.isIncrease ? 'text-[#4DB848]' : 'text-orange-500'}`}>
                    {e.weight ? `${e.isIncrease ? '+' : '-'}${Math.abs(e.weight || 0)}` : '-'}
                  </td>
                  <td className="px-10 py-6 text-center">
                    {e.voided ? (
                      <span className="text-orange-600 font-black text-[9px] uppercase border border-orange-200 px-3 py-1.5 rounded-xl bg-orange-50">Invalidated</span>
                    ) : (
                      e.category === 'FINISH_GOODS' && canVoid ? (
                        <button onClick={() => onVoid(e.id)} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Void Entry">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
