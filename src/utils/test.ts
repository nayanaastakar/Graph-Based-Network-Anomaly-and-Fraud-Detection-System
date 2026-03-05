// Test file to verify imports and basic functionality
import { mockGraphData } from '../data/mockData';
import { GraphAlgorithms } from './algorithms';

console.log('Testing imports...');
console.log('Mock data nodes:', mockGraphData.nodes.length);
console.log('Mock data edges:', mockGraphData.edges.length);

const algorithms = new GraphAlgorithms(mockGraphData);
const riskScores = algorithms.calculateAllRiskScores();
console.log('Risk scores calculated:', riskScores.size);

const adjacencyList = algorithms.getAdjacencyList();
console.log('Adjacency list created:', adjacencyList.size);

console.log('All tests passed!');
