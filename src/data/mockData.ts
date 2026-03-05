export interface Node {
  id: string;
  label: string;
  risk: 'normal' | 'medium' | 'high';
  outDegree: number;
  totalAmount: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  amount: number;
  label: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export const createGraphFromEdges = (edgeList: Array<{source: string; target: string; amount: number}>): GraphData => {
  const nodeSet = new Set<string>();
  const nodeMap = new Map<string, Node>();
  
  // Collect all unique nodes
  edgeList.forEach(edge => {
    nodeSet.add(edge.source);
    nodeSet.add(edge.target);
  });

  // Create nodes
  const nodes: Node[] = Array.from(nodeSet).map(nodeId => {
    const node: Node = {
      id: nodeId,
      label: `Account ${nodeId}`,
      risk: 'normal',
      outDegree: 0,
      totalAmount: 0
    };
    nodeMap.set(nodeId, node);
    return node;
  });

  // Create edges and calculate node metrics
  const edges: Edge[] = edgeList.map((edge, index) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (sourceNode) {
      sourceNode.outDegree++;
      sourceNode.totalAmount += edge.amount;
    }
    
    return {
      id: `e${index + 1}`,
      source: edge.source,
      target: edge.target,
      amount: edge.amount,
      label: `₹${edge.amount.toLocaleString()}`
    };
  });

  // Calculate risk scores based on metrics
  nodes.forEach(node => {
    if (node.outDegree >= 4 || node.totalAmount >= 40000) {
      node.risk = 'high';
    } else if (node.outDegree >= 2 || node.totalAmount >= 15000) {
      node.risk = 'medium';
    }
  });

  return { nodes, edges };
};

export const mockGraphData: GraphData = {
  nodes: [
    { id: 'A1', label: 'Account A1', risk: 'normal', outDegree: 3, totalAmount: 15000 },
    { id: 'A2', label: 'Account A2', risk: 'high', outDegree: 4, totalAmount: 45000 },
    { id: 'A3', label: 'Account A3', risk: 'high', outDegree: 3, totalAmount: 35000 },
    { id: 'A4', label: 'Account A4', risk: 'high', outDegree: 2, totalAmount: 25000 },
    { id: 'A5', label: 'Account A5', risk: 'medium', outDegree: 2, totalAmount: 18000 },
    { id: 'A6', label: 'Account A6', risk: 'normal', outDegree: 1, totalAmount: 8000 },
    { id: 'A7', label: 'Account A7', risk: 'medium', outDegree: 3, totalAmount: 22000 },
    { id: 'A8', label: 'Account A8', risk: 'normal', outDegree: 2, totalAmount: 12000 },
    { id: 'A9', label: 'Account A9', risk: 'normal', outDegree: 1, totalAmount: 5000 },
    { id: 'A10', label: 'Account A10', risk: 'medium', outDegree: 2, totalAmount: 16000 },
    { id: 'A11', label: 'Account A11', risk: 'normal', outDegree: 1, totalAmount: 7000 },
    { id: 'A12', label: 'Account A12', risk: 'normal', outDegree: 1, totalAmount: 9000 },
    { id: 'A13', label: 'Account A13', risk: 'medium', outDegree: 2, totalAmount: 19000 },
    { id: 'A14', label: 'Account A14', risk: 'normal', outDegree: 1, totalAmount: 6000 },
  ],
  edges: [
    // Fraud ring 1: A2 -> A3 -> A4 -> A2 (cycle)
    { id: 'e1', source: 'A2', target: 'A3', amount: 15000, label: '$15,000' },
    { id: 'e2', source: 'A3', target: 'A4', amount: 12000, label: '$12,000' },
    { id: 'e3', source: 'A4', target: 'A2', amount: 18000, label: '$18,000' },
    
    // Connections from fraud ring to other accounts
    { id: 'e4', source: 'A2', target: 'A5', amount: 8000, label: '$8,000' },
    { id: 'e5', source: 'A3', target: 'A1', amount: 10000, label: '$10,000' },
    { id: 'e6', source: 'A4', target: 'A7', amount: 7000, label: '$7,000' },
    
    // Normal transactions
    { id: 'e7', source: 'A1', target: 'A6', amount: 8000, label: '$8,000' },
    { id: 'e8', source: 'A1', target: 'A8', amount: 5000, label: '$5,000' },
    { id: 'e9', source: 'A5', target: 'A9', amount: 5000, label: '$5,000' },
    { id: 'e10', source: 'A7', target: 'A10', amount: 11000, label: '$11,000' },
    { id: 'e11', source: 'A7', target: 'A11', amount: 7000, label: '$7,000' },
    { id: 'e12', source: 'A8', target: 'A12', amount: 9000, label: '$9,000' },
    { id: 'e13', source: 'A10', target: 'A13', amount: 8000, label: '$8,000' },
    { id: 'e14', source: 'A13', target: 'A14', amount: 6000, label: '$6,000' },
    
    // Additional connections for complexity
    { id: 'e15', source: 'A1', target: 'A10', amount: 3000, label: '$3,000' },
    { id: 'e16', source: 'A5', target: 'A13', amount: 4000, label: '$4,000' },
  ]
};

export const getCytoscapeElements = (data: GraphData) => {
  const nodes = data.nodes.map(node => ({
    data: {
      id: node.id,
      label: node.label,
      risk: node.risk,
      outDegree: node.outDegree,
      totalAmount: node.totalAmount,
    }
  }));

  const edges = data.edges.map(edge => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      amount: edge.amount,
      label: edge.label,
    }
  }));

  return [...nodes, ...edges];
};
