import React from 'react';
import { HeapItem, BFSStep, DFSStep } from '../types/algorithms';

interface DataStructureViewProps {
  adjacencyList: Map<string, Array<{ target: string; amount: number }>>;
  currentQueue: string[];
  currentStack: string[];
  riskScores: Map<string, number>;
  maxHeapArray: HeapItem[];
  topRiskyAccounts: HeapItem[];
  bfsActiveStep?: BFSStep;
  dfsActiveStep?: DFSStep;
}

export const DataStructureView: React.FC<DataStructureViewProps> = ({
  adjacencyList,
  currentQueue,
  currentStack,
  riskScores,
  maxHeapArray,
  topRiskyAccounts,
  bfsActiveStep,
  dfsActiveStep
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Adjacency List */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <span>📑</span> Directed Adjacency List
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
            {adjacencyList.size} Vertices
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mb-2">
          Directed vertex mapping: <code className="text-slate-300 font-mono">V → [(Target, Amount)]</code>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-lg p-2 bg-slate-950/70 scrollbar-thin scrollbar-thumb-slate-700">
          {adjacencyList.size === 0 ? (
            <div className="text-slate-500 text-xs italic text-center py-2">No vertices in graph</div>
          ) : (
            Array.from(adjacencyList.entries()).map(([node, neighbors]) => (
              <div key={node} className="flex items-start gap-2 bg-slate-900/80 p-1.5 rounded border border-slate-800/80 text-xs font-mono">
                <span className="text-emerald-400 font-bold min-w-[32px]">{node}</span>
                <span className="text-slate-500">→</span>
                <div className="flex-1 flex flex-wrap gap-1">
                  {neighbors.length === 0 ? (
                    <span className="text-slate-600 text-[11px]">∅ (no outgoing edges)</span>
                  ) : (
                    neighbors.map((nbr, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-amber-300"
                      >
                        {nbr.target} (₹{nbr.amount.toLocaleString()})
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. BFS Queue Data Structure */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
            <span>📥</span> Queue (FIFO) — BFS Runtime State
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 font-mono">
            Size: {currentQueue.length}
          </span>
        </div>

        {bfsActiveStep && (
          <div className="text-[11px] bg-slate-950/80 border border-slate-800 rounded p-1.5 mb-2 text-slate-300">
            <span className="text-blue-400 font-semibold font-mono">Step #{bfsActiveStep.step}:</span>{' '}
            {bfsActiveStep.description}
          </div>
        )}

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
            <span>← Dequeue Front</span>
            <span>Enqueue Rear →</span>
          </div>

          {currentQueue.length === 0 ? (
            <div className="text-slate-500 text-xs italic text-center py-2">
              Queue is currently empty (Run or Step through BFS to observe FIFO enqueuing)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {currentQueue.map((item, idx) => (
                <div
                  key={idx}
                  className={`px-2.5 py-1 rounded font-mono text-xs flex flex-col items-center border ${
                    idx === 0
                      ? 'bg-blue-900/80 border-blue-500 text-blue-200 shadow-md shadow-blue-950'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-[9px] text-slate-400">{idx === 0 ? 'FRONT' : `[${idx}]`}</span>
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. DFS Stack Data Structure */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
            <span>📚</span> Stack (LIFO) — DFS Runtime State
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">
            Size: {currentStack.length}
          </span>
        </div>

        {dfsActiveStep && (
          <div className="text-[11px] bg-slate-950/80 border border-slate-800 rounded p-1.5 mb-2 text-slate-300">
            <span className="text-purple-400 font-semibold font-mono">Step #{dfsActiveStep.step}:</span>{' '}
            {dfsActiveStep.description}
          </div>
        )}

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
            <span>Top of Stack (Next to Pop) ↓</span>
            <span>Bottom ↑</span>
          </div>

          {currentStack.length === 0 ? (
            <div className="text-slate-500 text-xs italic text-center py-2">
              Stack is currently empty (Run or Step through DFS to observe LIFO pushing)
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 py-1">
              {[...currentStack].reverse().map((item, idx) => (
                <div
                  key={idx}
                  className={`px-2.5 py-1 rounded font-mono text-xs flex flex-col items-center border ${
                    idx === 0
                      ? 'bg-purple-900/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-[9px] text-slate-400">{idx === 0 ? 'TOP' : `[${currentStack.length - 1 - idx}]`}</span>
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Risk Scores (Hash Map) */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <span>🗺️</span> Risk Score Hash Map
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono">
            {riskScores.size} Entries
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mb-2 font-mono">
          Formula: (OutDegree × 2) + (ClusterSize × 3) + (OutAmount / 1000)
        </div>

        <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 border border-slate-800 rounded-lg p-2 bg-slate-950/70 scrollbar-thin scrollbar-thumb-slate-700">
          {Array.from(riskScores.entries()).map(([node, score]) => (
            <div
              key={node}
              className={`p-1.5 rounded border text-xs font-mono flex items-center justify-between ${
                score >= 25
                  ? 'bg-red-950/40 border-red-700/60 text-red-300'
                  : score >= 12
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-bold">{node}</span>
              <span className="font-semibold">{score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Max Heap Structure & Top Riskiest Accounts */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <span>👑</span> Max-Heap Priority Queue
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-mono">
            Heap Size: {maxHeapArray.length}
          </span>
        </div>

        {/* Top 5 extracted accounts */}
        <div className="space-y-1 mb-3">
          <div className="text-[11px] font-semibold text-slate-300">Top 5 Riskiest Accounts (Extracted from Max-Heap):</div>
          <div className="space-y-1 border border-slate-800 rounded-lg p-2 bg-slate-950/70">
            {topRiskyAccounts.length === 0 ? (
              <div className="text-slate-500 text-xs italic text-center py-1">No accounts evaluated</div>
            ) : (
              topRiskyAccounts.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded text-xs border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-400 font-bold text-[11px]">#{idx + 1}</span>
                    <span className="font-mono text-slate-200 font-bold">Account {item.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{item.outDegree} out-txs</span>
                    <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700 text-[11px]">
                      {item.score.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Heap Array Invariant Display */}
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400">
            Binary Heap Array Layout (<code className="text-slate-300">parent[i] ≥ children[2i+1, 2i+2]</code>):
          </div>
          <div className="flex flex-wrap gap-1 p-2 bg-slate-950/90 border border-slate-800 rounded-lg max-h-24 overflow-y-auto">
            {maxHeapArray.map((item, i) => (
              <span
                key={item.id}
                className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-slate-300"
                title={`Index ${i}: Account ${item.id} (Score: ${item.score})`}
              >
                [{i}]:<strong className="text-emerald-400">{item.id}</strong>({item.score.toFixed(1)})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStructureView;
