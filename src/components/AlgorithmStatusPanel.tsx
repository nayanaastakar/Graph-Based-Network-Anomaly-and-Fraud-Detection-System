import React from 'react';
import { AlgorithmStatus, SCC, AnomalyPattern, LogEntry } from '../types/algorithms';
import { RISK_THRESHOLDS } from '../utils/algorithms';

interface AlgorithmStatusPanelProps {
  kosarajuStatus: AlgorithmStatus;
  bfsStatus: AlgorithmStatus;
  dfsStatus: AlgorithmStatus;
  anomalyStatus: AlgorithmStatus;
  combinedStatus: AlgorithmStatus;
  sccs: SCC[];
  anomalies: AnomalyPattern[];
  bfsStats: {
    startNode: string | null;
    traversalOrder: string[];
    levelsVisited: number;
    totalNodesVisited: number;
  };
  dfsStats: {
    startNode: string | null;
    traversalOrder: string[];
    totalNodesVisited: number;
  };
  dataStructuresStatus: {
    adjacencyList: { count: number; active: boolean };
    stack: { count: number; active: boolean };
    queue: { count: number; active: boolean };
    riskScores: { count: number; active: boolean };
    maxHeap: { count: number; active: boolean };
  };
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const AlgorithmStatusPanel: React.FC<AlgorithmStatusPanelProps> = ({
  kosarajuStatus,
  bfsStatus,
  dfsStatus,
  anomalyStatus,
  sccs,
  anomalies,
  bfsStats,
  dfsStats,
  dataStructuresStatus,
  logs,
  onClearLogs
}) => {
  const fraudRings = sccs.filter((s) => s.nodes.length >= 2);
  const scannerAnomalies = anomalies.filter((a) => a.category === 'Scanner' || !a.category);

  const renderStatusPill = (status: AlgorithmStatus) => {
    switch (status) {
      case 'Running':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/80 text-blue-300 border border-blue-500 animate-pulse">Running</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500">Completed</span>;
      case 'Paused':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 text-amber-300 border border-amber-500">Paused</span>;
      case 'Ready':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900/80 text-cyan-300 border border-cyan-500">Ready</span>;
      case 'Failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/80 text-red-300 border border-red-500">Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Not Started</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Thresholds Reference Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-slate-200">
          <span>📐 Configured Risk Thresholds & Classification</span>
          <span className="text-[10px] text-amber-400 font-mono">Deterministic Rules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div className="p-1.5 rounded bg-red-950/40 border border-red-700/60 text-red-300">
            <strong>High Risk:</strong> Score ≥ {RISK_THRESHOLDS.HIGH_SCORE}
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Accounts: A1, A2, A3, A4, A7</div>
          </div>
          <div className="p-1.5 rounded bg-amber-950/40 border border-amber-700/60 text-amber-300">
            <strong>Medium Risk:</strong> {RISK_THRESHOLDS.MEDIUM_SCORE} ≤ Score &lt; {RISK_THRESHOLDS.HIGH_SCORE}
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Accounts: A5, A8, A10, A13</div>
          </div>
          <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <strong>Normal Risk:</strong> Score &lt; {RISK_THRESHOLDS.MEDIUM_SCORE}
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">All remaining leaf / terminal nodes</div>
          </div>
        </div>
      </div>

      {/* Algorithm Execution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Kosaraju Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200">Kosaraju SCC</span>
            {renderStatusPill(kosarajuStatus)}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Total SCCs: <strong className="text-slate-200 font-mono">{sccs.length}</strong></div>
            <div>Fraud Rings (≥2 nodes): <strong className="text-red-400 font-mono">{fraudRings.length}</strong></div>
          </div>
        </div>

        {/* BFS Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200">BFS Traversal</span>
            {renderStatusPill(bfsStatus)}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Seed: <strong className="text-blue-300 font-mono">{bfsStats.startNode || 'None'}</strong></div>
            <div>Visited: <strong className="text-slate-200 font-mono">{bfsStats.totalNodesVisited} nodes ({bfsStats.levelsVisited} levels)</strong></div>
          </div>
        </div>

        {/* DFS Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200">DFS Traversal</span>
            {renderStatusPill(dfsStatus)}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Seed: <strong className="text-purple-300 font-mono">{dfsStats.startNode || 'None'}</strong></div>
            <div>Visited: <strong className="text-slate-200 font-mono">{dfsStats.totalNodesVisited} nodes</strong></div>
          </div>
        </div>

        {/* Anomalies Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200">Anomaly Scanner</span>
            {renderStatusPill(anomalyStatus)}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Structural Scanner Signals: <strong className="text-amber-300 font-mono">{scannerAnomalies.length}</strong></div>
            <div>High Severity: <strong className="text-red-400 font-mono">{scannerAnomalies.filter((a) => a.severity === 'high').length}</strong></div>
          </div>
        </div>
      </div>

      {/* Detected Directed Fraud Rings Breakdown */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
        <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>🚨</span> Directed Fraud Rings ({fraudRings.length})
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Identified by Kosaraju SCC</span>
        </h4>

        {fraudRings.length === 0 ? (
          <div className="text-slate-500 text-xs italic p-2 bg-slate-950/60 rounded border border-slate-800 text-center">
            {kosarajuStatus === 'Completed'
              ? 'No multi-account circular fraud rings detected in current graph topology.'
              : 'Execute Kosaraju\'s SCC or Combined Analysis to identify directed circular transaction loops.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {fraudRings.map((ring, idx) => (
              <div
                key={ring.id}
                className="p-2.5 rounded-lg border text-xs space-y-1 bg-red-950/30 border-red-700/70"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5" style={{ color: ring.color }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ring.color }}></span>
                    Fraud Ring #{idx + 1} ({ring.nodes.length} Accounts)
                  </span>
                  <span className="text-red-300 font-mono text-[11px] bg-red-900/50 px-1.5 py-0.5 rounded border border-red-600">
                    Ring Risk: {ring.riskScore.toFixed(1)} pts
                  </span>
                </div>

                {/* Directed Sequence: A2 → A3 → A4 → A2 */}
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-emerald-400 font-bold text-xs">{ring.directedSequence}</span>
                  <span className="text-amber-300 font-bold text-xs">₹{ring.totalAmount.toLocaleString()} Cycle Volume</span>
                </div>

                {/* Mathematical justification */}
                <div className="text-[10px] text-slate-400 flex flex-wrap items-center justify-between pt-0.5">
                  <span>
                    Formula: <code className="text-slate-300 font-mono">{ring.riskFormulaExplanation}</code>
                  </span>
                  <span className="text-slate-400 italic">Circular Layering Loop</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged Network Anomalies (Structural Scanner) */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>⚠️</span> Flagged Network Anomalies ({scannerAnomalies.length})
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Identified by Heuristic Scanner</span>
        </h4>

        {scannerAnomalies.length === 0 ? (
          <div className="text-slate-500 text-xs italic p-2 bg-slate-950/60 rounded border border-slate-800 text-center">
            {anomalyStatus === 'Completed'
              ? 'No anomalous hub patterns or threshold breaches detected.'
              : 'Run "Scan Anomalies" to inspect disbursement hubs, concentration funnels, and high-value single transfers.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scannerAnomalies.map((pattern) => (
              <div
                key={pattern.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  pattern.severity === 'high'
                    ? 'bg-red-950/30 border-red-700/60'
                    : 'bg-amber-950/30 border-amber-700/60'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-200">{pattern.type}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      pattern.severity === 'high'
                        ? 'bg-red-900 text-red-200 border border-red-600'
                        : 'bg-amber-900 text-amber-200 border border-amber-600'
                    }`}
                  >
                    {pattern.severity} Priority
                  </span>
                </div>
                <div className="text-slate-300 text-[11px]">{pattern.description}</div>
                <div className="text-[10px] text-cyan-400 font-semibold">{pattern.riskSignal}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Structure Implementation & Runtime Health */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
        <h4 className="text-xs font-bold text-slate-200 mb-2">
          Data Structure Implementation & Runtime Health
        </h4>
        <div className="space-y-1.5 text-xs">
          {[
            {
              name: 'Adjacency List',
              impl: 'Directed Map<V, E[]>',
              status: `${dataStructuresStatus.adjacencyList.count} Vertices loaded`,
              active: dataStructuresStatus.adjacencyList.active
            },
            {
              name: 'Stack (LIFO)',
              impl: 'Array Stack for DFS & Kosaraju',
              status: `${dataStructuresStatus.stack.count} elements on stack`,
              active: dataStructuresStatus.stack.active
            },
            {
              name: 'Queue (FIFO)',
              impl: 'Queue for BFS exploration',
              status: `${dataStructuresStatus.queue.count} elements enqueued`,
              active: dataStructuresStatus.queue.active
            },
            {
              name: 'Risk Score Storage',
              impl: 'Hash Map<NodeId, Score>',
              status: `${dataStructuresStatus.riskScores.count} Account risk profiles calculated`,
              active: dataStructuresStatus.riskScores.active
            },
            {
              name: 'Max-Heap Priority Queue',
              impl: 'Binary Max-Heap',
              status: `${dataStructuresStatus.maxHeap.count} Accounts ranked by risk score`,
              active: dataStructuresStatus.maxHeap.active
            }
          ].map((ds, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 text-xs">{ds.name}:</span>{' '}
                <span className="text-[11px] text-slate-400 font-mono">{ds.impl}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-emerald-400 font-medium">✓ Implemented</span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-300 font-mono">{ds.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log Terminal */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span className="text-emerald-400 font-mono">&gt;_</span>
            Algorithmic Execution Logs ({logs.length})
          </div>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Clear Logs
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] p-2 bg-black/60 rounded border border-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No execution logs. Trigger any algorithm to view real-time runtime traces.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="leading-tight flex items-start gap-2">
                <span className="text-slate-600 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'warning'
                      ? 'text-amber-400'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'highlight'
                      ? 'text-cyan-300'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmStatusPanel;
