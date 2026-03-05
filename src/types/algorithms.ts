export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'step' | 'highlight' | 'success' | 'error' | 'warning';
  message: string;
}

export interface AlgorithmState {
  isRunning: boolean;
  currentStep: number;
  visitedNodes: Set<string>;
  stack: string[];
  queue: string[];
  adjacencyList: Map<string, string[]>;
  riskScores: Map<string, number>;
  maxHeap: Array<{ id: string; score: number }>;
  logs: LogEntry[];
}

export interface SCC {
  nodes: string[];
  totalAmount: number;
  riskScore: number;
  color: string;
}

export interface BFSResult {
  traversalOrder: string[];
  levels: Map<string, number>;
  visitedNodes: Set<string>;
}
