import React, { useState } from 'react';

interface Edge {
  source: string;
  target: string;
  amount: number;
}

interface EdgeInputPanelProps {
  onEdgesSubmit: (edges: Edge[]) => void;
  isAlgorithmRunning: boolean;
}

const EdgeInputPanel: React.FC<EdgeInputPanelProps> = ({ onEdgesSubmit, isAlgorithmRunning }) => {
  const [inputMode, setInputMode] = useState<'text' | 'table'>('table');
  const [inputText, setInputText] = useState(
    `A B 5000
B C 2000
C A 7000
D E 1000
A2 A3 15000
A3 A4 12000
A4 A2 18000`
  );
  
  const [tableRows, setTableRows] = useState<Edge[]>([
    { source: 'A', target: 'B', amount: 5000 },
    { source: 'B', target: 'C', amount: 2000 },
    { source: 'C', target: 'A', amount: 7000 },
    { source: 'D', target: 'E', amount: 1000 },
    { source: 'A2', target: 'A3', amount: 15000 },
  ]);
  
  const [parseError, setParseError] = useState<string>('');

  const parseEdges = (text: string): Edge[] => {
    const lines = text.trim().split('\n');
    const edges: Edge[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const parts = trimmedLine.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Invalid format on line: "${line}". Expected: Source Destination Amount`);
      }
      
      const [source, target, amountStr] = parts;
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount on line: "${line}". Amount must be a positive number`);
      }
      
      edges.push({ source, target, amount });
    }
    
    return edges;
  };

  const handleTextSubmit = () => {
    try {
      setParseError('');
      const edges = parseEdges(inputText);
      onEdgesSubmit(edges);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleTableSubmit = () => {
    try {
      setParseError('');
      
      // Validate table data
      const validEdges = tableRows.filter(row => 
        row.source.trim() && 
        row.target.trim() && 
        row.amount > 0
      );
      
      if (validEdges.length === 0) {
        throw new Error('Please add at least one valid transaction');
      }
      
      onEdgesSubmit(validEdges);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleClear = () => {
    if (inputMode === 'text') {
      setInputText('');
    } else {
      setTableRows([]);
    }
    setParseError('');
  };

  const handleLoadExample = () => {
    const exampleEdges = [
      { source: 'A', target: 'B', amount: 5000 },
      { source: 'B', target: 'C', amount: 2000 },
      { source: 'C', target: 'A', amount: 7000 },
      { source: 'D', target: 'E', amount: 1000 },
      { source: 'A2', target: 'A3', amount: 15000 },
      { source: 'A3', target: 'A4', amount: 12000 },
      { source: 'A4', target: 'A2', amount: 18000 },
      { source: 'A2', target: 'A5', amount: 8000 },
      { source: 'A3', target: 'A1', amount: 10000 },
      { source: 'A4', target: 'A7', amount: 7000 },
    ];

    if (inputMode === 'text') {
      const exampleText = exampleEdges.map(edge => 
        `${edge.source} ${edge.target} ${edge.amount}`
      ).join('\n');
      setInputText(exampleText);
    } else {
      setTableRows(exampleEdges);
    }
  };

  const addTableRow = () => {
    setTableRows([...tableRows, { source: '', target: '', amount: 0 }]);
  };

  const updateTableRow = (index: number, field: keyof Edge, value: string | number) => {
    const updatedRows = [...tableRows];
    if (field === 'amount') {
      updatedRows[index][field] = parseFloat(value as string) || 0;
    } else {
      updatedRows[index][field] = value as string;
    }
    setTableRows(updatedRows);
  };

  const removeTableRow = (index: number) => {
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-100">Transaction Input</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleLoadExample}
            disabled={isAlgorithmRunning}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Load Example
          </button>
          <button
            onClick={handleClear}
            disabled={isAlgorithmRunning}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setInputMode('table')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
            inputMode === 'table'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Table Format
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
            inputMode === 'text'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Text Format
        </button>
      </div>

      {inputMode === 'table' ? (
        /* Table Input Mode */
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Enter transactions in table format:
            </label>
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-300 font-medium">Source</th>
                    <th className="px-3 py-2 text-left text-slate-300 font-medium">Target</th>
                    <th className="px-3 py-2 text-left text-slate-300 font-medium">Amount</th>
                    <th className="px-3 py-2 text-center text-slate-300 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.source}
                          onChange={(e) => updateTableRow(index, 'source', e.target.value)}
                          disabled={isAlgorithmRunning}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          placeholder="Node A"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.target}
                          onChange={(e) => updateTableRow(index, 'target', e.target.value)}
                          disabled={isAlgorithmRunning}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          placeholder="Node B"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateTableRow(index, 'amount', e.target.value)}
                          disabled={isAlgorithmRunning}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeTableRow(index)}
                          disabled={isAlgorithmRunning}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-xs rounded transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={addTableRow}
              disabled={isAlgorithmRunning}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white text-sm rounded-lg transition-colors duration-200"
            >
              + Add Transaction
            </button>
          </div>
        </div>
      ) : (
        /* Text Input Mode */
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Enter transactions (Source Destination Amount):
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAlgorithmRunning}
            className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="A B 5000&#10;B C 2000&#10;C A 7000"
            spellCheck={false}
          />
        </div>
      )}

      {parseError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{parseError}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {inputMode === 'table' ? (
            <p>Enter source, target, and amount for each transaction</p>
          ) : (
            <>
              <p>Format: Source Destination Amount</p>
              <p>Lines starting with # are ignored</p>
            </>
          )}
        </div>
        <button
          onClick={inputMode === 'table' ? handleTableSubmit : handleTextSubmit}
          disabled={isAlgorithmRunning || (inputMode === 'table' ? tableRows.length === 0 : !inputText.trim())}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
        >
          {isAlgorithmRunning ? 'Processing...' : 'Build Graph'}
        </button>
      </div>
    </div>
  );
};

export default EdgeInputPanel;
