import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { GraphData, NodeData, EdgeData, SCC } from '../types/algorithms';
import { RISK_THRESHOLDS } from '../utils/algorithms';

interface GraphVisualizationProps {
  data: GraphData;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  highlightedNodes: string[];
  activeEdge?: { source: string; target: string };
  sccs: SCC[];
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  highlightedNodes,
  activeEdge,
  sccs
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(100);
  const [layoutName, setLayoutName] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose');

  // Map each node to its SCC color if present
  const nodeSccColorMap = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const map = new Map<string, string>();
    sccs.forEach((scc) => {
      scc.nodes.forEach((nId) => {
        map.set(nId, scc.color);
      });
    });
    nodeSccColorMap.current = map;
  }, [sccs]);

  // Run layout with generous spacing to prevent overlap
  const runLayout = useCallback((cyInstance: Core, name: string) => {
    if (!cyInstance || cyInstance.nodes().length === 0) return;

    let layoutConfig: cytoscape.LayoutOptions;

    if (name === 'cose') {
      layoutConfig = {
        name: 'cose',
        animate: false,
        randomize: false,
        fit: true,
        padding: 45,
        nodeRepulsion: () => 800000,
        idealEdgeLength: () => 140,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 40,
        numIter: 120,
        initialTemp: 100,
        coolingFactor: 0.9,
        minTemp: 1.0
      } as cytoscape.LayoutOptions;
    } else if (name === 'concentric') {
      layoutConfig = {
        name: 'concentric',
        animate: false,
        fit: true,
        padding: 45,
        concentric: (node: any) => node.data('outDegree') || 1,
        levelWidth: () => 2,
        spacingFactor: 1.4
      } as cytoscape.LayoutOptions;
    } else if (name === 'breadthfirst') {
      layoutConfig = {
        name: 'breadthfirst',
        animate: false,
        fit: true,
        padding: 45,
        directed: true,
        circle: false,
        spacingFactor: 1.5
      } as cytoscape.LayoutOptions;
    } else {
      layoutConfig = {
        name: 'circle',
        animate: false,
        fit: true,
        padding: 45,
        spacingFactor: 1.2
      } as cytoscape.LayoutOptions;
    }

    const layout = cyInstance.layout(layoutConfig);
    layout.run();
    cyInstance.fit(undefined, 40);
    setCurrentZoom(Math.round(cyInstance.zoom() * 100));
  }, []);

  // Initialize and synchronize cytoscape graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert data to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [];

    data.nodes.forEach((node) => {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: node.id,
          risk: node.risk,
          riskScore: node.riskScore,
          outDegree: node.outDegree,
          inDegree: node.inDegree,
          totalAmount: node.totalAmount
        }
      });
    });

    data.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          amount: edge.amount,
          label: edge.label
        }
      });
    });

    // Create or re-populate cy instance
    if (!cyRef.current) {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        textureOnViewport: true,
        hideEdgesOnViewport: true,
        minZoom: 0.2,
        maxZoom: 3.5,
        wheelSensitivity: 0.35,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#FFFFFF',
              'font-size': '13px',
              'font-weight': 'bold',
              'font-family': 'monospace',
              'width': 50,
              'height': 50,
              'background-color': '#0F172A',
              'border-width': 3.5,
              'border-color': '#10B981', // default normal
              'text-outline-color': '#020617',
              'text-outline-width': 2.5
            }
          },
          {
            selector: 'node[risk = "high"]',
            style: {
              'border-color': '#EF4444',
              'background-color': '#450A0A'
            }
          },
          {
            selector: 'node[risk = "medium"]',
            style: {
              'border-color': '#F59E0B',
              'background-color': '#451A03'
            }
          },
          {
            selector: 'node[risk = "normal"]',
            style: {
              'border-color': '#10B981',
              'background-color': '#064E3B'
            }
          },
          {
            selector: 'node.selected',
            style: {
              'border-color': '#3B82F6',
              'border-width': 5,
              'width': 60,
              'height': 60,
              'background-color': '#1E3A8A'
            }
          },
          {
            selector: 'node.highlighted',
            style: {
              'border-color': '#38BDF8',
              'border-width': 4.5,
              'background-color': '#0284C7'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2.5,
              'line-color': '#64748B',
              'target-arrow-color': '#64748B',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'control-point-step-size': 40,
              'arrow-scale': 1.25,
              'label': 'data(label)',
              'font-size': '11px',
              'font-weight': 'bold',
              'font-family': 'monospace',
              'color': '#F1F5F9',
              'text-background-color': '#020617',
              'text-background-opacity': 0.95,
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'text-border-width': 1,
              'text-border-color': '#334155',
              'text-rotation': 'autorotate',
              'text-margin-y': -10
            }
          },
          {
            selector: 'edge.active-edge',
            style: {
              'line-color': '#38BDF8',
              'target-arrow-color': '#38BDF8',
              'width': 5,
              'arrow-scale': 1.5,
              'z-index': 99
            }
          }
        ]
      });

      // Tap node
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const id = node.id();
        onNodeSelect(id);
      });

      // Tap background
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          onNodeSelect(null);
        }
      });

      // Zoom listener
      cy.on('zoom', () => {
        setCurrentZoom(Math.round(cy.zoom() * 100));
      });

      cyRef.current = cy;
      runLayout(cy, layoutName);
    } else {
      const cy = cyRef.current;
      cy.elements().remove();
      cy.add(elements);
      runLayout(cy, layoutName);
    }
  }, [data, runLayout, layoutName, onNodeSelect]);

  // Update styles dynamically based on selection, highlight, SCC colors, and active edge
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.nodes().length === 0) return;

    cy.batch(() => {
      // Reset classes
      cy.nodes().removeClass('selected highlighted');
      cy.edges().removeClass('active-edge');

      // Apply SCC colors
      cy.nodes().forEach((n) => {
        const nId = n.id();
        const sccColor = nodeSccColorMap.current.get(nId);
        if (sccColor) {
          n.style('border-color', sccColor);
          n.style('border-width', 4.5);
        } else {
          // Restore risk color
          const risk = n.data('risk');
          n.style('border-color', risk === 'high' ? '#EF4444' : risk === 'medium' ? '#F59E0B' : '#10B981');
          n.style('border-width', 3.5);
        }
      });

      // Highlighted nodes
      if (highlightedNodes && highlightedNodes.length > 0) {
        highlightedNodes.forEach((id) => {
          cy.$id(id).addClass('highlighted');
        });
      }

      // Selected node
      if (selectedNode) {
        cy.$id(selectedNode).addClass('selected');
      }

      // Active edge
      if (activeEdge) {
        cy.edges().forEach((edge) => {
          if (edge.data('source') === activeEdge.source && edge.data('target') === activeEdge.target) {
            edge.addClass('active-edge');
          }
        });
      }
    });
  }, [selectedNode, highlightedNodes, sccs, activeEdge]);

  // Handle window and container resize
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 40);
      }
    };

    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (cyRef.current) {
          cyRef.current.resize();
        }
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
      setCurrentZoom(Math.round(cyRef.current.zoom() * 100));
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      setCurrentZoom(Math.round(cyRef.current.zoom() * 100));
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
      setCurrentZoom(Math.round(cyRef.current.zoom() * 100));
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      runLayout(cyRef.current, layoutName);
    }
  };

  // Selected node details
  const selectedNodeData: NodeData | undefined = data.nodes.find((n) => n.id === selectedNode);
  const incomingEdges: EdgeData[] = selectedNode ? data.edges.filter((e) => e.target === selectedNode) : [];
  const outgoingEdges: EdgeData[] = selectedNode ? data.edges.filter((e) => e.source === selectedNode) : [];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl">
      {/* Top Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Network Topology
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
            {data.nodes.length} Nodes • {data.edges.length} Edges
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Layout Selector */}
          <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => {
                setLayoutName('cose');
                if (cyRef.current) runLayout(cyRef.current, 'cose');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                layoutName === 'cose' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Force-Directed Layout (Physics-based spacing)"
            >
              Force
            </button>
            <button
              onClick={() => {
                setLayoutName('concentric');
                if (cyRef.current) runLayout(cyRef.current, 'concentric');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                layoutName === 'concentric' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Concentric Circles Layout (Hierarchy by Degree)"
            >
              Concentric
            </button>
            <button
              onClick={() => {
                setLayoutName('circle');
                if (cyRef.current) runLayout(cyRef.current, 'circle');
              }}
              className={`px-2 py-1 rounded transition-colors ${
                layoutName === 'circle' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Circular Ring Layout"
            >
              Circle
            </button>
          </div>

          {/* Zoom & Fit Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={handleFit}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded font-medium"
              title="Fit to Screen"
            >
              Fit
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Reset View & Layout"
            >
              Reset
            </button>
            <span className="px-2 py-1 text-slate-400 font-mono text-[11px] border-l border-slate-700">
              {currentZoom}%
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full min-h-[380px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {data.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="text-4xl mb-3">🕸️</div>
            <h4 className="text-base font-semibold text-slate-300 mb-1">Graph Canvas is Empty</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Add transactions in the right panel and click <strong>Build Graph</strong> or click <strong>Load Example</strong> to visualize accounts.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        )}

        {/* Floating Node Selection Hint */}
        {!selectedNode && data.nodes.length > 0 && (
          <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-950/85 backdrop-blur-sm border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <span className="text-blue-400">ℹ️</span>
            Click any account node to inspect transactions, run BFS, or start DFS
          </div>
        )}
      </div>

      {/* Node Legend Bar with Explicit Risk Thresholds */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 gap-3">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-300">Risk Levels:</span>
          <span className="flex items-center gap-1.5" title="Score < 12.0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300"></span>
            Normal (&lt; 12)
          </span>
          <span className="flex items-center gap-1.5" title="12.0 <= Score < 25.0">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300"></span>
            Medium (12–25)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-red-400" title={`Score >= ${RISK_THRESHOLDS.HIGH_SCORE}`}>
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300"></span>
            High Risk (≥ {RISK_THRESHOLDS.HIGH_SCORE})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300"></span>
            Selected
          </span>
        </div>

        {sccs.filter((s) => s.nodes.length >= 2).length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-red-400">Directed Fraud Rings:</span>
            {sccs
              .filter((s) => s.nodes.length >= 2)
              .map((scc, i) => (
                <span
                  key={scc.id}
                  className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow"
                  style={{ backgroundColor: scc.color }}
                  title={`Internal cycle volume: ₹${scc.totalAmount.toLocaleString()}`}
                >
                  Ring #{i + 1}: {scc.directedSequence}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Selected Account Inspector Drawer */}
      {selectedNodeData && (
        <div className="border-t border-blue-500/40 bg-slate-950/95 p-3.5 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Account {selectedNodeData.id}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedNodeData.risk === 'high'
                      ? 'bg-red-900/60 text-red-300 border border-red-600'
                      : selectedNodeData.risk === 'medium'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-600'
                      : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                  }`}
                >
                  {selectedNodeData.risk.toUpperCase()} RISK ({selectedNodeData.riskScore.toFixed(1)} pts)
                </span>
                {selectedNodeData.clusterSize >= 2 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                    SCC Ring Member (Size: {selectedNodeData.clusterSize})
                  </span>
                )}
              </h4>
            </div>
            <button
              onClick={() => onNodeSelect(null)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors"
              title="Deselect account"
            >
              ✕ Deselect
            </button>
          </div>

          {/* Mathematical score derivation */}
          <div className="mb-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-1">
            <span>
              <strong className="text-slate-400">Score Derivation:</strong> ({selectedNodeData.outDegree} Out × 2) + ({selectedNodeData.clusterSize} SCC Cluster × 3) + (₹{selectedNodeData.outAmount.toLocaleString()} / 1000) = <strong className="text-amber-400">{selectedNodeData.riskScore.toFixed(1)} pts</strong>
            </span>
            <span className="text-slate-500 text-[10px]">Threshold: High ≥ 25.0</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-slate-400">Outbound Flow</div>
              <div className="text-slate-200 font-mono font-semibold">
                {selectedNodeData.outDegree} txs • ₹{selectedNodeData.outAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-slate-400">Inbound Flow</div>
              <div className="text-slate-200 font-mono font-semibold">
                {selectedNodeData.inDegree} txs • ₹{selectedNodeData.inAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-slate-400">Total Volume</div>
              <div className="text-emerald-400 font-mono font-semibold">
                ₹{selectedNodeData.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-slate-400">Network Connections</div>
              <div className="text-cyan-400 font-mono font-semibold">
                {selectedNodeData.inDegree + selectedNodeData.outDegree} edges
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {/* Outgoing */}
            <div className="bg-slate-900/90 rounded p-2 border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                <span>Outgoing Transactions ({outgoingEdges.length})</span>
                <span className="text-slate-500 font-mono">→ Target</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {outgoingEdges.length === 0 ? (
                  <div className="text-slate-500 text-[11px] italic">No outgoing transfers</div>
                ) : (
                  outgoingEdges.map((e) => (
                    <div key={e.id} className="flex items-center justify-between bg-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                      <span className="font-mono text-slate-300">→ Account {e.target}</span>
                      <span className="font-mono text-emerald-400 font-semibold">₹{e.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Incoming */}
            <div className="bg-slate-900/90 rounded p-2 border border-slate-800">
              <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                <span>Incoming Transactions ({incomingEdges.length})</span>
                <span className="text-slate-500 font-mono">Source →</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {incomingEdges.length === 0 ? (
                  <div className="text-slate-500 text-[11px] italic">No incoming transfers</div>
                ) : (
                  incomingEdges.map((e) => (
                    <div key={e.id} className="flex items-center justify-between bg-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                      <span className="font-mono text-slate-300">Account {e.source} →</span>
                      <span className="font-mono text-cyan-400 font-semibold">₹{e.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
