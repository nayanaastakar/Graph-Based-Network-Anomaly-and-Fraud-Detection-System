import React from 'react';

interface AlgorithmStatusPanelProps {
  sccStatus: {
    completed: boolean;
    sccsFound: number;
    totalNodes: number;
    totalEdges: number;
    fraudRings: Array<{
      nodes: string[];
      totalAmount: number;
      riskScore: number;
    }>;
  };
  bfsStatus: {
    completed: boolean;
    startNode: string | null;
    traversalOrder: string[];
    levelsVisited: number;
    totalNodesVisited: number;
  };
  dataStructuresStatus: {
    adjacencyList: boolean;
    stack: boolean;
    queue: boolean;
    riskScores: boolean;
    maxHeap: boolean;
  };
}

const AlgorithmStatusPanel: React.FC<AlgorithmStatusPanelProps> = ({
  sccStatus,
  bfsStatus,
  dataStructuresStatus
}) => {
  const getStatusColor = (completed: boolean) => 
    completed ? 'text-emerald-400 bg-emerald-900/30 border-emerald-700' : 'text-amber-400 bg-amber-900/30 border-amber-700';

  const getDSStatusColor = (active: boolean) =>
    active ? 'bg-emerald-500' : 'bg-slate-600';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
      <h3 className="text-xl font-bold text-slate-100 mb-6">Algorithm & DSA Status</h3>
      
      {/* Kosaraju's Algorithm Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-slate-200">Kosaraju's Algorithm (SCC Detection)</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sccStatus.completed)}`}>
            {sccStatus.completed ? 'Completed' : 'Running'}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status:</span>
            <span className={getStatusColor(sccStatus.completed)}>
              {sccStatus.completed ? '✅ Completed' : '🔄 Running'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">SCCs Found:</span>
            <span className="text-slate-200 font-mono">{sccStatus.sccsFound}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Nodes:</span>
            <span className="text-slate-200 font-mono">{sccStatus.totalNodes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Edges:</span>
            <span className="text-slate-200 font-mono">{sccStatus.totalEdges}</span>
          </div>
          {sccStatus.fraudRings.length > 0 && (
            <div className="mt-4">
              <h5 className="text-md font-semibold text-slate-200 mb-2">Detected Fraud Rings:</h5>
              <div className="space-y-2">
                {sccStatus.fraudRings.map((ring, index) => (
                  <div key={index} className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-red-400 font-semibold">Ring {index + 1}</span>
                      <span className="text-red-300 text-sm">Risk: {ring.riskScore.toFixed(1)}</span>
                    </div>
                    <div className="text-slate-300 text-sm mb-1">
                      Nodes: {ring.nodes.join(', ')}
                    </div>
                    <div className="text-slate-400 text-xs">
                      Total Amount: ₹{ring.totalAmount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BFS Algorithm Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-slate-200">BFS Traversal</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bfsStatus.completed)}`}>
            {bfsStatus.completed ? 'Completed' : bfsStatus.startNode ? 'Running' : 'Ready'}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status:</span>
            <span className={getStatusColor(bfsStatus.completed)}>
              {bfsStatus.completed ? '✅ Completed' : bfsStatus.startNode ? '🔄 Running' : '⚡ Ready'}
            </span>
          </div>
          {bfsStatus.startNode && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Start Node:</span>
              <span className="text-slate-200 font-mono">{bfsStatus.startNode}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Nodes Visited:</span>
            <span className="text-slate-200 font-mono">{bfsStatus.totalNodesVisited}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Levels Visited:</span>
            <span className="text-slate-200 font-mono">{bfsStatus.levelsVisited}</span>
          </div>
          {bfsStatus.traversalOrder.length > 0 && (
            <div className="mt-4">
              <h5 className="text-md font-semibold text-slate-200 mb-2">Traversal Order:</h5>
              <div className="flex flex-wrap gap-2">
                {bfsStatus.traversalOrder.map((node, index) => (
                  <span key={index} className="bg-blue-900/30 border border-blue-700 rounded px-2 py-1 text-blue-300 text-xs">
                    {node}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Structures Status */}
      <div>
        <h4 className="text-lg font-semibold text-slate-200 mb-3">Data Structures</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Adjacency List:</span>
              <div className={`w-3 h-3 rounded-full ${getDSStatusColor(dataStructuresStatus.adjacencyList)}`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Stack (DFS):</span>
              <div className={`w-3 h-3 rounded-full ${getDSStatusColor(dataStructuresStatus.stack)}`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Queue (BFS):</span>
              <div className={`w-3 h-3 rounded-full ${getDSStatusColor(dataStructuresStatus.queue)}`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Scores:</span>
              <div className={`w-3 h-3 rounded-full ${getDSStatusColor(dataStructuresStatus.riskScores)}`}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Max Heap:</span>
              <div className={`w-3 h-3 rounded-full ${getDSStatusColor(dataStructuresStatus.maxHeap)}`}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-slate-900 rounded-lg">
          <p className="text-sm font-medium text-slate-300 mb-2">DSA Implementation Status:</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Graph Representation:</span>
              <span className={dataStructuresStatus.adjacencyList ? 'text-emerald-400' : 'text-slate-500'}>
                {dataStructuresStatus.adjacencyList ? '✓ Implemented' : '○ Not Used'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DFS Algorithm:</span>
              <span className={dataStructuresStatus.stack ? 'text-emerald-400' : 'text-slate-500'}>
                {dataStructuresStatus.stack ? '✓ Implemented' : '○ Not Used'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">BFS Algorithm:</span>
              <span className={dataStructuresStatus.queue ? 'text-emerald-400' : 'text-slate-500'}>
                {dataStructuresStatus.queue ? '✓ Implemented' : '○ Not Used'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Score Storage:</span>
              <span className={dataStructuresStatus.riskScores ? 'text-emerald-400' : 'text-slate-500'}>
                {dataStructuresStatus.riskScores ? '✓ Implemented' : '○ Not Used'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Priority Queue:</span>
              <span className={dataStructuresStatus.maxHeap ? 'text-emerald-400' : 'text-slate-500'}>
                {dataStructuresStatus.maxHeap ? '✓ Implemented' : '○ Not Used'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmStatusPanel;
