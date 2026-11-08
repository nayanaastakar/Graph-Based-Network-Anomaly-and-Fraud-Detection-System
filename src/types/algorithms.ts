export type AlgorithmStatus = 'Not Started' | 'Ready' | 'Running' | 'Paused' | 'Completed' | 'Failed';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'step' | 'highlight' | 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface NodeData {
  id: string;
  label: string;
  risk: 'normal' | 'medium' | 'high';
  riskScore: number;
  clusterSize: number;
  outDegree: number;
  inDegree: number;
  outAmount: number;
  inAmount: number;
  totalAmount: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  amount: number;
  label: string;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface RawTransaction {
  source: string;
  target: string;
  amount: number;
}

export interface SCC {
  id: string;
  nodes: string[];
  totalAmount: number;
  riskScore: number;
  riskFormulaExplanation: string;
  color: string;
  cycleEdges: Array<{ source: string; target: string; amount: number }>;
  directedSequence: string; // e.g. "A2 → A3 → A4 → A2"
  directedPath: string[];   // e.g. ["A2", "A3", "A4", "A2"]
}

export interface BFSStep {
  step: number;
  currentNode: string | null;
  queue: string[];
  visited: string[];
  currentEdge?: { source: string; target: string };
  description: string;
  level: number;
}

export interface BFSResult {
  startNode: string;
  traversalOrder: string[];
  levels: Map<string, number>;
  visitedNodes: Set<string>;
  steps: BFSStep[];
}

export interface DFSStep {
  step: number;
  currentNode: string | null;
  stack: string[];
  visited: string[];
  currentEdge?: { source: string; target: string };
  action: 'push' | 'pop' | 'visit' | 'backtrack' | 'start' | 'end';
  description: string;
}

export interface DFSResult {
  startNode: string;
  traversalOrder: string[];
  visitedNodes: Set<string>;
  steps: DFSStep[];
}

export interface HeapItem {
  id: string;
  score: number;
  outDegree: number;
  totalAmount: number;
}

export interface AnomalyPattern {
  id: string;
  type: 'Star Pattern' | 'Rapid Aggregation' | 'High-Value Flow' | 'Circular Flow (SCC)' | 'High-Risk Account';
  category: 'Scanner' | 'SCC';
  nodes: string[];
  edges?: Array<{ source: string; target: string; amount: number }>;
  description: string;
  severity: 'low' | 'medium' | 'high';
  riskSignal: string;
}

export interface AlgorithmState {
  isRunning: boolean;
  currentStep: number;
  visitedNodes: Set<string>;
  stack: string[];
  queue: string[];
  adjacencyList: Map<string, Array<{ target: string; amount: number }>>;
  riskScores: Map<string, number>;
  maxHeap: HeapItem[];
  heapArray: HeapItem[];
  logs: LogEntry[];
}
