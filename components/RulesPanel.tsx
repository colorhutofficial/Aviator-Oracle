import React from 'react';
import { Shield, DollarSign, Target, XCircle, Wind, AlertCircle, TrendingUp } from 'lucide-react';

const RulesPanel: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-4">
        <Shield className="text-orange-500 w-5 h-5" />
        <h2 className="text-lg font-bold text-white">Strategy Guidelines</h2>
      </div>
      
      <ul className="space-y-4 text-sm mb-6">
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-orange-500">
            <DollarSign className="w-4 h-4" />
          </div>
          <span>Minimum recommended deposit: <strong className="text-white">1000</strong></span>
        </li>
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span>Cash Out target: <strong className="text-white">2.00x</strong></span>
        </li>
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <span>Bet Amount: <strong className="text-white">Balance / 20</strong></span>
        </li>
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-red-400">
            <XCircle className="w-4 h-4" />
          </div>
          <span>Avoid multipliers after a loss. Reset.</span>
        </li>
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
            <Wind className="w-4 h-4" />
          </div>
          <span>Stay calm. Emotion leads to losses.</span>
        </li>
        <li className="flex gap-3 items-center text-slate-300">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-yellow-500">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span>Stop if you lose 3 rounds in a row.</span>
        </li>
      </ul>
    </div>
  );
};

export default RulesPanel;