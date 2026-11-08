import {
  GraphData,
  NodeData,
  EdgeData,
  RawTransaction,
  SCC,
  BFSResult,
  BFSStep,
  DFSResult,
  DFSStep,
  HeapItem,
  AnomalyPattern,
  LogEntry
} from '../types/algorithms';

/**
 * Explicit Risk Classification Thresholds
 * Documented and enforced across the entire system.
 */
export const RISK_THRESHOLDS = {
  HIGH_SCORE: 25.0,     // Accounts with Risk Score >= 25.0 are classified as HIGH RISK
  MEDIUM_SCORE: 12.0,   // Accounts with 12.0 <= Risk Score < 25.0 are MEDIUM RISK
  HIGH_TX_AMOUNT: 15000,// Single transfer >= $15,000 is high-value monitoring
  HIGH_OUT_DEGREE: 3,   // Out-degree >= 3 indicates a disbursement hub (Star pattern)
  HIGH_IN_DEGREE: 3     // In-degree >= 3 indicates a concentration funnel
} as const;

/**
 * Binary Max-Heap Data Structure
 * Strictly maintains max-heap property: parent >= children.
 */
export class MaxHeap {
  private heap: HeapItem[] = [];

  constructor(items?: HeapItem[]) {
    if (items && items.length > 0) {
      this.buildHeap(items);
    }
  }

  public getArray(): HeapItem[] {
    return [...this.heap];
  }

  public size(): number {
    return this.heap.length;
  }

  public peek(): HeapItem | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public insert(item: HeapItem): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  public extractMax(): HeapItem | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.siftDown(0);
    return max;
  }

  public buildHeap(items: HeapItem[]): void {
    this.heap = [...items];
    const n = this.heap.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.siftDown(i);
    }
  }

  public getTopK(k: number): HeapItem[] {
    const copy = new MaxHeap(this.heap);
    const result: HeapItem[] = [];
    for (let i = 0; i < k && copy.size() > 0; i++) {
      const item = copy.extractMax();
      if (item) result.push(item);
    }
    return result;
  }

  private compare(a: HeapItem, b: HeapItem): number {
    if (a.score !== b.score) {
      return a.score - b.score; // higher score has priority
    }
    // Tie-break alphabetically on ID for deterministic ordering
    return b.id.localeCompare(a.id);
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.heap[current], this.heap[parent]) > 0) {
        [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const n = this.heap.length;

    while (current < n) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let largest = current;

      if (left < n && this.compare(this.heap[left], this.heap[largest]) > 0) {
        largest = left;
      }
      if (right < n && this.compare(this.heap[right], this.heap[largest]) > 0) {
        largest = right;
      }

      if (largest !== current) {
        [this.heap[current], this.heap[largest]] = [this.heap[largest], this.heap[current]];
        current = largest;
      } else {
        break;
      }
    }
  }
}

/**
 * Reconstructs the exact directed circular sequence for a strongly connected component.
 * e.g., for nodes {A2, A3, A4} with edges A2->A3, A3->A4, A4->A2
 * returns { sequence: "A2 → A3 → A4 → A2", path: ["A2", "A3", "A4", "A2"] }
 */
export const reconstructDirectedCycle = (
  nodes: string[],
  internalEdges: Array<{ source: string; target: string; amount: number }>
): { sequence: string; path: string[] } => {
  if (nodes.length < 2 || internalEdges.length === 0) {
    return { sequence: nodes.join(', '), path: [...nodes] };
  }

  // Build adjacency map of internal edges
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n, []));
  internalEdges.forEach((e) => {
    const list = adj.get(e.source) || [];
    list.push(e.target);
    adj.set(e.source, list);
  });

  // Pick canonical start node (lexicographically smallest node ID)
  const sortedNodes = [...nodes].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  const startNode = sortedNodes[0];

  // Follow directed edges to reconstruct the cycle
  const path: string[] = [startNode];
  const visitedInWalk = new Set<string>();
  let curr = startNode;

  while (path.length <= nodes.length + 1) {
    visitedInWalk.add(curr);
    const neighbors = adj.get(curr) || [];
    // Prioritize neighbor that closes the cycle back to startNode if all nodes visited
    let nextNode: string | undefined;
    if (path.length >= nodes.length && neighbors.includes(startNode)) {
      nextNode = startNode;
    } else {
      nextNode = neighbors.find((nbr) => !visitedInWalk.has(nbr)) || neighbors[0];
    }

    if (!nextNode) break;
    path.push(nextNode);
    if (nextNode === startNode && path.length > 2) {
      break; // Cycle closed
    }
    curr = nextNode;
  }

  // If path successfully loops back to startNode
  if (path[path.length - 1] === startNode && path.length > 2) {
    return {
      sequence: path.join(' → '),
      path
    };
  }

  // Fallback if not a single simple cycle: sort nodes canonically
  const fallbackPath = [...sortedNodes, sortedNodes[0]];
  return {
    sequence: fallbackPath.join(' → '),
    path: fallbackPath
  };
};

/**
 * Synchronous 2-Pass Kosaraju SCC size evaluator for exact clusterSize metric.
 * Time Complexity: O(V + E)
 */
export const computeSCCSizesSync = (
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>
): Map<string, number> => {
  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();

  nodeIds.forEach((id) => {
    adj.set(id, []);
    revAdj.set(id, []);
  });

  edges.forEach((e) => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      revAdj.get(e.target)!.push(e.source);
    }
  });

  // Pass 1: Forward DFS to record finish stack
  const visitedPass1 = new Set<string>();
  const finishStack: string[] = [];

  const dfsPass1 = (u: string) => {
    visitedPass1.add(u);
    for (const v of adj.get(u) || []) {
      if (!visitedPass1.has(v)) {
        dfsPass1(v);
      }
    }
    finishStack.push(u);
  };

  nodeIds.forEach((id) => {
    if (!visitedPass1.has(id)) {
      dfsPass1(id);
    }
  });

  // Pass 2: Reverse DFS on transposed graph
  const visitedPass2 = new Set<string>();
  const sizeMap = new Map<string, number>();

  const dfsPass2 = (u: string, comp: string[]) => {
    visitedPass2.add(u);
    comp.push(u);
    for (const v of revAdj.get(u) || []) {
      if (!visitedPass2.has(v)) {
        dfsPass2(v, comp);
      }
    }
  };

  while (finishStack.length > 0) {
    const root = finishStack.pop()!;
    if (!visitedPass2.has(root)) {
      const comp: string[] = [];
      dfsPass2(root, comp);
      const size = comp.length;
      comp.forEach((node) => sizeMap.set(node, size));
    }
  }

  return sizeMap;
};

/**
 * Creates validated GraphData from raw transaction edges.
 * Applies the documented Risk Score Formula and classification thresholds.
 */
export const buildGraphFromTransactions = (transactions: RawTransaction[]): GraphData => {
  const nodeSet = new Set<string>();
  const outDegreeMap = new Map<string, number>();
  const inDegreeMap = new Map<string, number>();
  const outAmountMap = new Map<string, number>();
  const inAmountMap = new Map<string, number>();

  transactions.forEach((tx) => {
    const s = tx.source.trim();
    const t = tx.target.trim();
    if (!s || !t) return;

    nodeSet.add(s);
    nodeSet.add(t);

    outDegreeMap.set(s, (outDegreeMap.get(s) || 0) + 1);
    inDegreeMap.set(t, (inDegreeMap.get(t) || 0) + 1);
    outAmountMap.set(s, (outAmountMap.get(s) || 0) + tx.amount);
    inAmountMap.set(t, (inAmountMap.get(t) || 0) + tx.amount);
  });

  const sortedNodeIds = Array.from(nodeSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const validEdges = transactions
    .filter((tx) => tx.source.trim() && tx.target.trim())
    .map((tx) => ({ source: tx.source.trim(), target: tx.target.trim() }));

  const sccSizes = computeSCCSizesSync(sortedNodeIds, validEdges);

  const nodes: NodeData[] = sortedNodeIds.map((id) => {
    const outDegree = outDegreeMap.get(id) || 0;
    const inDegree = inDegreeMap.get(id) || 0;
    const outAmount = outAmountMap.get(id) || 0;
    const inAmount = inAmountMap.get(id) || 0;
    const totalAmount = outAmount + inAmount;

    // ClusterSize is the size of the Strongly Connected Component (SCC) to which the account belongs.
    // E.g., for members of {A2, A3, A4}, clusterSize = 3. For singletons, clusterSize = 1.
    const clusterSize = sccSizes.get(id) || 1;

    // Formula: (OutDegree * 2) + (ClusterSize * 3) + (OutAmount / 1000)
    const score = Math.round((outDegree * 2 + clusterSize * 3 + outAmount / 1000) * 100) / 100;

    let risk: 'normal' | 'medium' | 'high' = 'normal';
    if (score >= RISK_THRESHOLDS.HIGH_SCORE) {
      risk = 'high';
    } else if (score >= RISK_THRESHOLDS.MEDIUM_SCORE) {
      risk = 'medium';
    }

    return {
      id,
      label: `Account ${id}`,
      risk,
      riskScore: score,
      clusterSize,
      outDegree,
      inDegree,
      outAmount,
      inAmount,
      totalAmount
    };
  });

  const edges: EdgeData[] = transactions
    .filter((tx) => tx.source.trim() && tx.target.trim())
    .map((tx, idx) => ({
      id: `e${idx + 1}`,
      source: tx.source.trim(),
      target: tx.target.trim(),
      amount: tx.amount,
      label: `₹${tx.amount.toLocaleString()}`
    }));

  return { nodes, edges };
};

/**
 * Canonical default dataset:
 * 16 accounts (A1-A14, D, E), 17 directed transactions, ₹138,500 total volume.
 * Contains:
 * - 1 multi-node SCC / fraud ring: A2 -> A3 -> A4 -> A2 (₹45,000 cycle volume)
 * - 13 singleton SCCs
 * - Exactly 5 High-Risk accounts (Score >= 25.0): A1, A2, A3, A4, A7
 */
export const DEFAULT_TRANSACTIONS: RawTransaction[] = [
  { source: 'A2', target: 'A3', amount: 15000 },
  { source: 'A3', target: 'A4', amount: 12000 },
  { source: 'A4', target: 'A2', amount: 18000 },
  { source: 'A2', target: 'A5', amount: 8000 },
  { source: 'A3', target: 'A1', amount: 10000 },
  { source: 'A4', target: 'A7', amount: 7000 },
  { source: 'A1', target: 'A6', amount: 8000 },
  { source: 'A1', target: 'A8', amount: 5000 },
  { source: 'A5', target: 'A9', amount: 5000 },
  { source: 'A7', target: 'A10', amount: 11000 },
  { source: 'A7', target: 'A11', amount: 7000 },
  { source: 'A8', target: 'A12', amount: 9000 },
  { source: 'A10', target: 'A13', amount: 8000 },
  { source: 'A13', target: 'A14', amount: 6000 },
  { source: 'A1', target: 'A10', amount: 3000 },
  { source: 'A5', target: 'A13', amount: 4000 },
  { source: 'D', target: 'E', amount: 2500 }
];

/**
 * Core Graph Algorithms Engine
 */
export class GraphAlgorithms {
  private data: GraphData;
  private adjacencyList: Map<string, Array<{ target: string; amount: number }>>;
  private reverseAdjacencyList: Map<string, Array<{ source: string; amount: number }>>;

  constructor(data: GraphData) {
    this.data = data;
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.buildAdjacencyLists();
  }

  private buildAdjacencyLists(): void {
    this.data.nodes.forEach((node) => {
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    this.data.edges.forEach((edge) => {
      const fwd = this.adjacencyList.get(edge.source) || [];
      fwd.push({ target: edge.target, amount: edge.amount });
      this.adjacencyList.set(edge.source, fwd);

      const rev = this.reverseAdjacencyList.get(edge.target) || [];
      rev.push({ source: edge.source, amount: edge.amount });
      this.reverseAdjacencyList.set(edge.target, rev);
    });
  }

  public getAdjacencyList(): Map<string, Array<{ target: string; amount: number }>> {
    return new Map(this.adjacencyList);
  }

  public getReverseAdjacencyList(): Map<string, Array<{ source: string; amount: number }>> {
    return new Map(this.reverseAdjacencyList);
  }

  /**
   * Risk Score Formula:
   * Score = (OutDegree * 2) + (ClusterSize * 3) + (OutAmount / 1000)
   * Where ClusterSize is the size of the node's Strongly Connected Component (SCC).
   */
  public calculateRiskScore(nodeId: string, clusterSize?: number): number {
    const node = this.data.nodes.find((n) => n.id === nodeId);
    if (!node) return 0;
    const effectiveClusterSize = clusterSize !== undefined ? clusterSize : (node.clusterSize || 1);
    const score = node.outDegree * 2 + effectiveClusterSize * 3 + node.outAmount / 1000;
    return Math.round(score * 100) / 100;
  }

  public calculateAllRiskScores(clusterMap?: Map<string, number>): Map<string, number> {
    const scores = new Map<string, number>();
    this.data.nodes.forEach((node) => {
      const clusterSize = clusterMap?.get(node.id) || node.clusterSize || 1;
      scores.set(node.id, this.calculateRiskScore(node.id, clusterSize));
    });
    return scores;
  }

  public buildMaxHeap(riskScores: Map<string, number>): MaxHeap {
    const items: HeapItem[] = [];
    this.data.nodes.forEach((node) => {
      const score = riskScores.get(node.id) || 0;
      items.push({
        id: node.id,
        score,
        outDegree: node.outDegree,
        totalAmount: node.totalAmount
      });
    });
    return new MaxHeap(items);
  }

  /**
   * Kosaraju's 2-Pass Algorithm for Strongly Connected Components (SCC)
   * Complexity: Time O(V + E), Space O(V + E)
   */
  public async kosarajuSCC(
    onLog?: (log: LogEntry) => void,
    onStackUpdate?: (stack: string[]) => void,
    onHighlight?: (nodes: string[]) => void
  ): Promise<SCC[]> {
    const visited = new Set<string>();
    const finishStack: string[] = [];
    const sccs: SCC[] = [];

    onLog?.({
      id: `scc-start-${Date.now()}`,
      timestamp: new Date(),
      type: 'step',
      message: "Initiating Kosaraju's Algorithm for Strongly Connected Components (SCC)."
    });

    onLog?.({
      id: `scc-p1-${Date.now()}`,
      timestamp: new Date(),
      type: 'step',
      message: 'Pass 1: Forward DFS traversal on G to record node finishing order onto stack.'
    });

    // Pass 1: DFS on original graph
    for (const node of this.data.nodes) {
      if (!visited.has(node.id)) {
        await this.dfsFillFinishStack(node.id, visited, finishStack, onLog, onStackUpdate, onHighlight);
      }
    }

    onLog?.({
      id: `scc-p1-done-${Date.now()}`,
      timestamp: new Date(),
      type: 'success',
      message: `Pass 1 complete. Stack ordered with ${finishStack.length} vertices by finishing times.`
    });

    // Pass 2: DFS on transposed graph
    onLog?.({
      id: `scc-p2-${Date.now()}`,
      timestamp: new Date(),
      type: 'step',
      message: 'Pass 2: Transposing graph (G^T) and popping stack to isolate strongly connected components.'
    });

    const visitedPass2 = new Set<string>();
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];
    let colorIndex = 0;

    while (finishStack.length > 0) {
      const root = finishStack.pop()!;
      onStackUpdate?.([...finishStack]);

      if (!visitedPass2.has(root)) {
        const component: string[] = [];
        await this.dfsTransposed(root, visitedPass2, component, onLog, onHighlight);

        // Identify internal directed edges strictly within component
        const cycleEdges = this.data.edges
          .filter((e) => component.includes(e.source) && component.includes(e.target))
          .map((e) => ({ source: e.source, target: e.target, amount: e.amount }));

        const totalAmount = cycleEdges.reduce((sum, e) => sum + e.amount, 0);

        // Ring Risk Score Formula: (Cycle Amount / 1000) + (Nodes * 5)
        // Mathematically justified: Monetary exposure per thousand + multi-hop layering complexity penalty
        const riskScore = component.length >= 2 ? Math.round((totalAmount / 1000 + component.length * 5) * 100) / 100 : 0;
        const formulaExplanation =
          component.length >= 2
            ? `(₹${totalAmount.toLocaleString()} / 1000) + (${component.length} accounts × 5) = ${riskScore.toFixed(1)} pts`
            : 'Singleton SCC (acyclic node)';

        // Reconstruct directed cycle sequence (e.g. A2 → A3 → A4 → A2)
        const { sequence, path } = reconstructDirectedCycle(component, cycleEdges);

        const sccObj: SCC = {
          id: `scc-${colorIndex + 1}`,
          nodes: component,
          totalAmount,
          riskScore,
          riskFormulaExplanation: formulaExplanation,
          color: colors[colorIndex % colors.length],
          cycleEdges,
          directedSequence: sequence,
          directedPath: path
        };

        sccs.push(sccObj);

        if (component.length >= 2) {
          onLog?.({
            id: `scc-found-${colorIndex}`,
            timestamp: new Date(),
            type: 'highlight',
            message: `⚠️ Fraud Ring Detected: ${sequence} | Cycle Volume: ₹${totalAmount.toLocaleString()} | Risk Score: ${riskScore.toFixed(1)} [Formula: ${formulaExplanation}]`
          });
        }
        colorIndex++;
      }
    }

    const multiNodeSccs = sccs.filter((s) => s.nodes.length >= 2);
    onLog?.({
      id: `scc-summary-${Date.now()}`,
      timestamp: new Date(),
      type: 'success',
      message: `Kosaraju SCC Complete. Found ${sccs.length} total SCC components (${multiNodeSccs.length} multi-node cyclic rings, ${sccs.length - multiNodeSccs.length} singletons).`
    });

    return sccs;
  }

  private async dfsFillFinishStack(
    nodeId: string,
    visited: Set<string>,
    stack: string[],
    onLog?: (log: LogEntry) => void,
    onStackUpdate?: (stack: string[]) => void,
    onHighlight?: (nodes: string[]) => void
  ): Promise<void> {
    visited.add(nodeId);
    onHighlight?.([nodeId]);

    const neighbors = this.adjacencyList.get(nodeId) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.target)) {
        await this.dfsFillFinishStack(edge.target, visited, stack, onLog, onStackUpdate, onHighlight);
      }
    }

    stack.push(nodeId);
    onStackUpdate?.([...stack]);
  }

  private async dfsTransposed(
    nodeId: string,
    visited: Set<string>,
    component: string[],
    onLog?: (log: LogEntry) => void,
    onHighlight?: (nodes: string[]) => void
  ): Promise<void> {
    visited.add(nodeId);
    component.push(nodeId);
    onHighlight?.([...component]);

    const revNeighbors = this.reverseAdjacencyList.get(nodeId) || [];
    for (const edge of revNeighbors) {
      if (!visited.has(edge.source)) {
        await this.dfsTransposed(edge.source, visited, component, onLog, onHighlight);
      }
    }
  }

  /**
   * Breadth-First Search (BFS) Traversal
   * Generates step-by-step history with queue and level tracking.
   * Complexity: Time O(V + E), Space O(V)
   */
  public generateBFSSteps(startNode: string): BFSResult {
    const visited = new Set<string>();
    const queue: string[] = [startNode];
    const traversalOrder: string[] = [];
    const levels = new Map<string, number>();
    const steps: BFSStep[] = [];

    levels.set(startNode, 0);
    visited.add(startNode);

    // Initial step
    steps.push({
      step: 0,
      currentNode: startNode,
      queue: [...queue],
      visited: Array.from(visited),
      description: `Initialized BFS with source vertex ${startNode} at Level 0.`,
      level: 0
    });

    let stepIndex = 1;

    while (queue.length > 0) {
      const current = queue.shift()!;
      traversalOrder.push(current);
      const currentLevel = levels.get(current) || 0;

      steps.push({
        step: stepIndex++,
        currentNode: current,
        queue: [...queue],
        visited: [...traversalOrder],
        description: `Dequeued ${current} from Queue. Visiting vertex at Level ${currentLevel}.`,
        level: currentLevel
      });

      const neighbors = this.adjacencyList.get(current) || [];
      for (const nbr of neighbors) {
        if (!visited.has(nbr.target)) {
          visited.add(nbr.target);
          levels.set(nbr.target, currentLevel + 1);
          queue.push(nbr.target);

          steps.push({
            step: stepIndex++,
            currentNode: current,
            currentEdge: { source: current, target: nbr.target },
            queue: [...queue],
            visited: [...traversalOrder],
            description: `Discovered unvisited neighbor ${nbr.target} via edge (${current} → ${nbr.target}). Enqueued at Level ${currentLevel + 1}.`,
            level: currentLevel + 1
          });
        }
      }
    }

    // Final step
    steps.push({
      step: stepIndex,
      currentNode: null,
      queue: [],
      visited: [...traversalOrder],
      description: `BFS completed. Traversed ${traversalOrder.length} reachable vertices. Queue is now empty.`,
      level: Math.max(0, ...Array.from(levels.values()))
    });

    return {
      startNode,
      traversalOrder,
      levels,
      visitedNodes: visited,
      steps
    };
  }

  /**
   * Depth-First Search (DFS) Traversal with Explicit Stack State
   * Complexity: Time O(V + E), Space O(V)
   */
  public generateDFSSteps(startNode: string): DFSResult {
    const visited = new Set<string>();
    const stack: string[] = [startNode];
    const traversalOrder: string[] = [];
    const steps: DFSStep[] = [];

    steps.push({
      step: 0,
      currentNode: startNode,
      stack: [...stack],
      visited: [],
      action: 'start',
      description: `Started DFS traversal from starting vertex ${startNode}. Stack initialized with [${startNode}].`
    });

    let stepIndex = 1;

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (!visited.has(current)) {
        visited.add(current);
        traversalOrder.push(current);

        steps.push({
          step: stepIndex++,
          currentNode: current,
          stack: [...stack],
          visited: [...traversalOrder],
          action: 'visit',
          description: `Popped ${current} from Stack. Marked as visited (${traversalOrder.length}/${this.data.nodes.length}).`
        });

        const neighbors = this.adjacencyList.get(current) || [];
        // Push in reverse to maintain left-to-right processing order
        for (let i = neighbors.length - 1; i >= 0; i--) {
          const nbr = neighbors[i];
          if (!visited.has(nbr.target)) {
            stack.push(nbr.target);
            steps.push({
              step: stepIndex++,
              currentNode: current,
              currentEdge: { source: current, target: nbr.target },
              stack: [...stack],
              visited: [...traversalOrder],
              action: 'push',
              description: `Pushed unvisited neighbor ${nbr.target} onto Stack from ${current}.`
            });
          }
        }
      }
    }

    steps.push({
      step: stepIndex,
      currentNode: null,
      stack: [],
      visited: [...traversalOrder],
      action: 'end',
      description: `DFS finished. Visited ${traversalOrder.length} reachable vertices. Stack is empty.`
    });

    return {
      startNode,
      traversalOrder,
      visitedNodes: visited,
      steps
    };
  }

  /**
   * Fraud Ring & Suspicious Cycle Detection
   */
  public detectFraudRings(sccs: SCC[]): SCC[] {
    return sccs.filter((scc) => scc.nodes.length >= 2);
  }

  /**
   * Graph-Based Anomaly Detection (Structural Scanner)
   * Evaluates network indicators: hubs, disbursement stars, high single transfers.
   * Distinct from SCC-based fraud rings to prevent double counting.
   */
  public detectAnomalies(): AnomalyPattern[] {
    const patterns: AnomalyPattern[] = [];
    let patternId = 1;

    // 1. High Fan-out Disbursement Hubs (Star pattern: out-degree >= 3)
    this.data.nodes.forEach((node) => {
      if (node.outDegree >= RISK_THRESHOLDS.HIGH_OUT_DEGREE) {
        patterns.push({
          id: `anomaly-${patternId++}`,
          type: 'Star Pattern',
          category: 'Scanner',
          nodes: [node.id],
          description: `Account ${node.id} distributes funds across ${node.outDegree} distinct accounts (Total sent: ₹${node.outAmount.toLocaleString()}).`,
          severity: node.outDegree >= 4 ? 'high' : 'medium',
          riskSignal: 'Potential Disbursement Hub / Fan-out Structuring'
        });
      }
    });

    // 2. High Fan-in Concentration Hubs (Aggregators: in-degree >= 3)
    this.data.nodes.forEach((node) => {
      if (node.inDegree >= RISK_THRESHOLDS.HIGH_IN_DEGREE) {
        patterns.push({
          id: `anomaly-${patternId++}`,
          type: 'Rapid Aggregation',
          category: 'Scanner',
          nodes: [node.id],
          description: `Account ${node.id} aggregates funds from ${node.inDegree} distinct accounts (Total received: ₹${node.inAmount.toLocaleString()}).`,
          severity: node.inDegree >= 4 ? 'high' : 'medium',
          riskSignal: 'Potential Concentration / Funnel Account'
        });
      }
    });

    // 3. High-Value Single Transfers (>= ₹15,000)
    const highValueEdges = this.data.edges.filter((e) => e.amount >= RISK_THRESHOLDS.HIGH_TX_AMOUNT);
    highValueEdges.forEach((edge) => {
      patterns.push({
        id: `anomaly-${patternId++}`,
        type: 'High-Value Flow',
        category: 'Scanner',
        nodes: [edge.source, edge.target],
        edges: [edge],
        description: `High-value single transfer of ₹${edge.amount.toLocaleString()} from ${edge.source} to ${edge.target}.`,
        severity: edge.amount >= 18000 ? 'high' : 'medium',
        riskSignal: 'Exceeds High-Value Transaction Threshold (₹15,000)'
      });
    });

    return patterns;
  }
}
