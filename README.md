# Graph-Based Network Anomaly & Fraud Detection System

> **Data Structures & Algorithms (DSA) Demonstration Platform**  
> A high-performance, interactive full-stack cybersecurity and financial forensic analysis application designed to detect circular transaction layering, fraud rings, and structural network anomalies using classical graph algorithms and priority queues.

---

## 🚀 Key Highlights & Capabilities

- **Interactive Network Graph (Cytoscape.js):**
  - Directed financial graph visualization with auto-fit, collision-free node spacing, dynamic zoom levels, and layout switching (**COSE Force-Directed**, **Concentric**, and **Circular**).
  - Selected account inspector with inbound/outbound transfer statistics and exact mathematical risk score breakdowns.
- **Kosaraju's Strongly Connected Components (SCC):**
  - Genuine two-pass algorithm ($O(V + E)$ time and space).
  - Identifies cyclic fraud rings and reconstructs exact directed cycle paths (e.g., `A2 → A3 → A4 → A2`).
- **Breadth-First Search (BFS) & Queue (FIFO):**
  - Level-by-level traversal with interactive playback (Play, Pause, Step Forward, Step Back, Reset).
  - Live Queue runtime state visualization showing `FRONT`, `REAR`, enqueuing, and dequeuing transitions.
- **Depth-First Search (DFS) & Stack (LIFO):**
  - Branch-first depth traversal demonstrating explicit stack push/pop transitions.
- **Calibrated Account Risk Score Engine:**
  - Formula: $\text{Risk Score} = (\text{OutDegree} \times 2) + (\text{ClusterSize} \times 3) + (\text{OutAmount} / 1000)$
  - $\text{ClusterSize}$ is dynamically computed as the size of the Strongly Connected Component (SCC) to which the account belongs.
- **Binary Max-Heap Priority Queue:**
  - Demonstrates parent-child heap ordering property ($\text{Heap}[i] \ge \text{Heap}[2i+1], \text{Heap}[2i+2]$).
  - Efficient extraction of top risky accounts.
- **Heuristic Network Anomaly Scanner:**
  - Detects **Disbursement Hubs** (fan-out structuring), **Aggregation Funnels** (fan-in consolidation), and **High-Value Single Transfers** ($\ge \text{₹}15,000$).
- **Dual Transaction Input & Synchronization:**
  - In-place **Table Editor** and **Raw Text** input with comprehensive validation suite.
- **Currency Localization & Cross-Device Compatibility:**
  - Fully formatted in Indian Rupee (**₹** / INR).
  - Responsive across all viewports (Mobile 390px, Tablet 768px/1024px, Desktop 1440px/1920px).

---

## 📊 Canonical Dataset Metrics

The platform comes preloaded with a canonical reference forensic dataset:

- **Total Accounts ($|V|$):** 16 accounts ($A1$–$A14$, $D$, $E$)
- **Total Transactions ($|E|$):** 17 directed transactions
- **Total Network Volume:** **₹138,500** (INR)
- **Strongly Connected Components:** 14 SCCs (1 multi-node fraud ring + 13 singleton components)
- **Detected Fraud Ring:**
  - **Directed Path:** `A2 → A3 → A4 → A2`
  - **Cycle Internal Volume:** ₹45,000
  - **Mathematically Justified Ring Score:**
    $$\text{Score} = \left(\frac{\text{₹}45,000}{1000}\right) + (3 \text{ accounts} \times 5) = \mathbf{60.0 \text{ pts}}$$
- **High-Risk Accounts ($\text{Score} \ge 25.0$):**
  1. **A4:** 38.0 pts (HIGH)
  2. **A2:** 36.0 pts (HIGH)
  3. **A3:** 35.0 pts (HIGH)
  4. **A1:** 25.0 pts (HIGH)
  5. **A7:** 25.0 pts (HIGH)

---

## 🛠️ Technology Stack

- **Frontend Framework:** React 19, TypeScript
- **Styling:** Tailwind CSS, Custom Glassmorphism UI
- **Graph Visualization:** Cytoscape.js
- **Algorithms:** Custom native TypeScript DSA Engine (`MaxHeap`, `GraphAlgorithms`, Kosaraju SCC, BFS Queue, DFS Stack)
- **Testing & Verification:** Standalone TypeScript test runner (`verify-all-tests.js`), Playwright multi-viewport suite (`test-all-viewports.js`)

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- `npm` or `yarn`

### Installation

```bash
# Clone the repository
git clone https://github.com/nayanaastakar/Graph-Based-Network-Anomaly-and-Fraud-Detection-System.git

# Navigate into project directory
cd Graph-Based-Network-Anomaly-and-Fraud-Detection-System

# Install dependencies
npm install
```

### Running the Application

```bash
# Start development server
npm start

# Or build and run high-speed production server (Port 3005)
npm run build
npm run serve
```

Open [http://localhost:3005](http://localhost:3005) (or [http://localhost:3000](http://localhost:3000) for dev mode) in your browser.

---

## 🧪 Testing & Verification

Run the comprehensive 57-assertion test suite verifying algorithmic invariants, canonical dataset metrics, heap properties, and cycle recoveries:

```bash
npm test
```

Test multi-viewport responsive compatibility across all form factors:

```bash
node test-all-viewports.js
```

---

## 📄 License

MIT License. Designed for educational, demonstration, and academic presentation purposes.
