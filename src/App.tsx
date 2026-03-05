import React, { useState, useEffect } from 'react';
import GraphVisualizationOld from './components/GraphVisualizationOld';
import DataStructureView from './components/DataStructureView';
import AlgorithmLog from './components/AlgorithmLog';
import ControlPanel from './components/ControlPanel';
import EdgeInputPanel from './components/EdgeInputPanel';
import AlgorithmStatusPanel from './components/AlgorithmStatusPanel';
import { mockGraphData, createGraphFromEdges } from './data/mockData';
import { GraphAlgorithms } from './utils/algorithms';
import { AlgorithmState, LogEntry, SCC } from './types/algorithms';

function App() {
  const [graphData, setGraphData] = useState(mockGraphData);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [sccs, setSccs] = useState<SCC[]>([]);
  const [isFraudRunning, setIsFraudRunning] = useState(false);
  const [isBFSRunning, setIsBFSRunning] = useState(false);
  const [isCombinedRunning, setIsCombinedRunning] = useState(false);
  const [isAnomalyRunning, setIsAnomalyRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>({
    isRunning: false,
    currentStep: 0,
    visitedNodes: new Set(),
    stack: [],
    queue: [],
    adjacencyList: new Map(),
    riskScores: new Map(),
    maxHeap: [],
    logs: []
  });

  // BFS step history for table visualization
  const [bfsStepHistory, setBfsStepHistory] = useState<Array<{
    step: number;
    queue: string[];
    visited: string[];
    description: string;
  }>>([]);

  // Algorithm status tracking
  const [sccStatus, setSccStatus] = useState({
    completed: false,
    sccsFound: 0,
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    fraudRings: [] as Array<{nodes: string[], totalAmount: number, riskScore: number}>
  });

  const [bfsStatus, setBfsStatus] = useState({
    completed: false,
    startNode: null as string | null,
    traversalOrder: [] as string[],
    levelsVisited: 0,
    totalNodesVisited: 0
  });

  const [dataStructuresStatus, setDataStructuresStatus] = useState({
    adjacencyList: false,
    stack: false,
    queue: false,
    riskScores: false,
    maxHeap: false
  });

  // State for managing dropdown sections
  const [openSections, setOpenSections] = useState({
    transactionInput: true,
    algorithmControls: true,
    algorithmStatus: true,
    dataStructures: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const algorithms = new GraphAlgorithms(graphData);

  useEffect(() => {
    // Initialize risk scores and data structures
    const riskScores = algorithms.calculateAllRiskScores();
    const maxHeap = algorithms.getMaxHeap(riskScores);
    const adjacencyList = algorithms.getAdjacencyList();
    
    setAlgorithmState(prev => ({
      ...prev,
      riskScores,
      maxHeap,
      adjacencyList
    }));

    setDataStructuresStatus({
      adjacencyList: adjacencyList.size > 0,
      stack: false,
      queue: false,
      riskScores: riskScores.size > 0,
      maxHeap: maxHeap.length > 0
    });

    setSccStatus(prev => ({
      ...prev,
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData]);

  const addLog = (log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  };

  const handleEdgesSubmit = (edges: Array<{source: string; target: string; amount: number}>) => {
    const newGraphData = createGraphFromEdges(edges);
    setGraphData(newGraphData);
    setSccs([]);
    setHighlightedNodes([]);
    setSelectedNode(null);
    setLogs([]);
    
    // Reset algorithm status
    setSccStatus({
      completed: false,
      sccsFound: 0,
      totalNodes: newGraphData.nodes.length,
      totalEdges: newGraphData.edges.length,
      fraudRings: []
    });
    
    setBfsStatus({
      completed: false,
      startNode: null,
      traversalOrder: [],
      levelsVisited: 0,
      totalNodesVisited: 0
    });
  };

  const handleDetectFraudRings = async () => {
    if (isFraudRunning) return;
    
    setIsFraudRunning(true);
    setLogs([]);
    setSccs([]);
    setHighlightedNodes([]);
    
    try {
      const detectedSccs = await algorithms.kosarajuSCC(
        addLog,
        (stack) => {
          setAlgorithmState(prev => ({ ...prev, stack }));
          setDataStructuresStatus(prev => ({ ...prev, stack: true }));
        },
        (nodes) => {
          setHighlightedNodes(nodes);
        }
      );
      
      setSccs(detectedSccs);
      
      // Update risk scores based on SCCs
      const updatedRiskScores = new Map(algorithmState.riskScores);
      detectedSccs.forEach(scc => {
        scc.nodes.forEach(nodeId => {
          const currentScore = updatedRiskScores.get(nodeId) || 0;
          updatedRiskScores.set(nodeId, currentScore + scc.riskScore);
        });
      });
      
      const updatedMaxHeap = algorithms.getMaxHeap(updatedRiskScores);
      
      setAlgorithmState(prev => ({
        ...prev,
        riskScores: updatedRiskScores,
        maxHeap: updatedMaxHeap
      }));

      // Update SCC status
      const fraudRings = detectedSccs.map(scc => ({
        nodes: scc.nodes,
        totalAmount: scc.totalAmount,
        riskScore: scc.riskScore
      }));

      setSccStatus({
        completed: true,
        sccsFound: detectedSccs.length,
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        fraudRings
      });
      
    } catch (error) {
      addLog({
        id: 'error',
        timestamp: new Date(),
        type: 'error',
        message: `Error during fraud detection: ${error}`
      });
    } finally {
      setIsFraudRunning(false);
      setHighlightedNodes([]);
    }
  };

  const handleRunBFS = async () => {
    if (isBFSRunning) return;
    
    if (!selectedNode) {
      addLog({
        id: 'bfs-no-node',
        timestamp: new Date(),
        type: 'error',
        message: 'Please select a node first by clicking on any node in the graph'
      });
      return;
    }
    
    setIsBFSRunning(true);
    setLogs([]);
    setHighlightedNodes([]);
    
    // Initialize BFS step history
    const stepHistory: Array<{
      step: number;
      queue: string[];
      visited: string[];
      description: string;
    }> = [];
    
    try {
      const bfsResult = await algorithms.bfs(
        selectedNode,
        addLog,
        (queue) => {
          setAlgorithmState(prev => ({ ...prev, queue }));
          setDataStructuresStatus(prev => ({ ...prev, queue: true }));
          
          // Add to step history
          const visited = Array.from(algorithmState.visitedNodes);
          stepHistory.push({
            step: stepHistory.length,
            queue: [...queue],
            visited: [...visited],
            description: stepHistory.length === 0 ? 'Start' : `Step ${stepHistory.length}`
          });
          setBfsStepHistory([...stepHistory]);
        },
        (nodes) => {
          setHighlightedNodes(nodes);
          // Update visited nodes in algorithm state
          setAlgorithmState(prev => ({
            ...prev,
            visitedNodes: new Set([...Array.from(prev.visitedNodes), ...nodes])
          }));
        }
      );
      
      // Add final step to history
      stepHistory.push({
        step: stepHistory.length,
        queue: [],
        visited: bfsResult.traversalOrder,
        description: 'End'
      });
      setBfsStepHistory([...stepHistory]);
      
      // Update BFS status
      const maxLevel = Math.max(...Array.from(bfsResult.levels.values()));
      
      setBfsStatus({
        completed: true,
        startNode: selectedNode,
        traversalOrder: bfsResult.traversalOrder,
        levelsVisited: maxLevel + 1,
        totalNodesVisited: bfsResult.visitedNodes.size
      });
      
    } catch (error) {
      addLog({
        id: 'error',
        timestamp: new Date(),
        type: 'error',
        message: `Error during BFS: ${error}`
      });
    } finally {
      setIsBFSRunning(false);
      setHighlightedNodes([]);
    }
  };

  const handleCombinedAnalysis = async () => {
    if (isCombinedRunning) return;
    
    if (!selectedNode) {
      addLog({
        id: 'combined-no-node',
        timestamp: new Date(),
        type: 'error',
        message: 'Please select a node first by clicking on any node in the graph'
      });
      return;
    }
    
    setIsCombinedRunning(true);
    setLogs([]);
    setSccs([]);
    setHighlightedNodes([]);
    
    try {
      const result = await algorithms.combinedAnalysis(
        selectedNode,
        addLog,
        (stack) => {
          setAlgorithmState(prev => ({ ...prev, stack }));
          setDataStructuresStatus(prev => ({ ...prev, stack: true }));
        },
        (queue) => {
          setAlgorithmState(prev => ({ ...prev, queue }));
          setDataStructuresStatus(prev => ({ ...prev, queue: true }));
        },
        (nodes) => {
          setHighlightedNodes(nodes);
        }
      );
      
      setSccs(result.sccs);
      
      // Update algorithm state with combined risk scores
      const updatedMaxHeap = algorithms.getMaxHeap(result.combinedRisk);
      
      setAlgorithmState(prev => ({
        ...prev,
        riskScores: result.combinedRisk,
        maxHeap: updatedMaxHeap
      }));

      // Update SCC status
      const fraudRings = result.sccs.map(scc => ({
        nodes: scc.nodes,
        totalAmount: scc.totalAmount,
        riskScore: scc.riskScore
      }));

      setSccStatus({
        completed: true,
        sccsFound: result.sccs.length,
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        fraudRings
      });
      
      // Update BFS status
      const maxLevel = Math.max(...Array.from(result.bfsResult.levels.values()));
      
      setBfsStatus({
        completed: true,
        startNode: selectedNode,
        traversalOrder: result.bfsResult.traversalOrder,
        levelsVisited: maxLevel + 1,
        totalNodesVisited: result.bfsResult.visitedNodes.size
      });
      
    } catch (error) {
      addLog({
        id: 'error',
        timestamp: new Date(),
        type: 'error',
        message: `Error during combined analysis: ${error}`
      });
    } finally {
      setIsCombinedRunning(false);
      setHighlightedNodes([]);
    }
  };

  const handleDetectAnomalies = async () => {
    if (isAnomalyRunning) return;
    
    setIsAnomalyRunning(true);
    setLogs([]);
    setHighlightedNodes([]);
    
    try {
      const result = await algorithms.detectAnomalousPatterns(
        addLog,
        (nodes) => {
          setHighlightedNodes(nodes);
        }
      );
      
      addLog({
        id: 'anomaly-summary',
        timestamp: new Date(),
        type: 'success',
        message: `Found ${result.patterns.length} anomalous patterns: ${result.patterns.map(p => p.type).join(', ')}`
      });
      
    } catch (error) {
      addLog({
        id: 'error',
        timestamp: new Date(),
        type: 'error',
        message: `Error during anomaly detection: ${error}`
      });
    } finally {
      setIsAnomalyRunning(false);
      setHighlightedNodes([]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4">
      <div className="max-w-full mx-auto bg-black">
        <header className="mb-4">
          <h1 className="text-xl lg:text-3xl font-bold text-center text-emerald-400 mb-2">
            Graph-Based Network Anomaly & Fraud Detection System
          </h1>
          <p className="text-center text-slate-400 text-sm lg:text-base">
            Data Structures & Algorithms Demonstration
          </p>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Left Panel - Network Graph (takes most space on desktop, full on mobile) */}
          <div className="col-span-1 lg:col-span-8 bg-black border border-slate-700 rounded-xl p-4">
            <div className="h-full flex flex-col">
              <h2 className="font-bold text-emerald-400 mb-3" style={{ fontSize: '14px' }}>Network Graph</h2>
              <div className="flex-1">
                <GraphVisualizationOld
                  data={graphData}
                  selectedNode={selectedNode}
                  onNodeSelect={setSelectedNode}
                  highlightedNodes={highlightedNodes}
                  sccs={sccs}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - All Controls and Data */}
          <div className="col-span-1 lg:col-span-4 space-y-3">
            {/* Transaction Input */}
            <div className="bg-black border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('transactionInput')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <h2 className="font-bold text-emerald-400" style={{ fontSize: '14px' }}>Transaction Input</h2>
                <span className="text-emerald-400 transform transition-transform duration-200" 
                      style={{ transform: openSections.transactionInput ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {openSections.transactionInput && (
                <div className="p-3">
                  <EdgeInputPanel
                    onEdgesSubmit={handleEdgesSubmit}
                    isAlgorithmRunning={isFraudRunning || isBFSRunning || isCombinedRunning || isAnomalyRunning}
                  />
                </div>
              )}
            </div>

            {/* Algorithm Controls */}
            <div className="bg-black border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('algorithmControls')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <h2 className="font-bold text-emerald-400" style={{ fontSize: '14px' }}>Algorithm Controls</h2>
                <span className="text-emerald-400 transform transition-transform duration-200" 
                      style={{ transform: openSections.algorithmControls ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {openSections.algorithmControls && (
                <div className="p-3">
                  <ControlPanel
                    onDetectFraudRings={handleDetectFraudRings}
                    onRunBFS={handleRunBFS}
                    onCombinedAnalysis={handleCombinedAnalysis}
                    onDetectAnomalies={handleDetectAnomalies}
                    isAlgorithmRunning={isFraudRunning || isBFSRunning || isCombinedRunning || isAnomalyRunning}
                    isFraudRunning={isFraudRunning}
                    isBFSRunning={isBFSRunning}
                    isCombinedRunning={isCombinedRunning}
                    isAnomalyRunning={isAnomalyRunning}
                    selectedNode={selectedNode}
                  />
                </div>
              )}
            </div>

            {/* Algorithm Status */}
            <div className="bg-black border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('algorithmStatus')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <h2 className="font-bold text-emerald-400" style={{ fontSize: '14px' }}>Algorithm Status</h2>
                <span className="text-emerald-400 transform transition-transform duration-200" 
                      style={{ transform: openSections.algorithmStatus ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {openSections.algorithmStatus && (
                <div className="p-3">
                  <AlgorithmStatusPanel
                    sccStatus={sccStatus}
                    bfsStatus={bfsStatus}
                    dataStructuresStatus={dataStructuresStatus}
                  />
                </div>
              )}
            </div>

            {/* Data Structures */}
            <div className="bg-black border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('dataStructures')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <h2 className="font-bold text-emerald-400" style={{ fontSize: '14px' }}>Data Structures</h2>
                <span className="text-emerald-400 transform transition-transform duration-200" 
                      style={{ transform: openSections.dataStructures ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {openSections.dataStructures && (
                <div className="p-3">
                  <DataStructureView
                    state={algorithmState}
                    adjacencyList={algorithmState.adjacencyList}
                    bfsStepHistory={bfsStepHistory}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
