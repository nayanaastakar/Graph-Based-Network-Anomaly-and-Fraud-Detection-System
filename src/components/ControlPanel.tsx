import React from 'react';
import { AlgorithmStatus, NodeData } from '../types/algorithms';

interface ControlPanelProps {
  nodes: NodeData[];
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;

  // Algorithm triggers
  onRunKosaraju: () => void;
  onRunBFS: () => void;
  onStepBFS: () => void;
  onPrevBFS: () => void;
  onResetBFS: () => void;

  onRunDFS: () => void;
  onStepDFS: () => void;
  onPrevDFS: () => void;
  onResetDFS: () => void;

  onRunAnomalies: () => void;
  onRunCombined: () => void;
  onResetAll: () => void;

  // Statuses
  kosarajuStatus: AlgorithmStatus;
  bfsStatus: AlgorithmStatus;
  dfsStatus: AlgorithmStatus;
  anomalyStatus: AlgorithmStatus;
  combinedStatus: AlgorithmStatus;

  // Playback state
  bfsStepIndex: number;
  bfsTotalSteps: number;
  isBfsPlaying: boolean;
  onTogglePlayBFS: () => void;

  dfsStepIndex: number;
  dfsTotalSteps: number;
  isDfsPlaying: boolean;
  onTogglePlayDFS: () => void;

  speedMs: number;
  onChangeSpeed: (ms: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  onRunKosaraju,
  onRunBFS,
  onStepBFS,
  onPrevBFS,
  onResetBFS,
  onRunDFS,
  onStepDFS,
  onPrevDFS,
  onResetDFS,
  onRunAnomalies,
  onRunCombined,
  onResetAll,
  kosarajuStatus,
  bfsStatus,
  dfsStatus,
  anomalyStatus,
  combinedStatus,
  bfsStepIndex,
  bfsTotalSteps,
  isBfsPlaying,
  onTogglePlayBFS,
  dfsStepIndex,
  dfsTotalSteps,
  isDfsPlaying,
  onTogglePlayDFS,
  speedMs,
  onChangeSpeed
}) => {
  const isAnyRunning =
    kosarajuStatus === 'Running' ||
    bfsStatus === 'Running' ||
    dfsStatus === 'Running' ||
    anomalyStatus === 'Running' ||
    combinedStatus === 'Running';

  const getStatusBadge = (status: AlgorithmStatus) => {
    switch (status) {
      case 'Running':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-blue-200 border border-blue-600 animate-pulse">RUNNING</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200 border border-emerald-600">COMPLETED</span>;
      case 'Paused':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900 text-amber-200 border border-amber-600">PAUSED</span>;
      case 'Ready':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900 text-cyan-200 border border-cyan-600">READY</span>;
      case 'Failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900 text-red-200 border border-red-600">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">NOT STARTED</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Node Selection Selector */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="text-blue-400">🎯</span> Target Account / Seed Node:
          </label>
          {selectedNode && (
            <button
              onClick={() => onSelectNode(null)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Clear Selection
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedNode || ''}
            onChange={(e) => onSelectNode(e.target.value || null)}
            disabled={isAnyRunning}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Click a node on graph or select here --</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                Account {n.id} (Out: {n.outDegree}, In: {n.inDegree}, Vol: ₹{n.totalAmount.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {selectedNode
            ? `Active seed account: ${selectedNode}. Ready for BFS/DFS exploration.`
            : 'Select an account to start level-by-level BFS or branch-first DFS traversal.'}
        </p>
      </div>

      {/* Animation Speed Controller */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-900/70 border border-slate-800 rounded-lg px-2.5 sm:px-3 py-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <span>⏱️</span> Step Delay:
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { label: 'Ultra (30ms)', val: 30 },
            { label: 'Fast (80ms)', val: 80 },
            { label: 'Medium (200ms)', val: 200 },
            { label: 'Slow (500ms)', val: 500 }
          ].map((s) => (
            <button
              key={s.val}
              type="button"
              onClick={() => onChangeSpeed(s.val)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                speedMs === s.val ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm Card 1: Kosaraju's SCC (Fraud Rings) */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-red-400">🔄</span> Kosaraju's SCC (Fraud Rings)
            </h4>
            <div className="text-[11px] text-slate-400">
              Two-pass DFS algorithm to detect closed cycles and money laundering loops
            </div>
          </div>
          <div>{getStatusBadge(kosarajuStatus)}</div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] font-mono text-amber-400">Time: O(V + E) • Space: O(V + E)</div>
          <button
            type="button"
            onClick={onRunKosaraju}
            disabled={isAnyRunning || nodes.length === 0}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <span>▶ Detect Fraud Rings</span>
          </button>
        </div>
      </div>

      {/* Algorithm Card 2: Breadth-First Search (BFS) */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-blue-400">🌊</span> Breadth-First Search (BFS)
            </h4>
            <div className="text-[11px] text-slate-400">
              Level-by-level queue traversal tracing fund dispersal from seed account
            </div>
          </div>
          <div>{getStatusBadge(bfsStatus)}</div>
        </div>

        {/* Step controls for BFS */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Step: {bfsStepIndex} / {Math.max(0, bfsTotalSteps - 1)}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={onPrevBFS}
                disabled={bfsStepIndex <= 0 || isBfsPlaying}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs"
                title="Previous step"
              >
                ⏮ Prev
              </button>
              <button
                type="button"
                onClick={onTogglePlayBFS}
                disabled={!selectedNode}
                className={`px-3 py-0.5 rounded text-xs font-semibold text-white transition-colors ${
                  isBfsPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isBfsPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                type="button"
                onClick={onStepBFS}
                disabled={bfsStepIndex >= bfsTotalSteps - 1 || isBfsPlaying}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs"
                title="Next step"
              >
                Next ⏭
              </button>
              <button
                type="button"
                onClick={onResetBFS}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs"
                title="Reset BFS traversal"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-amber-400">Time: O(V + E) • Space: O(V)</span>
          <button
            type="button"
            onClick={onRunBFS}
            disabled={!selectedNode || isAnyRunning}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium rounded transition-colors"
          >
            Run Full BFS
          </button>
        </div>
      </div>

      {/* Algorithm Card 3: Depth-First Search (DFS) */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-purple-400">🌲</span> Depth-First Search (DFS)
            </h4>
            <div className="text-[11px] text-slate-400">
              Stack-based depth exploration examining money flow paths
            </div>
          </div>
          <div>{getStatusBadge(dfsStatus)}</div>
        </div>

        {/* Step controls for DFS */}
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Step: {dfsStepIndex} / {Math.max(0, dfsTotalSteps - 1)}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={onPrevDFS}
                disabled={dfsStepIndex <= 0 || isDfsPlaying}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs"
                title="Previous step"
              >
                ⏮ Prev
              </button>
              <button
                type="button"
                onClick={onTogglePlayDFS}
                disabled={!selectedNode}
                className={`px-3 py-0.5 rounded text-xs font-semibold text-white transition-colors ${
                  isDfsPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {isDfsPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                type="button"
                onClick={onStepDFS}
                disabled={dfsStepIndex >= dfsTotalSteps - 1 || isDfsPlaying}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs"
                title="Next step"
              >
                Next ⏭
              </button>
              <button
                type="button"
                onClick={onResetDFS}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs"
                title="Reset DFS traversal"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-amber-400">Time: O(V + E) • Space: O(V)</span>
          <button
            type="button"
            onClick={onRunDFS}
            disabled={!selectedNode || isAnyRunning}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-medium rounded transition-colors"
          >
            Run Full DFS
          </button>
        </div>
      </div>

      {/* Algorithm Card 4: Anomaly & Pattern Scanner */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-amber-400">⚡</span> Network Anomaly Scanner
            </h4>
            <div className="text-[11px] text-slate-400">
              Scans for disbursement star hubs, rapid aggregation funnels, and high-value single transfers
            </div>
          </div>
          <div>{getStatusBadge(anomalyStatus)}</div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] font-mono text-slate-400">Multi-Signal Graph Heuristics</div>
          <button
            type="button"
            onClick={onRunAnomalies}
            disabled={isAnyRunning || nodes.length === 0}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Scan Anomalies</span>
          </button>
        </div>
      </div>

      {/* Algorithm Card 5: Combined Forensic Analysis */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-700/60 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <span>🛡️</span> Combined Fraud & Risk Analysis
            </h4>
            <div className="text-[11px] text-slate-400">
              Combines Kosaraju SCC, reachable BFS propagation, and Priority Queue scoring
            </div>
          </div>
          <div>{getStatusBadge(combinedStatus)}</div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Reset All Results
          </button>
          <button
            type="button"
            onClick={onRunCombined}
            disabled={!selectedNode || isAnyRunning}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-950/60"
          >
            🚀 Run Combined Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
