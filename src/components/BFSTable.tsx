import React from 'react';
import { BFSStep } from '../types/algorithms';

interface BFSTableProps {
  steps: BFSStep[];
  currentStepIndex?: number;
}

export const BFSTable: React.FC<BFSTableProps> = ({ steps, currentStepIndex = 0 }) => {
  if (steps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-center">
        <h4 className="text-xs font-bold text-emerald-400 mb-1">BFS Step Table</h4>
        <div className="text-slate-500 text-xs">Run BFS to inspect level-by-level queue operations.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-emerald-400">BFS Step-by-Step Execution Table</h4>
        <span className="text-[10px] text-slate-400 font-mono">
          Step {currentStepIndex} of {steps.length - 1}
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800 text-slate-300 sticky top-0 text-[11px] font-semibold border-b border-slate-700">
            <tr>
              <th className="py-1 px-2">Step</th>
              <th className="py-1 px-2">Level</th>
              <th className="py-1 px-2">Current Vertex</th>
              <th className="py-1 px-2">Queue (FIFO)</th>
              <th className="py-1 px-2">Visited Set</th>
              <th className="py-1 px-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
            {steps.map((st, idx) => (
              <tr
                key={st.step}
                className={`transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-blue-950/70 border-l-4 border-blue-500 font-semibold'
                    : idx % 2 === 0
                    ? 'bg-slate-900/40'
                    : 'bg-slate-900/80'
                }`}
              >
                <td className="py-1 px-2 text-slate-400">{st.step}</td>
                <td className="py-1 px-2 text-amber-400">{st.level}</td>
                <td className="py-1 px-2 text-cyan-300 font-bold">{st.currentNode || '—'}</td>
                <td className="py-1 px-2">
                  {st.queue.length === 0 ? (
                    <span className="text-slate-600 font-sans italic">[]</span>
                  ) : (
                    <span className="text-blue-300 font-bold">[{st.queue.join(', ')}]</span>
                  )}
                </td>
                <td className="py-1 px-2 text-emerald-400">[{st.visited.join(', ')}]</td>
                <td className="py-1 px-2 font-sans text-slate-300 text-[10px]">{st.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BFSTable;
