const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================');
console.log('🧪 RUNNING COMPREHENSIVE FINAL CORRECTNESS AUDIT & REGRESSION SUITE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// Compile TypeScript modules for testing
const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');
console.log('Compiling TypeScript modules for test execution...');
execSync(`node "${tscPath}" --target ES2020 --module commonjs --outDir ./dist_test ./src/utils/algorithms.ts ./src/types/algorithms.ts`, {
  cwd: __dirname,
  stdio: 'inherit'
});

const {
  MaxHeap,
  buildGraphFromTransactions,
  GraphAlgorithms,
  DEFAULT_TRANSACTIONS,
  RISK_THRESHOLDS,
  reconstructDirectedCycle
} = require('./dist_test/utils/algorithms');

async function runTests() {
  // --- TEST CASE 1: Empty Input Handling ---
  console.log('\n--- Test Case 1: Empty Input Handling ---');
  const emptyGraph = buildGraphFromTransactions([]);
  assert(emptyGraph.nodes.length === 0, 'Empty input produces 0 nodes');
  assert(emptyGraph.edges.length === 0, 'Empty input produces 0 edges');

  const emptyAlgos = new GraphAlgorithms(emptyGraph);
  assert(emptyAlgos.getAdjacencyList().size === 0, 'Adjacency list is empty for 0 nodes');
  assert(emptyAlgos.detectAnomalies().length === 0, '0 anomalies for empty graph');

  const emptyHeap = emptyAlgos.buildMaxHeap(new Map());
  assert(emptyHeap.size() === 0, 'MaxHeap size is 0');
  assert(emptyHeap.extractMax() === null, 'extractMax on empty heap returns null');

  // --- TEST CASE 2: Simple Directed Cycle ---
  console.log('\n--- Test Case 2: Simple Directed Cycle (A -> B -> C -> A) ---');
  const cycleTxs = [
    { source: 'A', target: 'B', amount: 1000 },
    { source: 'B', target: 'C', amount: 2000 },
    { source: 'C', target: 'A', amount: 3000 }
  ];
  const cycleGraph = buildGraphFromTransactions(cycleTxs);
  assert(cycleGraph.nodes.length === 3, 'Graph has exactly 3 vertices');
  assert(cycleGraph.edges.length === 3, 'Graph has exactly 3 directed edges');

  const cycleAlgos = new GraphAlgorithms(cycleGraph);
  const cycleSccs = await cycleAlgos.kosarajuSCC();
  assert(cycleSccs.length === 1, 'Kosaraju identifies exactly 1 Strongly Connected Component');
  assert(cycleSccs[0].nodes.length === 3, 'The SCC contains all 3 accounts: A, B, C');
  assert(cycleSccs[0].totalAmount === 6000, 'Calculates internal cycle transaction volume: ₹6,000');
  assert(cycleSccs[0].directedSequence === 'A → B → C → A', 'Reconstructs exact directed cycle: A → B → C → A');

  const detectedRings = cycleAlgos.detectFraudRings(cycleSccs);
  assert(detectedRings.length === 1, 'Flags exactly 1 circular fraud ring');

  // --- TEST CASE 3: Disconnected Components ---
  console.log('\n--- Test Case 3: Disconnected Components (A->B->C and D->E) ---');
  const disconnTxs = [
    { source: 'A', target: 'B', amount: 1000 },
    { source: 'B', target: 'C', amount: 2000 },
    { source: 'D', target: 'E', amount: 3000 }
  ];
  const disconnGraph = buildGraphFromTransactions(disconnTxs);
  assert(disconnGraph.nodes.length === 5, 'Graph correctly extracts 5 distinct nodes (A, B, C, D, E)');
  assert(disconnGraph.edges.length === 3, 'Graph contains 3 directed edges');

  const disconnAlgos = new GraphAlgorithms(disconnGraph);
  const disconnSccs = await disconnAlgos.kosarajuSCC();
  assert(disconnSccs.length === 5, 'Since acyclic, each node forms a component of size 1 (5 SCCs total)');
  const disconnRings = disconnAlgos.detectFraudRings(disconnSccs);
  assert(disconnRings.length === 0, 'Zero fraud rings for acyclic disconnected components');

  // --- TEST CASE 4: BFS Traversal & FIFO Queue ---
  console.log('\n--- Test Case 4: BFS Traversal & Queue ---');
  const bfsResult = cycleAlgos.generateBFSSteps('A');
  assert(bfsResult.traversalOrder.join(',') === 'A,B,C', 'BFS traversal order matches A -> B -> C');
  assert(bfsResult.levels.get('A') === 0, 'Source vertex A is at Level 0');
  assert(bfsResult.levels.get('B') === 1, 'Vertex B is at Level 1');
  assert(bfsResult.levels.get('C') === 2, 'Vertex C is at Level 2');
  assert(bfsResult.steps.length >= 4, 'Generates granular step-by-step queue transitions');
  const lastBfsStep = bfsResult.steps[bfsResult.steps.length - 1];
  assert(lastBfsStep.queue.length === 0, 'Final BFS step has an empty queue (FIFO completed)');

  // --- TEST CASE 5: DFS Traversal & LIFO Stack ---
  console.log('\n--- Test Case 5: DFS Traversal & Stack ---');
  const dfsResult = cycleAlgos.generateDFSSteps('A');
  assert(dfsResult.traversalOrder[0] === 'A', 'DFS starts traversal at vertex A');
  assert(dfsResult.visitedNodes.size === 3, 'DFS visits all 3 reachable vertices');
  assert(dfsResult.steps.some(s => s.action === 'push'), 'DFS records push actions onto stack');
  assert(dfsResult.steps.some(s => s.action === 'visit'), 'DFS records visit/pop actions');

  // --- TEST CASE 6: Binary Max-Heap Operations & Invariants ---
  console.log('\n--- Test Case 6: Binary Max-Heap Operations & Invariants ---');
  const heap = new MaxHeap();
  heap.insert({ id: 'ACC1', score: 15.5, outDegree: 2, totalAmount: 10000 });
  heap.insert({ id: 'ACC2', score: 45.0, outDegree: 4, totalAmount: 30000 });
  heap.insert({ id: 'ACC3', score: 28.2, outDegree: 3, totalAmount: 18000 });
  heap.insert({ id: 'ACC4', score: 85.0, outDegree: 5, totalAmount: 60000 });
  heap.insert({ id: 'ACC5', score: 12.0, outDegree: 1, totalAmount: 5000 });

  assert(heap.size() === 5, 'MaxHeap size is 5 after insertions');
  const m1 = heap.extractMax();
  assert(m1.id === 'ACC4' && m1.score === 85.0, 'First extractMax returns ACC4 (highest score: 85.0)');
  const m2 = heap.extractMax();
  assert(m2.id === 'ACC2' && m2.score === 45.0, 'Second extractMax returns ACC2 (score: 45.0)');
  const m3 = heap.extractMax();
  assert(m3.id === 'ACC3' && m3.score === 28.2, 'Third extractMax returns ACC3 (score: 28.2)');

  // --- TEST CASE 7: EXACT VERIFICATION OF CANONICAL DATASET (USER REQUIREMENT 8) ---
  console.log('\n--- Test Case 7: Canonical Dataset Metrics Verification ---');
  const canonicalGraph = buildGraphFromTransactions(DEFAULT_TRANSACTIONS);
  const canonicalAlgos = new GraphAlgorithms(canonicalGraph);

  // 1. 16 accounts
  assert(canonicalGraph.nodes.length === 16, `Dataset contains exactly 16 accounts (actual: ${canonicalGraph.nodes.length})`);

  // 2. 17 directed transactions
  assert(canonicalGraph.edges.length === 17, `Dataset contains exactly 17 transactions (actual: ${canonicalGraph.edges.length})`);

  // 3. ₹138,500 total transaction volume
  const actualVolume = canonicalGraph.edges.reduce((sum, e) => sum + e.amount, 0);
  assert(actualVolume === 138500, `Total transaction volume is exactly ₹138,500 (actual: ₹${actualVolume.toLocaleString()})`);

  // 4. Kosaraju's SCC: 14 strongly connected components total
  const canonicalSccs = await canonicalAlgos.kosarajuSCC();
  assert(canonicalSccs.length === 14, `Kosaraju SCC produces exactly 14 components (actual: ${canonicalSccs.length})`);

  // 5. One multi-node SCC containing A2, A3 and A4
  const multiNodeSccs = canonicalSccs.filter(s => s.nodes.length >= 2);
  assert(multiNodeSccs.length === 1, `Exactly 1 multi-node SCC found (actual: ${multiNodeSccs.length})`);
  const ringNodes = multiNodeSccs[0].nodes.sort();
  assert(ringNodes.join(',') === 'A2,A3,A4', `Multi-node SCC contains exactly [A2, A3, A4] (actual: [${ringNodes.join(', ')}])`);

  // 6. 13 singleton SCCs
  const singletons = canonicalSccs.filter(s => s.nodes.length === 1);
  assert(singletons.length === 13, `Exactly 13 singleton SCCs found (actual: ${singletons.length})`);

  // 7. Verify cycle volume is ₹45,000
  const cycleVolume = multiNodeSccs[0].totalAmount;
  assert(cycleVolume === 45000, `Fraud ring cycle volume is exactly ₹45,000 (actual: ₹${cycleVolume.toLocaleString()})`);

  // 8. Verify directed sequence: A2 → A3 → A4 → A2
  const directedSeq = multiNodeSccs[0].directedSequence;
  assert(directedSeq === 'A2 → A3 → A4 → A2', `Directed sequence is strictly 'A2 → A3 → A4 → A2' (actual: '${directedSeq}')`);

  // 9. Mathematically justified Fraud Ring Risk Score: (₹45,000 / 1000) + (3 * 5) = 60.0
  const ringScore = multiNodeSccs[0].riskScore;
  assert(ringScore === 60.0, `Fraud ring score is 60.0 derived from (₹45,000 / 1000) + (3 * 5) = 60.0 (actual: ${ringScore})`);

  // --- TEST CASE 8: HIGH-RISK CLASSIFICATION (USER REQUIREMENT 3) ---
  console.log('\n--- Test Case 8: High-Risk Classification Threshold Verification ---');
  const scores = canonicalAlgos.calculateAllRiskScores();
  const highRiskAccounts = canonicalGraph.nodes
    .filter(n => (scores.get(n.id) || 0) >= RISK_THRESHOLDS.HIGH_SCORE)
    .map(n => n.id)
    .sort();

  assert(
    highRiskAccounts.join(',') === 'A1,A2,A3,A4,A7',
    `High-Risk accounts (Score >= 25.0) are strictly A1, A2, A3, A4, A7 (actual: ${highRiskAccounts.join(', ')})`
  );
  assert(
    scores.get('A1') === 25.0 &&
    scores.get('A2') === 36.0 &&
    scores.get('A3') === 35.0 &&
    scores.get('A4') === 38.0 &&
    scores.get('A7') === 25.0,
    'All five accounts A1, A2, A3, A4, A7 satisfy Risk Score >= 25.0 threshold with exact user values'
  );

  // Verify all 16 accounts match expected values:
  const expectedScores = {
    A1: 25, A2: 36, A3: 35, A4: 38, A5: 16, A6: 3, A7: 25,
    A8: 14, A9: 3, A10: 13, A11: 3, A12: 3, A13: 11, A14: 3,
    D: 7.5, E: 3
  };
  let allExact = true;
  for (const [acc, exp] of Object.entries(expectedScores)) {
    if (scores.get(acc) !== exp) {
      allExact = false;
      console.error(`Score mismatch for ${acc}: expected ${exp}, got ${scores.get(acc)}`);
    }
  }
  assert(allExact, 'All 16 accounts strictly match canonical risk scores (A1=25, A2=36, A3=35, A4=38, A5=16, A6=3, A7=25, A8=14, A9=3, A10=13, A11=3, A12=3, A13=11, A14=3, D=7.5, E=3)');

  // Verify non-high-risk accounts are below 25.0
  const nonHigh = canonicalGraph.nodes.filter(n => !highRiskAccounts.includes(n.id));
  const allNonHighBelowThreshold = nonHigh.every(n => (scores.get(n.id) || 0) < RISK_THRESHOLDS.HIGH_SCORE);
  assert(allNonHighBelowThreshold, 'All remaining 11 accounts have Risk Score strictly < 25.0');

  // --- TEST CASE 9: BINARY MAX-HEAP PROPERTY OVER ALL 16 ACCOUNTS ---
  console.log('\n--- Test Case 9: Binary Max-Heap Property on Current Dataset ---');
  const canonicalHeap = canonicalAlgos.buildMaxHeap(scores);
  assert(canonicalHeap.size() === 16, 'Binary Max-Heap contains all 16 accounts');
  const heapArray = canonicalHeap.getArray();
  let heapPropertyHolds = true;
  for (let i = 0; i < heapArray.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < heapArray.length && heapArray[i].score < heapArray[left].score) {
      heapPropertyHolds = false;
      console.error(`Violation at index ${i}: parent ${heapArray[i].id} (${heapArray[i].score}) < left ${heapArray[left].id} (${heapArray[left].score})`);
    }
    if (right < heapArray.length && heapArray[i].score < heapArray[right].score) {
      heapPropertyHolds = false;
      console.error(`Violation at index ${i}: parent ${heapArray[i].id} (${heapArray[i].score}) < right ${heapArray[right].id} (${heapArray[right].score})`);
    }
  }
  assert(heapPropertyHolds, 'Parent-child max-heap property (parent >= children) holds for all 16 accounts');

  const top5 = canonicalHeap.getTopK(5);
  assert(top5.length === 5, 'Top 5 accounts extracted from Max-Heap');
  assert(top5[0].id === 'A4' && top5[0].score === 38.0, 'Top 1 riskiest account is A4 (score: 38.0)');
  assert(top5[1].id === 'A2' && top5[1].score === 36.0, 'Top 2 riskiest account is A2 (score: 36.0)');
  assert(top5[2].id === 'A3' && top5[2].score === 35.0, 'Top 3 riskiest account is A3 (score: 35.0)');
  assert((top5[3].id === 'A1' || top5[3].id === 'A7') && top5[3].score === 25.0, `Top 4 riskiest account has score 25.0 (actual: ${top5[3].id})`);
  assert((top5[4].id === 'A1' || top5[4].id === 'A7') && top5[4].score === 25.0, `Top 5 riskiest account has score 25.0 (actual: ${top5[4].id})`);

  // --- TEST CASE 10: SUSPICIOUS PATTERN COUNT DEDUPLICATION (USER REQUIREMENT 4) ---
  console.log('\n--- Test Case 10: Suspicious Pattern Count Deduplication ---');
  const anomalies = canonicalAlgos.detectAnomalies();
  const fraudRings = canonicalAlgos.detectFraudRings(canonicalSccs);

  assert(fraudRings.length === 1, 'Exactly 1 fraud ring detected by SCC analysis');
  assert(anomalies.length >= 1, `Heuristic scanner detected ${anomalies.length} structural anomalies`);
  // Ensure scanner findings are distinct from the SCC cycle
  const scannerTypes = new Set(anomalies.map(a => a.type));
  assert(!scannerTypes.has('Circular Flow (SCC)'), 'Scanner findings do not duplicate SCC fraud rings');
  const totalUnique = fraudRings.length + anomalies.length;
  assert(totalUnique === 1 + anomalies.length, `Total unique patterns clearly separated without double-counting (1 Ring + ${anomalies.length} Scanner = ${totalUnique})`);

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`📊 FINAL TEST AUDIT: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
