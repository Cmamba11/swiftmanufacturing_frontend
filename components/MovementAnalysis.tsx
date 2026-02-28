
import React, { useState, useEffect } from 'react';
import { Product, Transaction } from '../types';
import { analyzeMovement } from '../services/geminiService';

interface MovementAnalysisProps {
  products: Product[];
  transactions: Transaction[];
}

const MovementAnalysis: React.FC<MovementAnalysisProps> = ({ products, transactions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const performAnalysis = async () => {
    setLoading(true);
    const result = await analyzeMovement(products, transactions);
    setAnalysis(result);
    setLoading(false);
  };

  useEffect(() => {
    if (products.length > 0 && !analysis) {
      performAnalysis();
    }
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-4xl font-black text-[#003366] tracking-tighter uppercase">Logistics AI</h2>
          <p className="text-slate-500 font-medium italic">Predictive Intelligence & Velocity Optimization.</p>
        </div>
        <button 
          onClick={performAnalysis}
          disabled={loading}
          className="bg-[#4DB848] text-[#003366] px-8 py-5 rounded-[2.5rem] font-black hover:bg-[#45a641] transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-green-900/10 uppercase tracking-widest text-xs"
        >
          {loading ? (
            <i className="fa-solid fa-circle-notch fa-spin mr-3"></i>
          ) : (
            <i className="fa-solid fa-brain mr-3"></i>
          )}
          Trigger Recalculation
        </button>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] p-12">
            <div className="relative w-40 h-40 mb-10">
              <div className="absolute inset-0 border-[6px] border-slate-50 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-[#003366] rounded-full border-t-[#4DB848] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <i className="fa-solid fa-microchip text-4xl text-[#003366] animate-pulse"></i>
              </div>
            </div>
            <h3 className="text-3xl font-black text-[#003366] tracking-tighter uppercase">Processing Ledger Matrix...</h3>
            <p className="text-slate-400 max-w-sm text-center mt-4 font-bold uppercase text-[10px] tracking-widest opacity-60">
              Scanning dispatch history and stock variance for anomalies
            </p>
          </div>
        ) : analysis ? (
          <div className="p-12 prose prose-slate max-w-none">
             <div className="bg-[#003366] p-10 rounded-[3rem] border-l-[16px] border-[#4DB848] mb-12 flex items-start shadow-2xl shadow-blue-900/10">
               <div className="w-12 h-12 bg-[#4DB848] text-[#003366] rounded-2xl flex items-center justify-center mr-8 flex-shrink-0 mt-1">
                  <i className="fa-solid fa-bolt text-2xl"></i>
               </div>
               <div>
                 <h4 className="text-white font-black text-2xl mb-3 uppercase tracking-tight">Intelligence Briefing</h4>
                 <p className="text-white/60 text-sm leading-relaxed font-bold tracking-tight">
                   The following insights are derived from current inventory snapshots and historical movement velocity.
                 </p>
               </div>
             </div>
             
             <div className="space-y-8 whitespace-pre-wrap text-[#003366] leading-relaxed font-bold text-lg px-4">
               {analysis}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10 text-slate-200">
              <i className="fa-solid fa-robot text-5xl"></i>
            </div>
            <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">AI Inference Node Offline</p>
            <button onClick={performAnalysis} className="mt-8 text-[#4DB848] font-black uppercase text-[10px] tracking-widest border-b-2 border-[#4DB848] pb-1">Wake Intelligence Engine</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-[#4DB848] transition-all">
          <div className="text-[#4DB848] mb-8 bg-[#4DB848]/10 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:bg-[#4DB848] group-hover:text-[#003366] transition-all">
            <i className="fa-solid fa-chart-line text-2xl"></i>
          </div>
          <h4 className="font-black text-[#003366] mb-4 uppercase tracking-tighter text-xl">Velocity Scan</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Real-time tracking of high-dispatch SKU patterns.</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-[#003366] transition-all">
          <div className="text-[#003366] mb-8 bg-[#003366]/5 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:bg-[#003366] group-hover:text-white transition-all">
            <i className="fa-solid fa-shield-halved text-2xl"></i>
          </div>
          <h4 className="font-black text-[#003366] mb-4 uppercase tracking-tighter text-xl">Loss Prevention</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Early identification of production yield shortfalls.</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-[#4DB848] transition-all">
          <div className="text-[#4DB848] mb-8 bg-[#4DB848]/10 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:bg-[#4DB848] group-hover:text-[#003366] transition-all">
            <i className="fa-solid fa-box-archive text-2xl"></i>
          </div>
          <h4 className="font-black text-[#003366] mb-4 uppercase tracking-tighter text-xl">Deadstock Audit</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Monitoring slow-moving capital tied in factory reserve.</p>
        </div>
      </div>
    </div>
  );
};

export default MovementAnalysis;
