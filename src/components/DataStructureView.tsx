import React from 'react';
import { AlgorithmState } from '../types/algorithms';

interface DataStructureViewProps {
  state: AlgorithmState;
  adjacencyList: Map<string, string[]>;
  bfsStepHistory?: Array<{
    step: number;
    queue: string[];
    visited: string[];
    description: string;
  }>;
}

const DataStructureView: React.FC<DataStructureViewProps> = ({ state, adjacencyList, bfsStepHistory = [] }) => {
  return (
    <div className="space-y-4">
      {/* Adjacency List */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">Adjacency List</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {Array.from(adjacencyList.entries()).map(([node, neighbors]) => (
            <div key={node} className="bg-slate-800 rounded-lg p-2">
              <span className="text-emerald-400 font-mono text-sm">{node}</span>
              <span className="text-slate-400"> → </span>
              <span className="text-amber-400 font-mono text-sm">
                [{neighbors.length > 0 ? neighbors.join(', ') : '∅'}]
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stack */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">Stack (DFS)</h3>
        <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {state.stack.length === 0 ? (
            <div className="text-slate-500 text-center py-2 text-sm">Empty Stack</div>
          ) : (
            [...state.stack].reverse().map((item, index) => (
              <div key={`${item}-${index}`} className="bg-slate-800 rounded-lg p-2 text-center">
                <span className="text-slate-400 text-xs mr-2">[{state.stack.length - 1 - index}]</span>
                <span className="text-emerald-400 font-mono text-sm">{item}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Queue - BFS Step Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">Queue (BFS)</h3>
        
        {bfsStepHistory.length > 0 ? (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-emerald-400 border-b border-slate-700 pb-2">
              <div>Step</div>
              <div>Queue</div>
              <div>Visited</div>
              <div>Status</div>
            </div>
            
            {/* Table Rows */}
            {bfsStepHistory.map((step, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-4 gap-2 text-xs p-2 rounded ${
                  step.description === 'End' ? 'bg-green-900/30 border border-green-700' : 
                  step.description === 'Start' ? 'bg-blue-900/30 border border-blue-700' : 'bg-slate-800 border border-slate-600'
                }`}
              >
                <div className="text-slate-300 font-medium">
                  {step.description}
                </div>
                <div>
                  {step.queue.length === 0 ? (
                    <span className="text-slate-500 italic">[]</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {step.queue.map((node, idx) => (
                        <span 
                          key={idx} 
                          className="px-1 py-0.5 bg-amber-900 border border-amber-600 rounded text-amber-300 font-mono"
                        >
                          {node}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {step.visited.length === 0 ? (
                    <span className="text-slate-500 italic">∅</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {step.visited.map((node, idx) => (
                        <span 
                          key={idx} 
                          className="px-1 py-0.5 bg-emerald-900 border border-emerald-600 rounded text-emerald-300 font-mono"
                        >
                          {node}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {step.description === 'End' && (
                    <span className="px-2 py-1 bg-green-800 border border-green-600 rounded text-green-300 font-semibold">
                      ✅ Complete
                    </span>
                  )}
                  {step.description === 'Start' && (
                    <span className="px-2 py-1 bg-blue-800 border border-blue-600 rounded text-blue-300 font-semibold">
                      🚀 Start
                    </span>
                  )}
                  {step.description !== 'End' && step.description !== 'Start' && (
                    <span className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-300">
                      🔄 Processing
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Summary */}
            <div className="mt-3 p-2 bg-slate-800 rounded text-xs text-slate-400">
              <div className="font-semibold text-emerald-400 mb-1">Summary:</div>
              <div>• Total Steps: {bfsStepHistory.length}</div>
              <div>• Final Queue: {bfsStepHistory[bfsStepHistory.length - 1]?.queue.length === 0 ? 'Empty' : `[${bfsStepHistory[bfsStepHistory.length - 1]?.queue.join(', ')}]`}</div>
              <div>• All Visited: [{bfsStepHistory[bfsStepHistory.length - 1]?.visited.join(', ')}]</div>
            </div>
          </div>
        ) : (
          /* Original Queue Display when no BFS history */
          <div className="space-y-2">
            <div className="text-xs text-slate-400 mb-2">
              Front → Back (FIFO Order)
            </div>
            <div className="flex flex-wrap gap-2">
              {state.queue.length === 0 ? (
                <div className="text-slate-500 text-center py-4 text-sm bg-slate-800 rounded-lg w-full">
                  🔄 Queue Empty - Run BFS to see step-by-step visualization
                </div>
              ) : (
                state.queue.map((item, index) => (
                  <div 
                    key={`${item}-${index}`} 
                    className={`rounded-lg p-2 text-center min-w-[60px] ${
                      index === 0 ? 'bg-red-900 border border-red-600' : 'bg-slate-800 border border-slate-600'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-1">
                      {index === 0 ? 'FRONT' : `[${index}]`}
                    </div>
                    <div className="text-amber-400 font-mono text-sm font-bold">
                      {item}
                    </div>
                  </div>
                ))
              )}
            </div>
            {state.queue.length > 0 && (
              <div className="text-xs text-emerald-400 mt-2 bg-slate-800 rounded p-2">
                Next to process: <span className="font-bold">{state.queue[0]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risk Scores Hash Map */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">Risk Scores (Hash Map)</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {Array.from(state.riskScores.entries()).map(([node, score]) => (
            <div key={node} className="bg-slate-800 rounded-lg p-2">
              <span className="text-emerald-400 font-mono text-sm">{node}</span>
              <span className="text-slate-400"> → </span>
              <span className="text-amber-400 font-mono text-sm font-bold">{score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Max Heap - Top Risky Accounts */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">Max Heap - Top 5 Risky Accounts</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {state.maxHeap.length === 0 ? (
            <div className="text-slate-500 text-center py-2 text-sm">No risk scores calculated</div>
          ) : (
            state.maxHeap.map((item, index) => (
              <div key={item.id} className="bg-slate-800 rounded-lg p-2 flex justify-between items-center">
                <span className="text-red-400 font-mono text-sm">#{index + 1} {item.id}</span>
                <span className="text-amber-400 font-mono text-sm font-bold">{item.score.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DataStructureView;
