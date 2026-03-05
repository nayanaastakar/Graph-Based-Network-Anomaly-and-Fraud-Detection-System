import React, { useEffect, useRef, useState } from 'react';
import { GraphData } from '../data/mockData';
import { SCC } from '../types/algorithms';

interface GraphVisualizationProps {
  data: GraphData;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  highlightedNodes: string[];
  sccs: SCC[];
}

const GraphVisualizationSimple: React.FC<GraphVisualizationProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  highlightedNodes,
  sccs
}) => {
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      // Validate data
      if (!data || !data.nodes || !data.edges) {
        setError('Invalid graph data');
        return;
      }
      
      if (data.nodes.length === 0) {
        setError('No nodes to display');
        return;
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load graph data');
    }
  }, [data]);

  const getNodeColor = (nodeId: string) => {
    // Check if node is highlighted
    if (highlightedNodes.includes(nodeId)) {
      return '#60a5fa'; // blue
    }
    
    // Check if node is in SCC
    for (const scc of sccs) {
      if (scc.nodes.includes(nodeId)) {
        return scc.color;
      }
    }
    
    // Check if node is selected
    if (nodeId === selectedNode) {
      return '#3b82f6'; // blue
    }
    
    // Default risk-based coloring
    const node = data.nodes.find(n => n.id === nodeId);
    if (node?.risk === 'high') return '#ef4444';
    if (node?.risk === 'medium') return '#f59e0b';
    return '#10b981';
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.5, zoomLevel * delta), 3);
    setZoomLevel(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPanOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800">
        <div className="text-center">
          <div className="text-red-400 mb-2">Graph Error</div>
          <div className="text-slate-300 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-900 rounded-lg p-4">
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-slate-300">Network Graph</h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-600">
              💡 Click any node to select it for BFS analysis
            </div>
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-600">
              <button 
                onClick={() => setZoomLevel(Math.min(3, zoomLevel * 1.2))}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                title="Zoom In"
              >
                🔍+
              </button>
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel * 0.8))}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                title="Zoom Out"
              >
                🔍-
              </button>
              <button 
                onClick={resetView}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                title="Reset View"
              >
                🔄
              </button>
              <span className="text-xs text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden rounded-lg border border-slate-700">
          <div 
            className="w-full h-full cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 600"
              className="border border-slate-700 rounded bg-slate-800"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                {/* Render edges */}
                {data.edges.map((edge, index) => {
                  const sourceNode = data.nodes.find(n => n.id === edge.source);
                  const targetNode = data.nodes.find(n => n.id === edge.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  // Simple positioning - arrange nodes in a circle
                  const sourceAngle = (data.nodes.indexOf(sourceNode) / data.nodes.length) * 2 * Math.PI;
                  const targetAngle = (data.nodes.indexOf(targetNode) / data.nodes.length) * 2 * Math.PI;
                  
                  const x1 = 400 + Math.cos(sourceAngle) * 200;
                  const y1 = 300 + Math.sin(sourceAngle) * 200;
                  const x2 = 400 + Math.cos(targetAngle) * 200;
                  const y2 = 300 + Math.sin(targetAngle) * 200;
                  
                  return (
                    <g key={`edge-${index}`}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#64748b"
                        strokeWidth={Math.max(2, Math.min(6, edge.amount / 5000))}
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2}
                        fill="#e2e8f0"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
                
                {/* Arrow marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#64748b"
                    />
                  </marker>
                </defs>
                
                {/* Render nodes */}
                {data.nodes.map((node, index) => {
                  const angle = (index / data.nodes.length) * 2 * Math.PI;
                  const x = 400 + Math.cos(angle) * 200;
                  const y = 300 + Math.sin(angle) * 200;
                  const color = getNodeColor(node.id);
                  const isSelected = node.id === selectedNode;
                  
                  return (
                    <g key={`node-${node.id}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 35 : 30}
                        fill={color}
                        stroke={isSelected ? '#60a5fa' : '#334155'}
                        strokeWidth={isSelected ? 4 : 2}
                        className="cursor-pointer hover:opacity-80 transition-all hover:stroke-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Node clicked:', node.id);
                          onNodeSelect(node.id === selectedNode ? null : node.id);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <text
                        x={x}
                        y={y}
                        fill="#ffffff"
                        fontSize="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {node.id}
                      </text>
                      <text
                        x={x}
                        y={y + (isSelected ? 45 : 40)}
                        fill="#e2e8f0"
                        fontSize="10"
                        textAnchor="middle"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {node.label}
                      </text>
                      {isSelected && (
                        <text
                          x={x}
                          y={y - 50}
                          fill="#60a5fa"
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                          style={{ userSelect: 'none' }}
                        >
                          SELECTED
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-300">Normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-slate-300">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-300">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-slate-300">Selected</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <span>🖱️ Drag to pan, 🔍 Scroll to zoom</span>
          </div>
        </div>
      </div>
      
      {selectedNode && (
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

export default GraphVisualizationSimple;
