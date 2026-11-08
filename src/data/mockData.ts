import { GraphData, NodeData, EdgeData, RawTransaction } from '../types/algorithms';
import { buildGraphFromTransactions, DEFAULT_TRANSACTIONS } from '../utils/algorithms';

export type Node = NodeData;
export type Edge = EdgeData;
export { type GraphData };

export const createGraphFromEdges = (
  edgeList: Array<{ source: string; target: string; amount: number }>
): GraphData => {
  return buildGraphFromTransactions(edgeList);
};

export const mockTransactions: RawTransaction[] = DEFAULT_TRANSACTIONS;
export const mockGraphData: GraphData = buildGraphFromTransactions(mockTransactions);

export const getCytoscapeElements = (data: GraphData) => {
  const nodes = data.nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.id,
      fullLabel: node.label,
      risk: node.risk,
      outDegree: node.outDegree,
      inDegree: node.inDegree,
      outAmount: node.outAmount,
      inAmount: node.inAmount,
      totalAmount: node.totalAmount
    }
  }));

  const edges = data.edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      amount: edge.amount,
      label: edge.label
    }
  }));

  return [...nodes, ...edges];
};
