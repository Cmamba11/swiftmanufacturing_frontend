
import React, { useState, useMemo } from 'react';
import { IssuingRecord, ProductionRecord, Shift, MachineType, MaterialGrade, MaterialStock, SparePart, SparePartIssuance, MaterialInboundRecord } from '../types';

interface WarehouseSystemProps {
  issuingRecords: IssuingRecord[];
  productionRecords: ProductionRecord[];
  materialStock: MaterialStock;
  spareParts: SparePart[];
  sparePartIssuances: SparePartIssuance[];
  onAddIssuing: (rec: IssuingRecord) => void;
  onAddProduction: (rec: ProductionRecord) => void;
  onUpdateMaterialStock: (grade: MaterialGrade, amount: number) => void;
  onAddSparePart: (part: SparePart) => void;
  onUpdateSparePart: (part: SparePart) => void;
  onAddSpareIssuance: (iss: SparePartIssuance) => void;
  onAddMaterialInbound: (rec: MaterialInboundRecord) => void;
}

const WarehouseSystem: React.FC<WarehouseSystemProps> = ({ 
  issuingRecords, 
  productionRecords, 
  materialStock, 
  spareParts,
  sparePartIssuances,
  onAddIssuing, 
  onAddProduction, 
  onUpdateMaterialStock,
  onAddSparePart,
  onUpdateSparePart,
  onAddSpareIssuance,
  onAddMaterialInbound
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'issuing' | 'production' | 'comparison' | 'materials' | 'spare-parts' | 'spare-issuing'>('production');
  
  const [issuingForm, setIssuingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: Shift.DAY,
    machineType: MachineType.EXTRUSION_ROLLERS,
    hdBags: 0,
    lldBags: 0,
    exceedBags: 0,
    ipaBags: 0,
    tulaneBags: 0,
    rolls: 0,
    weight: 0,
    // Process Parameters
    conversionFactor: 1.1098,
    wastePercent: 0
  });

  const [productionForm, setProductionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: Shift.DAY,
    machineType: MachineType.EXTRUSION_ROLLERS,
    actualOutputKg: 0,
    actualCount: 0,
    rollsUsed: 0,
    kgUsed: 0
  });

  const [stockAddForm, setStockAddForm] = useState({
    grade: MaterialGrade.HD,
    bags: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [sparePartForm, setSparePartForm] = useState({
    name: '',
    quantity: 0,
    value: 0,
    machineType: MachineType.EXTRUSION_ROLLERS
  });

  const [spareIssuanceForm, setSpareIssuanceForm] = useState({
    partId: '',
    quantity: 0,
    issuedTo: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const isExtrusion = issuingForm.machineType === MachineType.EXTRUSION_ROLLERS || 
                        issuingForm.machineType === MachineType.EXTRUSION_BAGS;
  const isPrinting = issuingForm.machineType === MachineType.PRINTING;
  const usesMaterials = isExtrusion || isPrinting;

  const totalInputWeight = useMemo(() => {
    if (isExtrusion) {
      return (issuingForm.hdBags + issuingForm.lldBags + issuingForm.exceedBags) * 25;
    }
    if (isPrinting) {
      return (issuingForm.ipaBags + issuingForm.tulaneBags) * 165;
    }
    return 0;
  }, [issuingForm.hdBags, issuingForm.lldBags, issuingForm.exceedBags, issuingForm.ipaBags, issuingForm.tulaneBags, isExtrusion, isPrinting]);

  const currentFactor = useMemo(() => {
    if (issuingForm.machineType === MachineType.EXTRUSION_ROLLERS) return 1.03;
    if (issuingForm.machineType === MachineType.EXTRUSION_BAGS) return 1.006;
    return issuingForm.conversionFactor;
  }, [issuingForm.machineType, issuingForm.conversionFactor]);

  // Formula: expectedOutput = inputWeight * CONVERSION_FACTOR * (1 - WASTE_PERCENT)
  const calculatedIssuingKg = useMemo(() => {
    if (usesMaterials) {
      const wasteMultiplier = 1 - (issuingForm.wastePercent / 100);
      return totalInputWeight * currentFactor * wasteMultiplier;
    } else {
      return issuingForm.weight;
    }
  }, [totalInputWeight, issuingForm.weight, currentFactor, issuingForm.wastePercent, usesMaterials]);

  const handleIssuingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usesMaterials) {
      if (totalInputWeight <= 0) return alert("Total input must be greater than zero.");
      if (issuingForm.hdBags > materialStock[MaterialGrade.HD]) return alert("Insufficient HD bags!");
      if (issuingForm.lldBags > materialStock[MaterialGrade.LLD]) return alert("Insufficient LLD bags!");
      if (issuingForm.exceedBags > materialStock[MaterialGrade.EXCEED]) return alert("Insufficient EXCEED bags!");
      if (issuingForm.ipaBags > materialStock[MaterialGrade.IPA]) return alert("Insufficient IPA stock!");
      if (issuingForm.tulaneBags > materialStock[MaterialGrade.TULANE]) return alert("Insufficient TULANE stock!");
    } else {
      if (issuingForm.weight <= 0) return alert("Total weight must be greater than zero.");
    }
    
    const record: IssuingRecord = {
      id: `iss-${Date.now()}`,
      date: issuingForm.date,
      shift: issuingForm.shift,
      machineType: issuingForm.machineType,
      materialBags: usesMaterials ? {
        [MaterialGrade.HD]: issuingForm.hdBags,
        [MaterialGrade.LLD]: issuingForm.lldBags,
        [MaterialGrade.EXCEED]: issuingForm.exceedBags,
        [MaterialGrade.IPA]: issuingForm.ipaBags,
        [MaterialGrade.TULANE]: issuingForm.tulaneBags
      } : undefined,
      rollsIssued: !usesMaterials ? issuingForm.rolls : undefined,
      weightIssued: !usesMaterials ? issuingForm.weight : undefined,
      totalInputKg: usesMaterials ? totalInputWeight : (issuingForm.weight || 0),
      totalIssuedKg: calculatedIssuingKg,
      timestamp: Date.now()
    };
    
    onAddIssuing(record);
    alert(`Batch Issuing recorded. Expected Yield: ${calculatedIssuingKg.toFixed(2)} KG.`);
    setIssuingForm({ ...issuingForm, hdBags: 0, lldBags: 0, exceedBags: 0, ipaBags: 0, tulaneBags: 0, rolls: 0, weight: 0 });
  };

  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: ProductionRecord = {
      ...productionForm,
      id: `prod-rec-${Date.now()}`,
      timestamp: Date.now()
    };
    onAddProduction(record);
    alert(`Production recorded for ${productionForm.machineType}.`);
    setProductionForm({ ...productionForm, actualOutputKg: 0, actualCount: 0, rollsUsed: 0, kgUsed: 0 });
  };

  const handleStockAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockAddForm.bags <= 0) return alert("Quantity must be greater than zero.");
    
    onUpdateMaterialStock(stockAddForm.grade, stockAddForm.bags);
    
    onAddMaterialInbound({
      id: `inb-${Date.now()}`,
      grade: stockAddForm.grade,
      amount: stockAddForm.bags,
      date: stockAddForm.date,
      timestamp: Date.now(),
      recordedBy: 'Warehouse Officer'
    });

    const unit = stockAddForm.grade === 'IPA' || stockAddForm.grade === 'TULANE' ? 'drums' : 'bags';
    alert(`Added ${stockAddForm.bags} ${unit} of ${stockAddForm.grade} to inventory.`);
    setStockAddForm({ ...stockAddForm, bags: 0, date: new Date().toISOString().split('T')[0] });
  };

  const handleSparePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sparePartForm.name) return alert("Part name is required.");
    const newPart: SparePart = {
      ...sparePartForm,
      id: `sp-${Date.now()}`
    };
    onAddSparePart(newPart);
    alert(`Spare part ${sparePartForm.name} added.`);
    setSparePartForm({ name: '', quantity: 0, value: 0, machineType: MachineType.EXTRUSION_ROLLERS });
  };

  const handleSpareIssuanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spareIssuanceForm.partId) return alert("Please select a part.");
    if (spareIssuanceForm.quantity <= 0) return alert("Quantity must be greater than zero.");
    
    const part = spareParts.find(p => p.id === spareIssuanceForm.partId);
    if (!part || part.quantity < spareIssuanceForm.quantity) {
      return alert("Insufficient stock for this spare part.");
    }

    const issuance: SparePartIssuance = {
      ...spareIssuanceForm,
      id: `spi-${Date.now()}`,
      timestamp: Date.now()
    };
    onAddSpareIssuance(issuance);
    alert(`Issued ${spareIssuanceForm.quantity} units of ${part.name}.`);
    setSpareIssuanceForm({ partId: '', quantity: 0, issuedTo: '', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const comparisonData = useMemo(() => {
    // Get all unique slots from both issuing and production to ensure full visibility
    const slots = new Set<string>();
    productionRecords.forEach(r => {
      if (r.machineType !== MachineType.PRINTING) {
        slots.add(`${r.date}|${r.shift}|${r.machineType}`);
      }
    });
    issuingRecords.forEach(r => {
      if (r.machineType !== MachineType.PRINTING) {
        slots.add(`${r.date}|${r.shift}|${r.machineType}`);
      }
    });

    return Array.from(slots).map(slot => {
      const [date, shift, machineType] = slot.split('|');
      
      const matchingIssuances = issuingRecords.filter(iss => 
        iss.date === date && 
        iss.shift === shift && 
        iss.machineType === machineType
      );
      
      const prod = productionRecords.find(p => 
        p.date === date && 
        p.shift === shift && 
        p.machineType === machineType
      );
      
      const totalInputKg = matchingIssuances.reduce((sum, iss) => sum + (iss.totalInputKg || 0), 0);
      const expected = matchingIssuances.reduce((sum, iss) => sum + (iss.totalIssuedKg || 0), 0);
      const expectedCount = machineType === MachineType.CUTTING ? expected * 84.5 : undefined;
      const actual = prod ? prod.actualOutputKg : 0;
      const difference = actual - expected;
      
      const toleranceThreshold = expected * 0.98;
      const status = !prod ? 'PENDING' : (actual >= toleranceThreshold ? 'PASS' : 'UNDER');

      // Aggregate material breakdown
      const materialBreakdown = matchingIssuances.reduce((acc, iss) => {
        if (iss.materialBags) {
          Object.entries(iss.materialBags).forEach(([grade, qty]) => {
            acc[grade as MaterialGrade] = (acc[grade as MaterialGrade] || 0) + (qty as number);
          });
        }
        return acc;
      }, {} as Record<string, number>);

      const totalRollsIssued = matchingIssuances.reduce((sum, iss) => sum + (iss.rollsIssued || 0), 0);

      return {
        id: slot,
        date,
        shift,
        machineType,
        totalInputKg,
        expected,
        expectedCount,
        actual,
        actualCount: prod?.actualCount,
        difference,
        status,
        materialBreakdown: Object.keys(materialBreakdown).length > 0 ? materialBreakdown : undefined,
        rollsIssued: totalRollsIssued
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [issuingRecords, productionRecords]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#003366] tracking-tighter uppercase">Warehouse Control</h2>
            <p className="text-slate-500 font-medium italic">Advanced Yield & Batch Management</p>
          </div>
          <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner overflow-x-auto max-w-full no-scrollbar">
            {(['issuing', 'production', 'comparison', 'materials', 'spare-parts', 'spare-issuing'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveSubTab(tab)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-[1.5rem] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab ? 'bg-[#003366] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'materials' ? 'Raw Materials' : tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

      <div className="grid grid-cols-1 gap-10">
        {activeSubTab === 'materials' && (
          <div className="max-w-6xl mx-auto w-full space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.values(MaterialGrade).map(grade => (
                <div key={grade} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 group hover:border-[#4DB848] transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-16 h-16 bg-slate-50 text-[#003366] group-hover:bg-[#003366] group-hover:text-white rounded-2xl flex items-center justify-center transition-all">
                      <i className={`fa-solid ${grade === 'HD' ? 'fa-flask' : grade === 'LLD' ? 'fa-vial' : 'fa-atom'} text-3xl`}></i>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Reserve</p>
                       <p className="text-4xl font-black text-[#003366]">{materialStock[grade] || 0} <span className="text-sm">{grade === 'IPA' || grade === 'TULANE' ? 'Drums' : 'Bags'}</span></p>
                       <p className="text-lg font-black text-[#4DB848]">{(materialStock[grade] || 0) * (grade === 'IPA' || grade === 'TULANE' ? 165 : 25)} <span className="text-xs">KG</span></p>
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">{grade} Material Grade</h4>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto w-full bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
               <div className="bg-[#4DB848] p-6 md:p-10 text-[#003366]">
                 <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Inventory Inbound</h3>
                 <p className="text-[#003366]/60 text-[10px] font-black tracking-widest uppercase mt-2">Log New Raw Material Shipments</p>
               </div>
               <form onSubmit={handleStockAddSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Material Grade</label>
                      <select required className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={stockAddForm.grade} onChange={e => setStockAddForm({...stockAddForm, grade: e.target.value as MaterialGrade})}>
                        {Object.values(MaterialGrade).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        {stockAddForm.grade === 'IPA' || stockAddForm.grade === 'TULANE' ? 'Shipment Drums' : 'Shipment Bags'}
                      </label>
                      <input type="number" required step="0.01" min="0.01" className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366] text-lg md:text-xl" value={stockAddForm.bags || ''} onChange={e => setStockAddForm({...stockAddForm, bags: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Inbound Date</label>
                      <input type="date" required className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={stockAddForm.date} onChange={e => setStockAddForm({...stockAddForm, date: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#003366] text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl hover:bg-[#002855] transition-all uppercase tracking-widest">Update Master Stock</button>
               </form>
            </div>
          </div>
        )}

        {activeSubTab === 'issuing' && (
          <div className="max-w-5xl mx-auto w-full space-y-8">
            <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-[#003366] p-12 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <i className="fa-solid fa-boxes-packing text-7xl"></i>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Operational Issuance</h3>
                <p className="text-[#4DB848] text-[10px] font-black tracking-widest uppercase mt-2">Yield Conversion Framework Active</p>
              </div>
              <form onSubmit={handleIssuingSubmit} className="p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Machine Process</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={issuingForm.machineType} onChange={e => setIssuingForm({...issuingForm, machineType: e.target.value as MachineType})}>
                      {Object.values(MachineType).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Date</label>
                      <input type="date" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={issuingForm.date} onChange={e => setIssuingForm({...issuingForm, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shift Window</label>
                      <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={issuingForm.shift} onChange={e => setIssuingForm({...issuingForm, shift: e.target.value as Shift})}>
                        {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {usesMaterials ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {Object.values(MaterialGrade).filter(grade => {
                        if (isExtrusion) return [MaterialGrade.HD, MaterialGrade.LLD, MaterialGrade.EXCEED].includes(grade);
                        if (isPrinting) return [MaterialGrade.IPA, MaterialGrade.TULANE].includes(grade);
                        return false;
                      }).map(grade => (
                        <div key={grade} className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 group hover:border-[#4DB848]/30 transition-all">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-200">{grade} Grade</span>
                            <i className={`fa-solid ${grade === 'IPA' ? 'fa-droplet' : grade === 'TULANE' ? 'fa-paint-roller' : 'fa-flask'} text-slate-200 text-2xl group-hover:text-[#4DB848] transition-colors`}></i>
                          </div>
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              placeholder="0.00" 
                              className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#4DB848] outline-none font-black text-3xl text-[#003366]" 
                              value={
                                grade === MaterialGrade.HD ? issuingForm.hdBags : 
                                grade === MaterialGrade.LLD ? issuingForm.lldBags : 
                                grade === MaterialGrade.EXCEED ? issuingForm.exceedBags :
                                grade === MaterialGrade.IPA ? issuingForm.ipaBags :
                                issuingForm.tulaneBags || ''
                              } 
                              onChange={e => {
                                const val = Math.max(0, Number(e.target.value));
                                if (grade === MaterialGrade.HD) setIssuingForm({...issuingForm, hdBags: val});
                                else if (grade === MaterialGrade.LLD) setIssuingForm({...issuingForm, lldBags: val});
                                else if (grade === MaterialGrade.EXCEED) setIssuingForm({...issuingForm, exceedBags: val});
                                else if (grade === MaterialGrade.IPA) setIssuingForm({...issuingForm, ipaBags: val});
                                else setIssuingForm({...issuingForm, tulaneBags: val});
                              }} 
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                              {grade === 'IPA' || grade === 'TULANE' ? 'Drums' : 'Bags'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isPrinting && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Conversion Factor</label>
                          <input 
                            type="number" 
                            step="0.0001" 
                            disabled={isExtrusion}
                            className={`w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366] ${isExtrusion ? 'opacity-50 cursor-not-allowed' : ''}`} 
                            value={currentFactor} 
                            onChange={e => setIssuingForm({...issuingForm, conversionFactor: Number(e.target.value)})} 
                          />
                          {isExtrusion && <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Fixed for extrusion process</p>}
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Est. Waste (%)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" 
                            value={issuingForm.wastePercent} 
                            onChange={e => setIssuingForm({...issuingForm, wastePercent: Number(e.target.value)})} 
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 group hover:border-[#4DB848]/30 transition-all">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Number of Rolls Issued</label>
                      <div className="relative">
                         <input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="0.00" 
                            className="w-full px-8 py-5 bg-white border-2 border-slate-200 rounded-3xl focus:border-[#4DB848] outline-none font-black text-4xl text-[#003366]" 
                            value={issuingForm.rolls || ''} 
                            onChange={e => setIssuingForm({...issuingForm, rolls: Math.max(0, Number(e.target.value))})} 
                         />
                         <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 uppercase">Rolls</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 group hover:border-[#4DB848]/30 transition-all">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Weight Issued (KG)</label>
                      <div className="relative">
                         <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="0.00" 
                            className="w-full px-8 py-5 bg-white border-2 border-slate-200 rounded-3xl focus:border-[#003366] focus:outline-none text-2xl font-black text-[#4DB848]" 
                            value={issuingForm.weight || ''} 
                            onChange={e => setIssuingForm({...issuingForm, weight: Math.max(0, Number(e.target.value))})} 
                         />
                         <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 uppercase">KG</span>
                      </div>
                    </div>
                  </div>
                )}

                {usesMaterials && !isPrinting && (
                  <div className="bg-[#003366] p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <i className="fa-solid fa-square-root-variable text-9xl"></i>
                    </div>
                    <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#4DB848]">Yield Calculation Protocol</h4>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Expected = Input * Factor * (1 - Waste%)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Theoretical Input</p>
                          <p className="text-3xl font-black">{totalInputWeight.toFixed(1)} <span className="text-xs">KG</span></p>
                        </div>
                        <div className="flex items-center justify-center">
                          <i className="fa-solid fa-calculator text-2xl text-[#4DB848]"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Target Net Yield</p>
                          <p className="text-3xl font-black text-[#4DB848]">{calculatedIssuingKg.toFixed(2)} <span className="text-xs text-white">KG</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-[#4DB848] text-[#003366] py-8 rounded-[2.5rem] font-black text-2xl hover:bg-[#45a641] transition-all shadow-xl shadow-green-900/10 uppercase tracking-widest relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Finalize Operational Batch
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSubTab === 'production' && (
          <div className="max-w-2xl mx-auto w-full bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#4DB848] p-8 md:p-12 text-[#003366] relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fa-solid fa-industry text-7xl"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Production Output Intake</h3>
              <p className="text-[#003366]/60 text-[9px] md:text-[10px] font-black tracking-widest uppercase mt-2 italic">
                <i className="fa-solid fa-circle-info mr-1"></i>
                Audit Only: This form logs production for efficiency comparison and does not update inventory.
              </p>
            </div>
            <form onSubmit={handleProductionSubmit} className="p-8 md:p-12 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cycle Date</label>
                  <input type="date" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={productionForm.date} onChange={(e) => setProductionForm({...productionForm, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cycle Shift</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={productionForm.shift} onChange={e => setProductionForm({...productionForm, shift: e.target.value as Shift})}>
                    {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Machine Type</label>
                <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={productionForm.machineType} onChange={e => setProductionForm({...productionForm, machineType: e.target.value as MachineType})}>
                  {Object.values(MachineType).filter(m => m !== MachineType.PRINTING).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Final Yield Weight (KG)</label>
                  <input type="number" step="0.01" required placeholder="0.00" className="w-full px-8 py-5 bg-white/10 border-2 border-white/10 rounded-3xl focus:border-[#4DB848] outline-none font-black text-4xl text-white" value={productionForm.actualOutputKg || ''} onChange={e => setProductionForm({...productionForm, actualOutputKg: Number(e.target.value)})} />
                </div>
                <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    {productionForm.machineType === MachineType.CUTTING ? 'Number of Bags (#)' : 'Roll/Unit Count'}
                  </label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    placeholder="0" 
                    className="w-full px-8 py-5 bg-white/10 border-2 border-white/10 rounded-3xl focus:border-[#4DB848] outline-none font-black text-4xl text-white" 
                    value={productionForm.actualCount || ''} 
                    onChange={e => setProductionForm({...productionForm, actualCount: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rolls Used (Input)</label>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-2xl text-[#003366]" value={productionForm.rollsUsed || ''} onChange={e => setProductionForm({...productionForm, rollsUsed: Number(e.target.value)})} />
                </div>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Weight Used (KG Input)</label>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-2xl text-[#003366]" value={productionForm.kgUsed || ''} onChange={e => setProductionForm({...productionForm, kgUsed: Number(e.target.value)})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#003366] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#002855] transition-all shadow-xl uppercase tracking-widest flex items-center justify-center">
                <i className="fa-solid fa-file-contract mr-3"></i>
                Authorize Audit Entry
              </button>
            </form>
          </div>
        )}

        {activeSubTab === 'comparison' && (
          <div className="bg-white rounded-[4rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-[#003366] p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Efficiency Audit Ledger</h3>
                <p className="text-[#4DB848] text-[10px] font-black uppercase tracking-widest mt-2">Variance tracking: Expected vs. Actual Yield (2% Tolerance Applied)</p>
              </div>
              <div className="flex space-x-6">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-[#4DB848] uppercase tracking-widest">Efficiency Passes</p>
                    <p className="text-2xl font-black text-white">{comparisonData.filter(d => d.status === 'PASS').length}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Shortfall Occurrences</p>
                    <p className="text-2xl font-black text-white">{comparisonData.filter(d => d.status === 'UNDER').length}</p>
                 </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-10 py-6 text-left">Timeline / Shift</th>
                    <th className="px-6 py-6 text-left">Machine</th>
                    <th className="px-6 py-6 text-left">Input (KG)</th>
                    <th className="px-6 py-6 text-right">Expected (KG)</th>
                    <th className="px-6 py-6 text-right">Actual (KG)</th>
                    <th className="px-6 py-6 text-right">Variance</th>
                    <th className="px-10 py-6 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonData.length > 0 ? comparisonData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6">
                        <p className="font-black text-[#003366] text-sm">{item.date}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{item.shift}</p>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[10px] font-black px-4 py-1.5 bg-[#003366]/5 text-[#003366] rounded-full uppercase tracking-tighter border border-[#003366]/10">
                          {item.machineType}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          {item.totalInputKg > 0 ? (
                            <p className="text-sm font-black text-[#003366]">{item.totalInputKg.toFixed(1)} <span className="text-[10px] text-slate-400">KG</span></p>
                          ) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase italic tracking-widest">Pending</span>
                          )}
                          
                          {item.materialBreakdown && (
                            <div className="flex flex-wrap gap-1">
                               {Object.entries(item.materialBreakdown).map(([grade, qty]) => (
                                 (qty as number) > 0 && (
                                   <span key={grade} className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${
                                     grade === 'IPA' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                     grade === 'TULANE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                     'bg-slate-50 text-slate-500 border-slate-100'
                                   }`}>
                                     {grade}: {qty}
                                   </span>
                                 )
                               ))}
                            </div>
                          )}
                          {item.rollsIssued > 0 && (
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{item.rollsIssued} Rolls</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-500 text-sm">
                        {item.expected.toFixed(1)}
                        {item.expectedCount ? (
                          <p className="text-[9px] font-bold text-slate-400">
                            {Math.round(item.expectedCount).toLocaleString()} Bags
                          </p>
                        ) : null}
                      </td>
                      <td className={`px-6 py-6 text-right font-black text-lg ${item.status === 'PASS' ? 'text-[#4DB848]' : item.status === 'PENDING' ? 'text-slate-300' : 'text-orange-500'}`}>
                        {item.actual > 0 ? item.actual.toFixed(2) : '0.00'}
                        {item.actualCount ? (
                          <p className="text-[9px] font-bold text-slate-300">
                            {item.actualCount} {item.machineType === MachineType.CUTTING ? 'Bags' : 'Rolls'}
                          </p>
                        ) : null}
                      </td>
                      <td className={`px-6 py-6 text-right font-mono font-black text-sm ${item.status === 'PENDING' ? 'text-slate-200' : (item.difference >= 0 ? 'text-[#4DB848]' : 'text-orange-500')}`}>
                        {item.status === 'PENDING' ? '--' : `${item.difference >= 0 ? '+' : ''}${item.difference.toFixed(2)}`}
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          item.status === 'PASS' ? 'bg-[#4DB848] text-[#003366]' : 
                          item.status === 'PENDING' ? 'bg-slate-100 text-slate-400' : 
                          'bg-orange-500 text-white'
                        }`}>
                          {item.status === 'PASS' ? 'OPTIMAL' : item.status === 'PENDING' ? 'WAITING' : 'SHORTFALL'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center text-slate-200 font-black uppercase tracking-[0.3em] italic">
                        Lifecycle logs unavailable
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSubTab === 'spare-parts' && (
          <div className="max-w-6xl mx-auto w-full space-y-10">
            <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-[#003366] p-10 text-white relative">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Spare Parts Inventory</h3>
                <p className="text-[#4DB848] text-[10px] font-black tracking-widest uppercase mt-2">Maintenance & Component Tracking</p>
              </div>
              <div className="p-10">
                <form onSubmit={handleSparePartSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Part Name</label>
                    <input type="text" required className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={sparePartForm.name} onChange={e => setSparePartForm({...sparePartForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                    <input type="number" required min="0" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={sparePartForm.quantity || ''} onChange={e => setSparePartForm({...sparePartForm, quantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value (USD)</label>
                    <input type="number" required min="0" step="0.01" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={sparePartForm.value || ''} onChange={e => setSparePartForm({...sparePartForm, value: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Machine Process</label>
                    <select className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={sparePartForm.machineType} onChange={e => setSparePartForm({...sparePartForm, machineType: e.target.value as MachineType})}>
                      {Object.values(MachineType).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <button type="submit" className="w-full bg-[#4DB848] text-[#003366] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#45a641] transition-all">Add to Spare Inventory</button>
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4 text-left">Part Name</th>
                        <th className="px-6 py-4 text-left">Associated Machine</th>
                        <th className="px-6 py-4 text-right">Stock Level</th>
                        <th className="px-6 py-4 text-right">Unit Value</th>
                        <th className="px-6 py-4 text-right">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {spareParts.map(part => (
                        <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 font-black text-[#003366]">{part.name}</td>
                          <td className="px-6 py-5">
                            <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase">{part.machineType}</span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-[#003366]">{part.quantity}</td>
                          <td className="px-6 py-5 text-right font-black text-slate-400">${part.value.toFixed(2)}</td>
                          <td className="px-6 py-5 text-right font-black text-[#4DB848]">${(part.quantity * part.value).toFixed(2)}</td>
                        </tr>
                      ))}
                      {spareParts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-300 font-black uppercase tracking-widest italic">No spare parts recorded</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'spare-issuing' && (
          <div className="max-w-4xl mx-auto w-full space-y-10">
            <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-[#003366] p-12 text-white relative">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Spare Issuance Form</h3>
                <p className="text-[#4DB848] text-[10px] font-black tracking-widest uppercase mt-2">Record Component Deployment to Production</p>
              </div>
              <form onSubmit={handleSpareIssuanceSubmit} className="p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Spare Part</label>
                    <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={spareIssuanceForm.partId} onChange={e => setSpareIssuanceForm({...spareIssuanceForm, partId: e.target.value})}>
                      <option value="">Choose a part...</option>
                      {spareParts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.quantity} available)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quantity to Issue</label>
                    <input type="number" required min="1" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={spareIssuanceForm.quantity || ''} onChange={e => setSpareIssuanceForm({...spareIssuanceForm, quantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Issued To (Technician/Machine)</label>
                    <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={spareIssuanceForm.issuedTo} onChange={e => setSpareIssuanceForm({...spareIssuanceForm, issuedTo: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Issuance Date</label>
                    <input type="date" required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366]" value={spareIssuanceForm.date} onChange={e => setSpareIssuanceForm({...spareIssuanceForm, date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Maintenance Notes</label>
                  <textarea className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4DB848] outline-none font-black text-[#003366] h-32" value={spareIssuanceForm.notes} onChange={e => setSpareIssuanceForm({...spareIssuanceForm, notes: e.target.value})} placeholder="Describe the reason for replacement or machine issue..."></textarea>
                </div>
                <button type="submit" className="w-full bg-[#003366] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#002855] transition-all uppercase tracking-widest">Finalize Spare Issuance</button>
              </form>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
               <div className="bg-slate-50 p-6 border-b border-slate-100">
                  <h4 className="text-xs font-black text-[#003366] uppercase tracking-widest">Recent Spare Issuance History</h4>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Part Name</th>
                        <th className="px-6 py-4 text-left">Issued To</th>
                        <th className="px-6 py-4 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sparePartIssuances.map(iss => {
                        const part = spareParts.find(p => p.id === iss.partId);
                        return (
                          <tr key={iss.id} className="text-[11px]">
                            <td className="px-6 py-4 font-bold text-slate-500">{iss.date}</td>
                            <td className="px-6 py-4 font-black text-[#003366]">{part?.name || 'Unknown Part'}</td>
                            <td className="px-6 py-4 font-bold text-slate-600">{iss.issuedTo}</td>
                            <td className="px-6 py-4 text-right font-black text-[#4DB848]">{iss.quantity}</td>
                          </tr>
                        );
                      })}
                      {sparePartIssuances.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-200 font-black uppercase italic">No issuance history</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseSystem;
