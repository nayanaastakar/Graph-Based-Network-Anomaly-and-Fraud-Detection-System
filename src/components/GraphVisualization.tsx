import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import { GraphData, getCytoscapeElements } from '../data/mockData';
import { SCC } from '../types/algorithms';

interface GraphVisualizationProps {
  data: GraphData;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  highlightedNodes: string[];
  sccs: SCC[];
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  highlightedNodes,
  sccs
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeCytoscapeOperation = useCallback((operation: () => void) => {
    if (cyRef.current && isInitialized && isReady && !error) {
      try {
        operation();
      } catch (err) {
        console.warn('Cytoscape operation failed:', err);
        setError('Graph operation failed');
      }
    }
  }, [isInitialized, isReady, error]);

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const initializeCytoscape = () => {
      if (!containerRef.current) return;

      try {
        // Ensure container has dimensions
        const container = containerRef.current;
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          setTimeout(initializeCytoscape, 100);
          return;
        }

        const elements = getCytoscapeElements(data);
        
        // Check if we have valid elements
        if (!elements || elements.length === 0) {
          console.warn('No valid elements to render');
          setError('No data to display');
          return;
        }
        
        // Simplified initialization to avoid renderer issues
        const cy = cytoscape({
          container: container,
          elements,
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#10b981',
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'color': '#ffffff',
                'text-outline-color': '#000000',
                'text-outline-width': 2,
                'width': 60,
                'height': 60,
                'font-size': '12px',
                'border-width': 2,
                'border-color': '#334155',
                'overlay-opacity': 0
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 3,
                'line-color': '#64748b',
                'target-arrow-color': '#64748b',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '10px',
                'color': '#e2e8f0',
                'text-rotation': 'autorotate',
                'text-margin-y': -10
              }
            },
            {
              selector: 'node.highlighted',
              style: {
                'background-color': '#60a5fa',
                'border-width': 4,
                'border-color': '#3b82f6',
                'width': 70,
                'height': 70,
                'overlay-color': '#3b82f6',
                'overlay-padding': 10,
                'overlay-opacity': 0.3
              }
            }
          ],
          layout: {
            name: 'preset', // Use preset layout initially to avoid issues
            fit: true,
            padding: 50
          }
        });

        // Apply COSE layout after initialization
        setTimeout(() => {
          if (cy && cy.nodes().length > 0) {
            cy.layout({
              name: 'cose',
              idealEdgeLength: 100,
              nodeOverlap: 20,
              refresh: 20,
              fit: true,
              padding: 30,
              randomize: false,
              componentSpacing: 100,
              nodeRepulsion: 400000,
              edgeElasticity: 100,
              nestingFactor: 5,
              gravity: 80,
              numIter: 1000,
              initialTemp: 200,
              coolingFactor: 0.95,
              minTemp: 1.0
            }).run();
          }
        }, 100);

        // Event handlers with safety checks
        const handleNodeTap = (event: any) => {
          try {
            const node = event.target;
            if (node && node.id) {
              onNodeSelect(node.id());
            }
          } catch (err) {
            console.warn('Node tap error:', err);
          }
        };

        const handleBackgroundTap = (event: any) => {
          try {
            if (event.target === cy) {
              onNodeSelect(null);
            }
          } catch (err) {
            console.warn('Background tap error:', err);
          }
        };

        cy.on('tap', 'node', handleNodeTap);
        cy.on('tap', handleBackgroundTap);

        cyRef.current = cy;
        setIsInitialized(true);
        
        // Set ready after layout completion
        setTimeout(() => {
          if (cy && cy.nodes().length > 0) {
            setIsReady(true);
            setError(null);
          } else {
            setError('Graph renderer failed to initialize');
          }
        }, 500);
        
      } catch (error) {
        console.error('Error initializing Cytoscape:', error);
        setError('Failed to initialize graph');
        setIsInitialized(true);
        setIsReady(true);
      }
    };

    // Delayed initialization with multiple retries
    let retryCount = 0;
    const tryInitialize = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        initializeCytoscape();
      } else if (retryCount < 10) {
        retryCount++;
        setTimeout(tryInitialize, 100 * retryCount);
      } else {
        setError('Failed to load graph container');
        setIsReady(true);
      }
    };

    tryInitialize();

    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.removeAllListeners();
          cyRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying Cytoscape:', error);
        }
        cyRef.current = null;
        setIsInitialized(false);
        setIsReady(false);
      }
    };
  }, [data, onNodeSelect]);

  // Simplified update functions with safety checks
  useEffect(() => {
    if (!isReady || error) return;
    
    safeCytoscapeOperation(() => {
      if (!cyRef.current) return;
      
      try {
        cyRef.current.nodes().forEach((node) => {
          const nodeId = node.id();
          const isSelected = nodeId === selectedNode;
          node.style({
            'border-width': isSelected ? 4 : 2,
            'border-color': isSelected ? '#60a5fa' : '#334155'
          });
        });
      } catch (err) {
        console.warn('Node selection update failed:', err);
      }
    });
  }, [selectedNode, isReady, error, safeCytoscapeOperation]);

  useEffect(() => {
    if (!isReady || error) return;
    
    safeCytoscapeOperation(() => {
      if (!cyRef.current) return;

      try {
        // Clear all highlights first
        cyRef.current.nodes().removeClass('highlighted');
        
        // Apply highlights
        highlightedNodes.forEach(nodeId => {
          const node = cyRef.current!.$id(nodeId);
          if (node.length > 0) {
            node.addClass('highlighted');
          }
        });

        // Apply SCC colors
        sccs.forEach((scc) => {
          scc.nodes.forEach(nodeId => {
            const node = cyRef.current!.$id(nodeId);
            if (node.length > 0) {
              node.style({
                'background-color': scc.color,
                'border-color': scc.color,
                'border-width': 3
              });
            }
          });
        });
      } catch (err) {
        console.warn('Highlight update failed:', err);
      }
    });
  }, [highlightedNodes, sccs, isReady, error, safeCytoscapeOperation]);

  return (
    <div className="w-full h-full relative">
      <div 
        ref={containerRef} 
        id="cy" 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '400px',
          position: 'relative',
          backgroundColor: '#1e293b'
        }}
      />
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-75">
          <div className="text-slate-300">Loading graph visualization...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90">
          <div className="text-center">
            <div className="text-red-400 mb-2">Graph Error</div>
            <div className="text-slate-300 text-sm">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      {selectedNode && isReady && !error && (
        <div className="absolute top-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
          <div className="font-bold text-blue-400">Selected: {selectedNode}</div>
          <div className="text-gray-300">
            {data.nodes.find(n => n.id === selectedNode)?.label}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
