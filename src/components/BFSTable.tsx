import React from 'react';

interface BFSStep {
  step: number;
  queue: string[];
  visited: string[];
  description: string;
}

interface BFSTableProps {
  steps: BFSStep[];
}

const BFSTable: React.FC<BFSTableProps> = ({ steps }) => {
  if (steps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">BFS Step Table</h3>
        <div className="text-slate-500 text-center py-4 text-sm">
          Run BFS to see step-by-step visualization
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <h3 className="text-lg font-bold mb-3 text-emerald-400">BFS Step Table</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="px-3 py-2 text-left text-emerald-400 font-semibold">Step</th>
              <th className="px-3 py-2 text-left text-emerald-400 font-semibold">Queue</th>
              <th className="px-3 py-2 text-left text-emerald-400 font-semibold">Visited</th>
              <th className="px-3 py-2 text-left text-emerald-400 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr 
                key={index} 
                className={`border-b border-slate-700 ${
                  step.description === 'End' ? 'bg-green-900/30' : 
                  step.description === 'Start' ? 'bg-blue-900/30' : 'bg-slate-800'
                }`}
              >
                <td className="px-3 py-2 text-slate-300 font-medium">
                  {step.description}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {step.queue.length === 0 ? (
                      <span className="text-slate-500 italic">[]</span>
                    ) : (
                      step.queue.map((node, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-amber-900 border border-amber-600 rounded text-amber-300 font-mono text-xs"
                        >
                          {node}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {step.visited.length === 0 ? (
                      <span className="text-slate-500 italic">∅</span>
                    ) : (
                      step.visited.map((node, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-emerald-900 border border-emerald-600 rounded text-emerald-300 font-mono text-xs"
                        >
                          {node}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {step.description === 'End' && (
                    <span className="px-2 py-1 bg-green-800 border border-green-600 rounded text-green-300 text-xs font-semibold">
                      ✅ Complete
                    </span>
                  )}
                  {step.description === 'Start' && (
                    <span className="px-2 py-1 bg-blue-800 border border-blue-600 rounded text-blue-300 text-xs font-semibold">
                      🚀 Start
                    </span>
                  )}
                  {step.description !== 'End' && step.description !== 'Start' && (
                    <span className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs">
                      🔄 Processing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {steps.length > 0 && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">
            <div className="mb-1 font-semibold text-emerald-400">Summary:</div>
            <div>• Total Steps: {steps.length}</div>
            <div>• Final Queue: {steps[steps.length - 1]?.queue.length === 0 ? 'Empty' : `[${steps[steps.length - 1]?.queue.join(', ')}]`}</div>
            <div>• All Visited: [{steps[steps.length - 1]?.visited.join(', ')}]</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BFSTable;
