import React, { useState } from 'react';
import { Calculator, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';

const BetCalculator: React.FC = () => {
  const [balance, setBalance] = useState<string>('');
  
  const numericBalance = parseFloat(balance);
  const recommendedBet = !isNaN(numericBalance) && numericBalance > 0 
    ? Math.floor(numericBalance / 20) 
    : 0;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden h-full">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Calculator className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-white font-display">Calculator</h2>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="group">
          <label className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2 group-focus-within:text-indigo-400 transition-colors">
            <Wallet className="w-3 h-3" />
            Wallet Balance
          </label>
          <div className="relative">
             <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-4 pr-12 py-3.5 rounded-xl glass-input text-white text-lg font-mono placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">USD</span>
          </div>
        </div>

        <div className="relative">
             <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-800 p-1 rounded-full border border-slate-700 z-20">
                 <ArrowRight className="w-3 h-3 text-slate-400 rotate-90" />
             </div>
             
             <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 rounded-xl border border-white/5 shadow-inner">
                <div className="text-slate-400 text-xs mb-2 flex items-center justify-between">
                    <span>Safe Bet (5%)</span>
                    <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">OPTIMAL</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-display">
                        {recommendedBet.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">USD</span>
                </div>
             </div>
        </div>
        
        {recommendedBet > 0 && recommendedBet < 10 && (
             <div className="flex gap-3 text-amber-400 text-xs bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 items-start">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Balance is critically low. High risk of total depletion. Recommended to skip rounds.</span>
             </div>
        )}
      </div>
    </div>
  );
};

export default BetCalculator;