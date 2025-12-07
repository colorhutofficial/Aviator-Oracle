import React from 'react';
import { HistoryItem } from '../types';
import { History, TrendingUp, AlertOctagon, ArrowUpRight } from 'lucide-react';

interface PredictionHistoryProps {
  history: HistoryItem[];
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ history }) => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px] border border-slate-700/50">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/30">
        <h3 className="font-bold text-white flex items-center gap-2 font-display">
          <History className="w-4 h-4 text-indigo-400" />
          Round History
        </h3>
        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
            LATEST 50
        </span>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10 font-semibold tracking-wider">
            <tr>
              <th className="px-5 py-3 font-medium">Round ID</th>
              <th className="px-5 py-3 font-medium">Prediction</th>
              <th className="px-5 py-3 font-medium text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.length === 0 ? (
                <tr>
                    <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-600">
                            <History className="w-8 h-8 opacity-20" />
                            <span className="text-xs font-medium">No Data Available</span>
                        </div>
                    </td>
                </tr>
            ) : (
                history.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                        <span className="font-mono text-slate-400 text-xs">#{item.roundId}</span>
                    </td>
                    <td className="px-5 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${
                            item.prediction === 'BET' 
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                            {item.prediction === 'BET' ? 'PLAY' : item.prediction}
                        </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                        <div className={`inline-flex items-center justify-end gap-1.5 font-mono font-bold ${
                            item.actual === 'CRASH' 
                            ? 'text-red-400' 
                            : 'text-emerald-400'
                        }`}>
                            {item.actual}
                            {item.actual === 'CRASH' ? (
                                <AlertOctagon className="w-3 h-3 opacity-50" />
                            ) : (
                                <ArrowUpRight className="w-3 h-3 opacity-50" />
                            )}
                        </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionHistory;