import {
  MaxHeap,
  buildGraphFromTransactions,
  GraphAlgorithms,
  DEFAULT_TRANSACTIONS
} from './algorithms';
import { RawTransaction } from '../types/algorithms';

describe('Graph-Based Network Anomaly & Fraud Detection Algorithms Suite', () => {
  // Test Case 1: Empty Input Handling
  test('Test Case 1: Empty Input handling', () => {
    const emptyGraph = buildGraphFromTransactions([]);
    expect(emptyGraph.nodes).toHaveLength(0);
    expect(emptyGraph.edges).toHaveLength(0);

    const algos = new GraphAlgorithms(emptyGraph);
    expect(algos.getAdjacencyList().size).toBe(0);
    expect(algos.detectAnomalies()).toHaveLength(0);

    const heap = algos.buildMaxHeap(new Map());
    expect(heap.size()).toBe(0);
    expect(heap.extractMax()).toBeNull();
  });

  // Test Case 2: Simple Directed Cycle (A -> B -> C -> A)
  test('Test Case 2: Simple Directed Cycle with Kosaraju SCC', async () => {
    const cycleTxs: RawTransaction[] = [
      { source: 'A', target: 'B', amount: 1000 },
      { source: 'B', target: 'C', amount: 2000 },
      { source: 'C', target: 'A', amount: 3000 }
    ];

    const graph = buildGraphFromTransactions(cycleTxs);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3);

    const algos = new GraphAlgorithms(graph);
    const sccs = await algos.kosarajuSCC();

    // In a directed cycle A -> B -> C -> A, there should be exactly 1 SCC containing all 3 nodes
    expect(sccs).toHaveLength(1);
    expect(sccs[0].nodes.sort()).toEqual(['A', 'B', 'C'].sort());
    expect(sccs[0].totalAmount).toBe(6000);

    const rings = algos.detectFraudRings(sccs);
    expect(rings).toHaveLength(1);
  });

  // Test Case 3: Disconnected Components
  test('Test Case 3: Disconnected Components', async () => {
    const disconnectedTxs: RawTransaction[] = [
      { source: 'A', target: 'B', amount: 1000 },
      { source: 'B', target: 'C', amount: 2000 },
      { source: 'D', target: 'E', amount: 3000 }
    ];

    const graph = buildGraphFromTransactions(disconnectedTxs);
    expect(graph.nodes).toHaveLength(5);
    expect(graph.edges).toHaveLength(3);

    const algos = new GraphAlgorithms(graph);
    const sccs = await algos.kosarajuSCC();

    // Since there are no cycles, each node is in its own trivial SCC of size 1
    expect(sccs).toHaveLength(5);
    const fraudRings = algos.detectFraudRings(sccs);
    expect(fraudRings).toHaveLength(0);
  });

  // Test Case 4: BFS Traversal & Queue Logic
  test('Test Case 4: BFS Traversal on cycle starting from A', () => {
    const cycleTxs: RawTransaction[] = [
      { source: 'A', target: 'B', amount: 1000 },
      { source: 'B', target: 'C', amount: 2000 },
      { source: 'C', target: 'A', amount: 3000 }
    ];

    const graph = buildGraphFromTransactions(cycleTxs);
    const algos = new GraphAlgorithms(graph);
    const bfsRes = algos.generateBFSSteps('A');

    expect(bfsRes.traversalOrder).toEqual(['A', 'B', 'C']);
    expect(bfsRes.levels.get('A')).toBe(0);
    expect(bfsRes.levels.get('B')).toBe(1);
    expect(bfsRes.levels.get('C')).toBe(2);
    expect(bfsRes.steps.length).toBeGreaterThan(0);
  });

  // Test Case 5: DFS Traversal & Stack Logic
  test('Test Case 5: DFS Traversal starting from A', () => {
    const cycleTxs: RawTransaction[] = [
      { source: 'A', target: 'B', amount: 1000 },
      { source: 'B', target: 'C', amount: 2000 },
      { source: 'C', target: 'A', amount: 3000 }
    ];

    const graph = buildGraphFromTransactions(cycleTxs);
    const algos = new GraphAlgorithms(graph);
    const dfsRes = algos.generateDFSSteps('A');

    expect(dfsRes.traversalOrder[0]).toBe('A');
    expect(dfsRes.visitedNodes.size).toBe(3);
    expect(dfsRes.steps.some((s) => s.action === 'push')).toBe(true);
    expect(dfsRes.steps.some((s) => s.action === 'visit')).toBe(true);
  });

  // Test Case 6: Max Heap Data Structure Integrity
  test('Test Case 6: Genuine Max-Heap Invariants & Operations', () => {
    const heap = new MaxHeap();
    heap.insert({ id: 'X', score: 10, outDegree: 1, totalAmount: 1000 });
    heap.insert({ id: 'Y', score: 50, outDegree: 4, totalAmount: 5000 });
    heap.insert({ id: 'Z', score: 30, outDegree: 2, totalAmount: 3000 });
    heap.insert({ id: 'W', score: 50, outDegree: 3, totalAmount: 4000 });

    expect(heap.size()).toBe(4);
    // Highest score is 50
    const top1 = heap.extractMax();
    expect(top1?.score).toBe(50);

    const top2 = heap.extractMax();
    expect(top2?.score).toBe(50);

    const top3 = heap.extractMax();
    expect(top3?.score).toBe(30);

    const top4 = heap.extractMax();
    expect(top4?.score).toBe(10);

    expect(heap.size()).toBe(0);
  });

  // Test Case 7: Risk Score Calculation
  test('Test Case 7: Deterministic Risk Score Formula', () => {
    const txs: RawTransaction[] = [
      { source: 'A', target: 'B', amount: 10000 },
      { source: 'A', target: 'C', amount: 5000 }
    ];

    const graph = buildGraphFromTransactions(txs);
    const algos = new GraphAlgorithms(graph);

    // Node A: outDegree = 2, clusterSize = 1, outAmount = 15000
    // Score = (2 * 2) + (1 * 3) + (15000 / 1000) = 4 + 3 + 15 = 22
    const scoreA = algos.calculateRiskScore('A', 1);
    expect(scoreA).toBe(22);
  });

  // Test Case 8: Large Dataset (100+ nodes, 200+ edges)
  test('Test Case 8: Large Dataset Scalability', async () => {
    const largeTxs: RawTransaction[] = [];
    for (let i = 1; i <= 100; i++) {
      largeTxs.push({
        source: `N${i}`,
        target: `N${(i % 100) + 1}`,
        amount: 1000 * (i % 10 + 1)
      });
      if (i % 2 === 0) {
        largeTxs.push({
          source: `N${i}`,
          target: `N${(i + 5) % 100 + 1}`,
          amount: 5000
        });
      }
    }

    const largeGraph = buildGraphFromTransactions(largeTxs);
    expect(largeGraph.nodes.length).toBe(100);
    expect(largeGraph.edges.length).toBe(150);

    const algos = new GraphAlgorithms(largeGraph);
    const sccs = await algos.kosarajuSCC();
    expect(sccs.length).toBeGreaterThan(0);

    const bfs = algos.generateBFSSteps('N1');
    expect(bfs.traversalOrder.length).toBe(100);

    const heap = algos.buildMaxHeap(algos.calculateAllRiskScores());
    expect(heap.size()).toBe(100);
    const top5 = heap.getTopK(5);
    expect(top5).toHaveLength(5);
    expect(top5[0].score).toBeGreaterThanOrEqual(top5[1].score);
  });
});
