import React from 'react';

interface ControlPanelProps {
  onDetectFraudRings: () => void;
  onRunBFS: () => void;
  onCombinedAnalysis: () => void;
  onDetectAnomalies: () => void;
  isAlgorithmRunning: boolean;
  isFraudRunning: boolean;
  isBFSRunning: boolean;
  isCombinedRunning: boolean;
  isAnomalyRunning: boolean;
  selectedNode: string | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onDetectFraudRings,
  onRunBFS,
  onCombinedAnalysis,
  onDetectAnomalies,
  isAlgorithmRunning,
  isFraudRunning,
  isBFSRunning,
  isCombinedRunning,
  isAnomalyRunning,
  selectedNode
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDetectFraudRings}
          disabled={isFraudRunning}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded text-xs flex items-center justify-center"
        >
          <span>{isFraudRunning ? '...' : 'Fraud Rings'}</span>
        </button>

        <button
          onClick={onRunBFS}
          disabled={isBFSRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded text-xs flex items-center justify-center"
        >
          <span>{isBFSRunning ? '...' : 'BFS'}</span>
        </button>

        <button
          onClick={onCombinedAnalysis}
          disabled={isCombinedRunning}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded text-xs flex items-center justify-center"
        >
          <span>{isCombinedRunning ? '...' : 'Combined'}</span>
        </button>

        <button
          onClick={onDetectAnomalies}
          disabled={isAnomalyRunning}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded text-xs flex items-center justify-center"
        >
          <span>{isAnomalyRunning ? '...' : 'Anomalies'}</span>
        </button>
      </div>

      {!selectedNode && (
        <div className="text-amber-400 text-sm text-center bg-amber-900/30 border border-amber-700 p-3 rounded-lg">
          <div className="font-bold mb-1">💡 Tip: Select a Node</div>
          <div>Click on any node in the graph to select it for BFS and Combined Analysis</div>
          <div className="text-xs mt-1 text-amber-300">Selected nodes will show with a blue highlight</div>
        </div>
      )}

      {selectedNode && (
        <div className="text-emerald-400 text-sm text-center bg-emerald-900/30 border border-emerald-700 p-3 rounded-lg">
          <div className="font-bold mb-1">✅ Node Selected</div>
          <div>Ready to run BFS and Combined Analysis from: <span className="text-white font-mono">{selectedNode}</span></div>
          <div className="text-xs mt-1 text-emerald-300">Click the node again to deselect</div>
        </div>
      )}

      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-bold text-slate-300 mb-2">Algorithm Information</h3>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">Kosaraju's SCC:</span>
            <span className="text-amber-400">O(V + E)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">BFS Traversal:</span>
            <span className="text-amber-400">O(V + E)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Risk Score:</span>
            <span className="text-amber-400 text-xs">(Out-degree × 2) + (Cluster × 3) + (Amount/1000)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-bold text-slate-300 mb-2">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-300">Normal Account</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            <span className="text-slate-300">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-slate-300">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-slate-300">Highlighted/Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
