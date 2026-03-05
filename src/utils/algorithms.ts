import { GraphData } from '../data/mockData';
import { SCC, BFSResult, LogEntry } from '../types/algorithms';

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

  private buildAdjacencyLists() {
    // Initialize adjacency lists
    this.data.nodes.forEach(node => {
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    // Build adjacency lists
    this.data.edges.forEach(edge => {
      const forwardList = this.adjacencyList.get(edge.source) || [];
      forwardList.push({ target: edge.target, amount: edge.amount });
      this.adjacencyList.set(edge.source, forwardList);

      const reverseList = this.reverseAdjacencyList.get(edge.target) || [];
      reverseList.push({ source: edge.source, amount: edge.amount });
      this.reverseAdjacencyList.set(edge.target, reverseList);
    });
  }

  calculateRiskScore(nodeId: string, clusterSize: number = 1): number {
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    const score = (node.outDegree * 2) + (clusterSize * 3) + (node.totalAmount / 1000);
    return Math.round(score * 100) / 100;
  }

  calculateAllRiskScores(): Map<string, number> {
    const riskScores = new Map<string, number>();
    this.data.nodes.forEach(node => {
      riskScores.set(node.id, this.calculateRiskScore(node.id));
    });
    return riskScores;
  }

  getMaxHeap(riskScores: Map<string, number>): Array<{ id: string; score: number }> {
    const heap = Array.from(riskScores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return heap;
  }

  async kosarajuSCC(
    onLog: (log: LogEntry) => void,
    onStackUpdate: (stack: string[]) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<SCC[]> {
    const visited = new Set<string>();
    const stack: string[] = [];
    const sccs: SCC[] = [];

    onLog({
      id: '1',
      timestamp: new Date(),
      type: 'step',
      message: 'Starting Kosaraju\'s Algorithm for Strongly Connected Components'
    });

    // Step 1: First DFS to fill stack
    onLog({
      id: '2',
      timestamp: new Date(),
      type: 'step',
      message: 'Step 1: First DFS traversal to fill stack'
    });

    for (const node of this.data.nodes) {
      if (!visited.has(node.id)) {
        await this.dfsFillStack(node.id, visited, stack, onLog, onHighlight);
      }
    }

    onStackUpdate([...stack]);
    onLog({
      id: '3',
      timestamp: new Date(),
      type: 'success',
      message: `Stack filled with ${stack.length} nodes`
    });

    // Step 2: Process nodes in stack order on reversed graph
    onLog({
      id: '4',
      timestamp: new Date(),
      type: 'step',
      message: 'Step 2: Processing nodes on reversed graph'
    });

    const visited2 = new Set<string>();
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    let colorIndex = 0;

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!visited2.has(node)) {
        const component: string[] = [];
        await this.dfsOnReversedGraph(node, visited2, component, onLog, onHighlight);
        
        if (component.length > 1) {
          const totalAmount = this.calculateComponentTotalAmount(component);
          const riskScore = this.calculateComponentRiskScore(component, totalAmount);
          
          sccs.push({
            nodes: component,
            totalAmount,
            riskScore,
            color: colors[colorIndex % colors.length]
          });
          
          onLog({
            id: `scc-${colorIndex}`,
            timestamp: new Date(),
            type: 'highlight',
            message: `Found SCC: [${component.join(', ')}] - Size: ${component.length}, Amount: ₹${totalAmount.toLocaleString()}, Risk: ${riskScore.toFixed(2)}`
          });
          
          colorIndex++;
        }
      }
    }

    onLog({
      id: '5',
      timestamp: new Date(),
      type: 'success',
      message: `Found ${sccs.length} strongly connected components (potential fraud rings)`
    });

    return sccs;
  }

  private async dfsFillStack(
    nodeId: string,
    visited: Set<string>,
    stack: string[],
    onLog: (log: LogEntry) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<void> {
    visited.add(nodeId);
    onHighlight([nodeId]);
    
    onLog({
      id: `dfs-${nodeId}`,
      timestamp: new Date(),
      type: 'step',
      message: `Visiting node ${nodeId}`
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const neighbors = this.adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        await this.dfsFillStack(neighbor.target, visited, stack, onLog, onHighlight);
      }
    }

    stack.push(nodeId);
    onLog({
      id: `push-${nodeId}`,
      timestamp: new Date(),
      type: 'highlight',
      message: `Pushed ${nodeId} to stack`
    });
  }

  private async dfsOnReversedGraph(
    nodeId: string,
    visited: Set<string>,
    component: string[],
    onLog: (log: LogEntry) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<void> {
    visited.add(nodeId);
    component.push(nodeId);
    onHighlight([nodeId]);

    const neighbors = this.reverseAdjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.source)) {
        await this.dfsOnReversedGraph(neighbor.source, visited, component, onLog, onHighlight);
      }
    }
  }

  private calculateComponentTotalAmount(component: string[]): number {
    let total = 0;
    this.data.edges.forEach(edge => {
      if (component.includes(edge.source) && component.includes(edge.target)) {
        total += edge.amount;
      }
    });
    return total;
  }

  private calculateComponentRiskScore(component: string[], totalAmount: number): number {
    const baseScore = totalAmount / 1000;
    const sizeBonus = component.length * 5;
    return Math.round((baseScore + sizeBonus) * 100) / 100;
  }

  async bfs(
    startNode: string,
    onLog: (log: LogEntry) => void,
    onQueueUpdate: (queue: string[]) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<BFSResult> {
    const visited = new Set<string>();
    const queue: string[] = [startNode];
    const traversalOrder: string[] = [];
    const levels = new Map<string, number>();

    // Initial queue update
    onQueueUpdate([...queue]);

    onLog({
      id: 'bfs-start',
      timestamp: new Date(),
      type: 'step',
      message: `Starting BFS from node ${startNode}`
    });

    levels.set(startNode, 0);
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift()!;
      traversalOrder.push(current);
      onHighlight([current]);

      onLog({
        id: `bfs-visit-${current}`,
        timestamp: new Date(),
        type: 'step',
        message: `Visiting node ${current} at level ${levels.get(current)}`
      });

      // Update queue after removing current node
      onQueueUpdate([...queue]);

      await new Promise(resolve => setTimeout(resolve, 500));

      const neighbors = this.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.target)) {
          visited.add(neighbor.target);
          queue.push(neighbor.target);
          levels.set(neighbor.target, (levels.get(current) || 0) + 1);
          
          // Update queue after adding each neighbor
          onQueueUpdate([...queue]);
          
          onLog({
            id: `bfs-discover-${neighbor.target}`,
            timestamp: new Date(),
            type: 'highlight',
            message: `Discovered node ${neighbor.target} at level ${levels.get(neighbor.target)}`
          });
        }
      }
    }

    onLog({
      id: 'bfs-complete',
      timestamp: new Date(),
      type: 'success',
      message: `BFS complete. Traversal order: [${traversalOrder.join(' → ')}]`
    });

    return {
      traversalOrder,
      levels,
      visitedNodes: visited
    };
  }

  async combinedAnalysis(
    startNode: string,
    onLog: (log: LogEntry) => void,
    onStackUpdate: (stack: string[]) => void,
    onQueueUpdate: (queue: string[]) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<{ sccs: SCC[], bfsResult: BFSResult, combinedRisk: Map<string, number> }> {
    onLog({
      id: 'combined-start',
      timestamp: new Date(),
      type: 'step',
      message: 'Starting Combined Analysis: Fraud Ring Detection + BFS Traversal'
    });

    // Step 1: Detect fraud rings using SCC
    onLog({
      id: 'combined-step-1',
      timestamp: new Date(),
      type: 'step',
      message: 'Step 1: Detecting fraud rings using Kosaraju\'s algorithm'
    });

    const sccs = await this.kosarajuSCC(onLog, onStackUpdate, onHighlight);

    // Step 2: Perform BFS from selected node
    onLog({
      id: 'combined-step-2',
      timestamp: new Date(),
      type: 'step',
      message: 'Step 2: Performing BFS traversal to find connected nodes'
    });

    const bfsResult = await this.bfs(startNode, onLog, onQueueUpdate, onHighlight);

    // Step 3: Combined risk analysis
    onLog({
      id: 'combined-step-3',
      timestamp: new Date(),
      type: 'step',
      message: 'Step 3: Performing combined risk analysis'
    });

    const combinedRisk = new Map<string, number>();

    // Base risk scores
    const baseRiskScores = this.calculateAllRiskScores();
    baseRiskScores.forEach((score, nodeId) => {
      combinedRisk.set(nodeId, score);
    });

    // Boost risk for nodes in fraud rings
    sccs.forEach((scc, index) => {
      const fraudBonus = scc.riskScore * 0.5; // 50% bonus for being in fraud ring
      scc.nodes.forEach(nodeId => {
        const currentRisk = combinedRisk.get(nodeId) || 0;
        combinedRisk.set(nodeId, currentRisk + fraudBonus);
      });

      onLog({
        id: `combined-fraud-${index}`,
        timestamp: new Date(),
        type: 'highlight',
        message: `Fraud ring ${index + 1}: [${scc.nodes.join(', ')}] - Risk bonus applied`
      });
    });

    // Boost risk for nodes reachable from selected node (potential money laundering paths)
    const reachableBonus = 10;
    bfsResult.traversalOrder.forEach(nodeId => {
      if (nodeId !== startNode) {
        const currentRisk = combinedRisk.get(nodeId) || 0;
        combinedRisk.set(nodeId, currentRisk + reachableBonus);
      }
    });

    onLog({
      id: 'combined-reachable',
      timestamp: new Date(),
      type: 'highlight',
      message: `Reachable nodes from ${startNode}: +${reachableBonus} risk bonus`
    });

    // Special bonus for nodes that are both in fraud rings AND reachable from selected node
    const intersectionBonus = 25;
    sccs.forEach(scc => {
      scc.nodes.forEach(nodeId => {
        if (bfsResult.visitedNodes.has(nodeId)) {
          const currentRisk = combinedRisk.get(nodeId) || 0;
          combinedRisk.set(nodeId, currentRisk + intersectionBonus);
          
          onLog({
            id: `combined-intersection-${nodeId}`,
            timestamp: new Date(),
            type: 'warning',
            message: `HIGH RISK: Node ${nodeId} is in fraud ring AND reachable from ${startNode} (+${intersectionBonus})`
          });
        }
      });
    });

    // Sort nodes by combined risk
    const sortedRisks = Array.from(combinedRisk.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    onLog({
      id: 'combined-complete',
      timestamp: new Date(),
      type: 'success',
      message: `Combined analysis complete. Top risky nodes: ${sortedRisks.map(([id, risk]) => `${id}(${risk.toFixed(1)})`).join(', ')}`
    });

    return {
      sccs,
      bfsResult,
      combinedRisk
    };
  }

  async detectAnomalousPatterns(
    onLog: (log: LogEntry) => void,
    onHighlight: (nodes: string[]) => void
  ): Promise<{ patterns: Array<{type: string, nodes: string[], description: string, severity: 'low' | 'medium' | 'high'}> }> {
    const patterns = [];
    
    onLog({
      id: 'anomaly-start',
      timestamp: new Date(),
      type: 'step',
      message: 'Starting Anomalous Pattern Detection'
    });

    // Pattern 1: Star topology (one node connected to many others)
    const outDegreeMap = new Map<string, number>();
    this.data.nodes.forEach(node => {
      outDegreeMap.set(node.id, node.outDegree);
    });

    const highOutDegreeNodes = Array.from(outDegreeMap.entries())
      .filter(([, degree]) => degree >= 4)
      .sort(([, a], [, b]) => b - a);

    if (highOutDegreeNodes.length > 0) {
      const [nodeId, degree] = highOutDegreeNodes[0];
      patterns.push({
        type: 'Star Pattern',
        nodes: [nodeId],
        description: `Node ${nodeId} has ${degree} outgoing connections (potential hub)`,
        severity: degree >= 6 ? 'high' as const : 'medium' as const
      });

      onHighlight([nodeId]);
      onLog({
        id: 'anomaly-star',
        timestamp: new Date(),
        type: 'warning',
        message: `Star pattern detected: Node ${nodeId} with ${degree} connections`
      });
    }

    // Pattern 2: Circular transactions (potential money laundering)
    const cycles = this.detectSimpleCycles();
    cycles.forEach((cycle, index) => {
      patterns.push({
        type: 'Circular Transaction',
        nodes: cycle,
        description: `Circular transaction detected: ${cycle.join(' → ')} → ${cycle[0]}`,
        severity: cycle.length >= 4 ? 'high' as const : 'medium' as const
      });

      onHighlight(cycle);
      onLog({
        id: `anomaly-cycle-${index}`,
        timestamp: new Date(),
        type: 'warning',
        message: `Circular transaction: ${cycle.join(' → ')} → ${cycle[0]}`
      });
    });

    // Pattern 3: High-value rapid transactions
    const highValueEdges = this.data.edges
      .filter(edge => edge.amount >= 20000)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    if (highValueEdges.length > 0) {
      const involvedNodes = new Set<string>();
      highValueEdges.forEach(edge => {
        involvedNodes.add(edge.source);
        involvedNodes.add(edge.target);
      });

      patterns.push({
        type: 'High-Value Transactions',
        nodes: Array.from(involvedNodes),
        description: `${highValueEdges.length} high-value transactions detected (>$20,000)`,
        severity: 'high' as const
      });

      onHighlight(Array.from(involvedNodes));
      onLog({
        id: 'anomaly-high-value',
        timestamp: new Date(),
        type: 'warning',
        message: `${highValueEdges.length} high-value transactions detected`
      });
    }

    onLog({
      id: 'anomaly-complete',
      timestamp: new Date(),
      type: 'success',
      message: `Anomaly detection complete. Found ${patterns.length} suspicious patterns`
    });

    return { patterns };
  }

  private detectSimpleCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          if (cycle.length >= 3 && cycle.length <= 6) {
            cycles.push([...cycle]);
          }
        }
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor.target, [...path])) {
          // Continue searching for more cycles
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    this.data.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return cycles;
  }

  getAdjacencyList(): Map<string, string[]> {
    const adjList = new Map<string, string[]>();
    this.adjacencyList.forEach((neighbors, node) => {
      adjList.set(node, neighbors.map(n => n.target));
    });
    return adjList;
  }
}
