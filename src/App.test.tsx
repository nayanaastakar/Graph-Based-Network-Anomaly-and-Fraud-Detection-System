import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Graph-Based Network Anomaly & Fraud Detection System header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Graph-Based Network Anomaly & Fraud Detection System/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders key workspace tabs', () => {
  render(<App />);
  expect(screen.getByText(/Algorithms/i)).toBeInTheDocument();
  expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
  expect(screen.getByText(/DSA Internals/i)).toBeInTheDocument();
  expect(screen.getByText(/Findings/i)).toBeInTheDocument();
});
