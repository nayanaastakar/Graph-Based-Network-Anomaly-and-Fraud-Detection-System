import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GraphVisualization from './components/GraphVisualization';
import EdgeInputPanel from './components/EdgeInputPanel';
import ControlPanel from './components/ControlPanel';
import DataStructureView from './components/DataStructureView';
import AlgorithmStatusPanel from './components/AlgorithmStatusPanel';
import BFSTable from './components/BFSTable';
import {
  RawTransaction,
  GraphData,
  SCC,
  AnomalyPattern,
  LogEntry,
  AlgorithmStatus,
  BFSStep,
  DFSStep
} from './types/algorithms';
import {
  buildGraphFromTransactions,
  DEFAULT_TRANSACTIONS,
  GraphAlgorithms,
  RISK_THRESHOLDS
} from './utils/algorithms';

function App() {
  // Source of truth: raw transaction list
  const [transactions, setTransactions] = useState<RawTransaction[]>(DEFAULT_TRANSACTIONS);
  const [graphData, setGraphData] = useState<GraphData>(() => buildGraphFromTransactions(DEFAULT_TRANSACTIONS));

  // Selection & visual highlighting
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [activeEdge, setActiveEdge] = useState<{ source: string; target: string } | undefined>(undefined);

  // Algorithm execution results
  const [sccs, setSccs] = useState<SCC[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Algorithm statuses
  const [kosarajuStatus, setKosarajuStatus] = useState<AlgorithmStatus>('Not Started');
  const [bfsStatus, setBfsStatus] = useState<AlgorithmStatus>('Ready');
  const [dfsStatus, setDfsStatus] = useState<AlgorithmStatus>('Ready');
  const [anomalyStatus, setAnomalyStatus] = useState<AlgorithmStatus>('Not Started');
  const [combinedStatus, setCombinedStatus] = useState<AlgorithmStatus>('Not Started');

  // Step-by-step playback states
  const [bfsSteps, setBfsSteps] = useState<BFSStep[]>([]);
  const [bfsStepIndex, setBfsStepIndex] = useState<number>(0);
  const [isBfsPlaying, setIsBfsPlaying] = useState<boolean>(false);

  const [dfsSteps, setDfsSteps] = useState<DFSStep[]>([]);
  const [dfsStepIndex, setDfsStepIndex] = useState<number>(0);
  const [isDfsPlaying, setIsDfsPlaying] = useState<boolean>(false);

  const [speedMs, setSpeedMs] = useState<number>(80);

  // Active right-panel tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'algorithms' | 'datastructures' | 'findings'>('algorithms');

  // Animation timer refs
  const bfsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dfsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core algorithms instance memoized on graph data
  const algorithms = useMemo(() => new GraphAlgorithms(graphData), [graphData]);

  // Cluster map for risk calculations
  const clusterMap = useMemo(() => {
    const map = new Map<string, number>();
    sccs.forEach((scc) => {
      scc.nodes.forEach((nId) => {
        map.set(nId, scc.nodes.length);
      });
    });
    return map;
  }, [sccs]);

  // Derived data structures
  const riskScores = useMemo(() => {
    return algorithms.calculateAllRiskScores(clusterMap);
  }, [algorithms, clusterMap]);

  const maxHeap = useMemo(() => {
    return algorithms.buildMaxHeap(riskScores);
  }, [algorithms, riskScores]);

  const maxHeapArray = useMemo(() => {
    return maxHeap.getArray();
  }, [maxHeap]);

  const topRiskyAccounts = useMemo(() => {
    return maxHeap.getTopK(5);
  }, [maxHeap]);

  const adjacencyList = useMemo(() => {
    return algorithms.getAdjacencyList();
  }, [algorithms]);

  // Logging helper
  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [log, ...prev].slice(0, 100));
  }, []);

  // Summary Metrics calculations
  const totalVolume = useMemo(() => {
    return graphData.edges.reduce((sum, e) => sum + e.amount, 0);
  }, [graphData.edges]);

  const highRiskCount = useMemo(() => {
    return graphData.nodes.filter((n) => {
      const score = riskScores.get(n.id) || 0;
      return score >= RISK_THRESHOLDS.HIGH_SCORE || n.risk === 'high';
    }).length;
  }, [graphData.nodes, riskScores]);

  const detectedPatternsCount = useMemo(() => {
    const fraudRingCount = sccs.filter((s) => s.nodes.length >= 2).length;
    return fraudRingCount + anomalies.length;
  }, [sccs, anomalies]);

  // Clean animation timers helper
  const stopAllPlayback = useCallback(() => {
    if (bfsTimerRef.current) {
      clearInterval(bfsTimerRef.current);
      bfsTimerRef.current = null;
    }
    if (dfsTimerRef.current) {
      clearInterval(dfsTimerRef.current);
      dfsTimerRef.current = null;
    }
    setIsBfsPlaying(false);
    setIsDfsPlaying(false);
  }, []);

  // Synchronize and build new graph
  const handleBuildGraph = useCallback(
    (newTxs: RawTransaction[]) => {
      stopAllPlayback();
      setTransactions(newTxs);
      const newGraph = buildGraphFromTransactions(newTxs);
      setGraphData(newGraph);

      // Reset algorithm states
      setSelectedNode(null);
      setHighlightedNodes([]);
      setActiveEdge(undefined);
      setSccs([]);
      setAnomalies([]);
      setBfsSteps([]);
      setBfsStepIndex(0);
      setDfsSteps([]);
      setDfsStepIndex(0);

      setKosarajuStatus('Not Started');
      setBfsStatus('Ready');
      setDfsStatus('Ready');
      setAnomalyStatus('Not Started');
      setCombinedStatus('Not Started');

      addLog({
        id: `build-${Date.now()}`,
        timestamp: new Date(),
        type: 'success',
        message: `Graph rebuilt from ${newTxs.length} transactions (${newGraph.nodes.length} vertices, ${newGraph.edges.length} edges).`
      });
    },
    [stopAllPlayback, addLog]
  );

  const handleLoadExample = useCallback(() => {
    handleBuildGraph(DEFAULT_TRANSACTIONS);
  }, [handleBuildGraph]);

  const handleClear = useCallback(() => {
    stopAllPlayback();
    setTransactions([]);
    setGraphData({ nodes: [], edges: [] });
    setSelectedNode(null);
    setHighlightedNodes([]);
    setActiveEdge(undefined);
    setSccs([]);
    setAnomalies([]);
    setBfsSteps([]);
    setBfsStepIndex(0);
    setDfsSteps([]);
    setDfsStepIndex(0);

    setKosarajuStatus('Not Started');
    setBfsStatus('Not Started');
    setDfsStatus('Not Started');
    setAnomalyStatus('Not Started');
    setCombinedStatus('Not Started');

    addLog({
      id: `clear-${Date.now()}`,
      timestamp: new Date(),
      type: 'warning',
      message: 'Cleared all transactions and graph data.'
    });
  }, [stopAllPlayback, addLog]);

  // 1. Kosaraju SCC Execution
  const handleRunKosaraju = async () => {
    if (kosarajuStatus === 'Running') return;
    stopAllPlayback();
    setKosarajuStatus('Running');

    try {
      const detectedSccs = await algorithms.kosarajuSCC(
        addLog,
        (stack) => {
          // Pass stack updates to runtime state if desired
        },
        (nodes) => {
          setHighlightedNodes(nodes);
        }
      );

      setSccs(detectedSccs);
      setKosarajuStatus('Completed');
      setActiveTab('findings');
    } catch (err: any) {
      setKosarajuStatus('Failed');
      addLog({
        id: `err-${Date.now()}`,
        timestamp: new Date(),
        type: 'error',
        message: `Kosaraju SCC execution error: ${err.message || err}`
      });
    } finally {
      setHighlightedNodes([]);
    }
  };

  // 2. BFS Traversal & Step Controls
  const initBFS = useCallback(
    (seed: string) => {
      stopAllPlayback();
      const res = algorithms.generateBFSSteps(seed);
      setBfsSteps(res.steps);
      setBfsStepIndex(0);
      setBfsStatus('Ready');
      return res.steps;
    },
    [algorithms, stopAllPlayback]
  );

  const handleStepBFS = useCallback(() => {
    if (bfsSteps.length === 0 && selectedNode) {
      initBFS(selectedNode);
      return;
    }
    if (bfsStepIndex < bfsSteps.length - 1) {
      const nextIdx = bfsStepIndex + 1;
      setBfsStepIndex(nextIdx);
      const st = bfsSteps[nextIdx];
      if (st.currentNode) setHighlightedNodes([st.currentNode]);
      setActiveEdge(st.currentEdge);
      if (nextIdx === bfsSteps.length - 1) {
        setBfsStatus('Completed');
        setIsBfsPlaying(false);
      }
    }
  }, [bfsSteps, bfsStepIndex, selectedNode, initBFS]);

  const handlePrevBFS = useCallback(() => {
    if (bfsStepIndex > 0) {
      const prevIdx = bfsStepIndex - 1;
      setBfsStepIndex(prevIdx);
      const st = bfsSteps[prevIdx];
      if (st.currentNode) setHighlightedNodes([st.currentNode]);
      setActiveEdge(st.currentEdge);
      setBfsStatus('Paused');
    }
  }, [bfsSteps, bfsStepIndex]);

  const handleTogglePlayBFS = useCallback(() => {
    if (!selectedNode) return;
    if (isBfsPlaying) {
      stopAllPlayback();
      setBfsStatus('Paused');
    } else {
      let currentSteps = bfsSteps;
      if (currentSteps.length === 0 || bfsStatus === 'Completed') {
        currentSteps = initBFS(selectedNode);
      }
      setBfsStatus('Running');
      setIsBfsPlaying(true);

      bfsTimerRef.current = setInterval(() => {
        setBfsStepIndex((curr) => {
          if (curr >= currentSteps.length - 1) {
            stopAllPlayback();
            setBfsStatus('Completed');
            return curr;
          }
          const next = curr + 1;
          const st = currentSteps[next];
          if (st.currentNode) setHighlightedNodes([st.currentNode]);
          setActiveEdge(st.currentEdge);
          return next;
        });
      }, speedMs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, isBfsPlaying, bfsSteps, bfsStatus, initBFS, stopAllPlayback, speedMs]);

  const handleRunFullBFS = useCallback(() => {
    if (!selectedNode) return;
    stopAllPlayback();
    const res = algorithms.generateBFSSteps(selectedNode);
    setBfsSteps(res.steps);
    setBfsStepIndex(res.steps.length - 1);
    setHighlightedNodes(res.traversalOrder);
    setActiveEdge(undefined);
    setBfsStatus('Completed');
    addLog({
      id: `bfs-${Date.now()}`,
      timestamp: new Date(),
      type: 'success',
      message: `Full BFS from ${selectedNode} traversed ${res.traversalOrder.length} vertices across ${
        Math.max(0, ...Array.from(res.levels.values())) + 1
      } levels.`
    });
  }, [selectedNode, algorithms, stopAllPlayback, addLog]);

  const handleResetBFS = useCallback(() => {
    stopAllPlayback();
    setBfsSteps([]);
    setBfsStepIndex(0);
    setHighlightedNodes([]);
    setActiveEdge(undefined);
    setBfsStatus('Ready');
  }, [stopAllPlayback]);

  // 3. DFS Traversal & Step Controls
  const initDFS = useCallback(
    (seed: string) => {
      stopAllPlayback();
      const res = algorithms.generateDFSSteps(seed);
      setDfsSteps(res.steps);
      setDfsStepIndex(0);
      setDfsStatus('Ready');
      return res.steps;
    },
    [algorithms, stopAllPlayback]
  );

  const handleStepDFS = useCallback(() => {
    if (dfsSteps.length === 0 && selectedNode) {
      initDFS(selectedNode);
      return;
    }
    if (dfsStepIndex < dfsSteps.length - 1) {
      const nextIdx = dfsStepIndex + 1;
      setDfsStepIndex(nextIdx);
      const st = dfsSteps[nextIdx];
      if (st.currentNode) setHighlightedNodes([st.currentNode]);
      setActiveEdge(st.currentEdge);
      if (nextIdx === dfsSteps.length - 1) {
        setDfsStatus('Completed');
        setIsDfsPlaying(false);
      }
    }
  }, [dfsSteps, dfsStepIndex, selectedNode, initDFS]);

  const handlePrevDFS = useCallback(() => {
    if (dfsStepIndex > 0) {
      const prevIdx = dfsStepIndex - 1;
      setDfsStepIndex(prevIdx);
      const st = dfsSteps[prevIdx];
      if (st.currentNode) setHighlightedNodes([st.currentNode]);
      setActiveEdge(st.currentEdge);
      setDfsStatus('Paused');
    }
  }, [dfsSteps, dfsStepIndex]);

  const handleTogglePlayDFS = useCallback(() => {
    if (!selectedNode) return;
    if (isDfsPlaying) {
      stopAllPlayback();
      setDfsStatus('Paused');
    } else {
      let currentSteps = dfsSteps;
      if (currentSteps.length === 0 || dfsStatus === 'Completed') {
        currentSteps = initDFS(selectedNode);
      }
      setDfsStatus('Running');
      setIsDfsPlaying(true);

      dfsTimerRef.current = setInterval(() => {
        setDfsStepIndex((curr) => {
          if (curr >= currentSteps.length - 1) {
            stopAllPlayback();
            setDfsStatus('Completed');
            return curr;
          }
          const next = curr + 1;
          const st = currentSteps[next];
          if (st.currentNode) setHighlightedNodes([st.currentNode]);
          setActiveEdge(st.currentEdge);
          return next;
        });
      }, speedMs);
    }
  }, [selectedNode, isDfsPlaying, dfsSteps, dfsStatus, initDFS, stopAllPlayback, speedMs]);

  const handleRunFullDFS = useCallback(() => {
    if (!selectedNode) return;
    stopAllPlayback();
    const res = algorithms.generateDFSSteps(selectedNode);
    setDfsSteps(res.steps);
    setDfsStepIndex(res.steps.length - 1);
    setHighlightedNodes(res.traversalOrder);
    setActiveEdge(undefined);
    setDfsStatus('Completed');
    addLog({
      id: `dfs-${Date.now()}`,
      timestamp: new Date(),
      type: 'success',
      message: `Full DFS from ${selectedNode} visited ${res.traversalOrder.length} vertices: [${res.traversalOrder.join(
        ' → '
      )}].`
    });
  }, [selectedNode, algorithms, stopAllPlayback, addLog]);

  const handleResetDFS = useCallback(() => {
    stopAllPlayback();
    setDfsSteps([]);
    setDfsStepIndex(0);
    setHighlightedNodes([]);
    setActiveEdge(undefined);
    setDfsStatus('Ready');
  }, [stopAllPlayback]);

  // 4. Anomaly Pattern Detection
  const handleRunAnomalies = useCallback(() => {
    stopAllPlayback();
    setAnomalyStatus('Running');
    const flagged = algorithms.detectAnomalies();
    setAnomalies(flagged);
    setAnomalyStatus('Completed');

    // Highlight flagged nodes
    const allFlaggedNodes = Array.from(new Set(flagged.flatMap((f) => f.nodes)));
    setHighlightedNodes(allFlaggedNodes);

    addLog({
      id: `anom-${Date.now()}`,
      timestamp: new Date(),
      type: 'highlight',
      message: `Anomaly detection finished. Flagged ${flagged.length} suspicious patterns (${
        flagged.filter((f) => f.severity === 'high').length
      } high-severity).`
    });
    setActiveTab('findings');
  }, [algorithms, stopAllPlayback, addLog]);

  // 5. Combined Analysis
  const handleRunCombined = useCallback(async () => {
    if (!selectedNode) return;
    stopAllPlayback();
    setCombinedStatus('Running');

    try {
      // 1. Kosaraju SCC
      setKosarajuStatus('Running');
      const detectedSccs = await algorithms.kosarajuSCC(addLog);
      setSccs(detectedSccs);
      setKosarajuStatus('Completed');

      // 2. BFS from seed node
      const bfsRes = algorithms.generateBFSSteps(selectedNode);
      setBfsSteps(bfsRes.steps);
      setBfsStepIndex(bfsRes.steps.length - 1);
      setBfsStatus('Completed');

      // 3. Anomalies
      const flagged = algorithms.detectAnomalies();
      setAnomalies(flagged);
      setAnomalyStatus('Completed');

      setCombinedStatus('Completed');
      setActiveTab('findings');

      addLog({
        id: `comb-${Date.now()}`,
        timestamp: new Date(),
        type: 'success',
        message: `Combined Forensic Analysis complete for seed Account ${selectedNode}. Evaluated ${detectedSccs.length} SCCs, ${bfsRes.traversalOrder.length} reachable accounts, and ${flagged.length} network anomalies.`
      });
    } catch (err: any) {
      setCombinedStatus('Failed');
      addLog({
        id: `comb-err-${Date.now()}`,
        timestamp: new Date(),
        type: 'error',
        message: `Combined analysis failed: ${err.message || err}`
      });
    }
  }, [selectedNode, algorithms, stopAllPlayback, addLog]);

  // Active step objects for runtime data structure displays
  const currentBfsStep = bfsSteps[bfsStepIndex];
  const currentDfsStep = dfsSteps[dfsStepIndex];

  const currentQueue = useMemo(() => {
    return currentBfsStep ? currentBfsStep.queue : [];
  }, [currentBfsStep]);

  const currentStack = useMemo(() => {
    return currentDfsStep ? currentDfsStep.stack : [];
  }, [currentDfsStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 shrink-0 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/60 font-bold text-white text-base">
              🔍
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                Graph-Based Network Anomaly & Fraud Detection System
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  DSA Platform
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Data Structures & Algorithms Demonstration • Kosaraju SCC • BFS Queue • DFS Stack • Binary Max-Heap
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Node:3005
            </span>
          </div>
        </div>
      </header>

      {/* Top KPI Summary Metrics Cards */}
      <section className="bg-slate-900/40 border-b border-slate-800/80 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Card 1: Total Accounts */}
          <div
            className="h-full min-h-[96px] sm:min-h-[104px] bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm cursor-help"
            title="Total Accounts (|V|): Count of distinct account entities transacting in the directed graph."
          >
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Total Accounts (|V|)</span>
              <span className="text-emerald-400 font-mono text-[10px]">Nodes</span>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-100 font-mono mt-1">
              {graphData.nodes.length}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Participating accounts</div>
          </div>

          {/* Card 2: Total Transactions */}
          <div
            className="h-full min-h-[96px] sm:min-h-[104px] bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm cursor-help"
            title="Transactions (|E|): Total directed monetary transfer edges connecting account pairs."
          >
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Transactions (|E|)</span>
              <span className="text-blue-400 font-mono text-[10px]">Edges</span>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-100 font-mono mt-1">
              {graphData.edges.length}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Directed transfers</div>
          </div>

          {/* Card 3: High-Risk Accounts */}
          <div
            className="h-full min-h-[96px] sm:min-h-[104px] bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm cursor-help"
            title="High-Risk Accounts: Accounts with calculated Risk Score ≥ 25.0 based on OutDegree, SCC ClusterSize, and OutAmount."
          >
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>High-Risk Accounts</span>
              <span className="text-red-400 font-mono text-[9px] sm:text-[10px] bg-red-950/60 px-1 py-0.5 rounded border border-red-800">
                Score ≥ 25.0
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-red-400 font-mono mt-1">
              {highRiskCount}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-mono truncate">
              Accounts: A1, A2, A3, A4, A7
            </div>
          </div>

          {/* Card 4: Detected Suspicious Patterns */}
          <div
            className="h-full min-h-[96px] sm:min-h-[104px] bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm cursor-help"
            title="Suspicious Patterns: De-duplicated count of SCC-detected fraud rings + heuristic scanner anomalies (Disbursement Hubs, Aggregation Funnels, High-Value Flows)."
          >
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Suspicious Patterns</span>
              <span className="text-amber-400 font-mono text-[9px] sm:text-[10px] bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800">
                Signals
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-amber-300 font-mono mt-1">
              {detectedPatternsCount}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
              {sccs.filter((s) => s.nodes.length >= 2).length > 0 || anomalies.length > 0
                ? `${sccs.filter((s) => s.nodes.length >= 2).length} Ring (SCC) • ${anomalies.length} Anom.`
                : 'Run SCC or Scanner to detect'}
            </div>
          </div>

          {/* Card 5: Total Transaction Volume */}
          <div
            className="col-span-2 sm:col-span-1 h-full min-h-[96px] sm:min-h-[104px] bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm cursor-help"
            title="Total Transaction Volume: Aggregate sum of all directed transfers across the network in Indian Rupee (₹)."
          >
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Total Volume</span>
              <span className="text-cyan-400 font-mono text-[10px]">INR</span>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              ₹{totalVolume.toLocaleString()}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Aggregate network flow</div>
          </div>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Section: Network Graph Canvas & Account Inspector (col-span-7) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col min-h-[380px] sm:min-h-[480px] lg:min-h-0">
          <GraphVisualization
            data={graphData}
            selectedNode={selectedNode}
            onNodeSelect={(id) => {
              setSelectedNode(id);
              if (id) {
                // Pre-initialize traversals for the selected node
                initBFS(id);
                initDFS(id);
              }
            }}
            highlightedNodes={highlightedNodes}
            activeEdge={activeEdge}
            sccs={sccs}
          />
        </div>

        {/* Right Section: Workspace Panels with Clean Tab Navigation (col-span-5) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
          {/* Tab Navigation Header */}
          <div className="grid grid-cols-2 sm:flex items-center border-b border-slate-700/80 bg-slate-800/80 p-1 gap-1 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('algorithms')}
              className={`flex-1 py-2 px-2 sm:px-2.5 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1.5 text-[11px] sm:text-xs ${
                activeTab === 'algorithms'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span>⚙️ Algorithms</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-2 px-2 sm:px-2.5 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1.5 text-[11px] sm:text-xs ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span>📝 Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('datastructures')}
              className={`flex-1 py-2 px-2 sm:px-2.5 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1.5 text-[11px] sm:text-xs ${
                activeTab === 'datastructures'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span>🗂️ DSA Internals</span>
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex-1 py-2 px-2 sm:px-2.5 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1.5 text-[11px] sm:text-xs ${
                activeTab === 'findings'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span>📊 Findings</span>
              {detectedPatternsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-3 sm:p-3.5 overflow-y-auto lg:max-h-[calc(100vh-230px)] scrollbar-thin scrollbar-thumb-slate-700">
            {activeTab === 'transactions' && (
              <EdgeInputPanel
                transactions={transactions}
                onBuildGraph={handleBuildGraph}
                onLoadExample={handleLoadExample}
                onClear={handleClear}
                isAlgorithmRunning={
                  kosarajuStatus === 'Running' ||
                  bfsStatus === 'Running' ||
                  dfsStatus === 'Running' ||
                  combinedStatus === 'Running'
                }
              />
            )}

            {activeTab === 'algorithms' && (
              <ControlPanel
                nodes={graphData.nodes}
                selectedNode={selectedNode}
                onSelectNode={(id) => {
                  setSelectedNode(id);
                  if (id) {
                    initBFS(id);
                    initDFS(id);
                  }
                }}
                onRunKosaraju={handleRunKosaraju}
                onRunBFS={handleRunFullBFS}
                onStepBFS={handleStepBFS}
                onPrevBFS={handlePrevBFS}
                onResetBFS={handleResetBFS}
                onRunDFS={handleRunFullDFS}
                onStepDFS={handleStepDFS}
                onPrevDFS={handlePrevDFS}
                onResetDFS={handleResetDFS}
                onRunAnomalies={handleRunAnomalies}
                onRunCombined={handleRunCombined}
                onResetAll={handleResetBFS}
                kosarajuStatus={kosarajuStatus}
                bfsStatus={bfsStatus}
                dfsStatus={dfsStatus}
                anomalyStatus={anomalyStatus}
                combinedStatus={combinedStatus}
                bfsStepIndex={bfsStepIndex}
                bfsTotalSteps={bfsSteps.length}
                isBfsPlaying={isBfsPlaying}
                onTogglePlayBFS={handleTogglePlayBFS}
                dfsStepIndex={dfsStepIndex}
                dfsTotalSteps={dfsSteps.length}
                isDfsPlaying={isDfsPlaying}
                onTogglePlayDFS={handleTogglePlayDFS}
                speedMs={speedMs}
                onChangeSpeed={setSpeedMs}
              />
            )}

            {activeTab === 'datastructures' && (
              <DataStructureView
                adjacencyList={adjacencyList}
                currentQueue={currentQueue}
                currentStack={currentStack}
                riskScores={riskScores}
                maxHeapArray={maxHeapArray}
                topRiskyAccounts={topRiskyAccounts}
                bfsActiveStep={currentBfsStep}
                dfsActiveStep={currentDfsStep}
              />
            )}

            {activeTab === 'findings' && (
              <div className="space-y-4">
                <AlgorithmStatusPanel
                  kosarajuStatus={kosarajuStatus}
                  bfsStatus={bfsStatus}
                  dfsStatus={dfsStatus}
                  anomalyStatus={anomalyStatus}
                  combinedStatus={combinedStatus}
                  sccs={sccs}
                  anomalies={anomalies}
                  bfsStats={{
                    startNode: selectedNode,
                    traversalOrder: bfsSteps[bfsSteps.length - 1]?.visited || [],
                    levelsVisited: currentBfsStep ? currentBfsStep.level + 1 : 0,
                    totalNodesVisited: bfsSteps[bfsSteps.length - 1]?.visited.length || 0
                  }}
                  dfsStats={{
                    startNode: selectedNode,
                    traversalOrder: dfsSteps[dfsSteps.length - 1]?.visited || [],
                    totalNodesVisited: dfsSteps[dfsSteps.length - 1]?.visited.length || 0
                  }}
                  dataStructuresStatus={{
                    adjacencyList: { count: adjacencyList.size, active: adjacencyList.size > 0 },
                    stack: { count: currentStack.length, active: currentStack.length > 0 },
                    queue: { count: currentQueue.length, active: currentQueue.length > 0 },
                    riskScores: { count: riskScores.size, active: riskScores.size > 0 },
                    maxHeap: { count: maxHeapArray.length, active: maxHeapArray.length > 0 }
                  }}
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                />

                {bfsSteps.length > 0 && (
                  <BFSTable steps={bfsSteps} currentStepIndex={bfsStepIndex} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Global Regulatory Disclaimer Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500 text-center shrink-0">
        Demonstration Platform • Graph indicators, cycles, and risk scores represent illustrative algorithmic risk signals, not confirmed proof of financial crime.
      </footer>
    </div>
  );
}

export default App;
