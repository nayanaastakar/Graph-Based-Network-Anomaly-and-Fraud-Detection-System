import React, { useState, useEffect } from 'react';
import { RawTransaction } from '../types/algorithms';

interface EdgeInputPanelProps {
  transactions: RawTransaction[];
  onBuildGraph: (transactions: RawTransaction[]) => void;
  onLoadExample: () => void;
  onClear: () => void;
  isAlgorithmRunning: boolean;
}

export const EdgeInputPanel: React.FC<EdgeInputPanelProps> = ({
  transactions,
  onBuildGraph,
  onLoadExample,
  onClear,
  isAlgorithmRunning
}) => {
  const [inputMode, setInputMode] = useState<'table' | 'text'>('table');
  const [tableRows, setTableRows] = useState<Array<{ source: string; target: string; amount: string }>>([]);
  const [inputText, setInputText] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Synchronize when transactions prop updates (e.g. from Load Example or Clear)
  useEffect(() => {
    setTableRows(
      transactions.map((tx) => ({
        source: tx.source,
        target: tx.target,
        amount: tx.amount.toString()
      }))
    );
    setInputText(
      transactions.map((tx) => `${tx.source} ${tx.target} ${tx.amount}`).join('\n')
    );
    setValidationError('');
  }, [transactions]);

  // Convert table rows to text
  const syncTableToText = (rows: Array<{ source: string; target: string; amount: string }>) => {
    return rows
      .filter((r) => r.source.trim() || r.target.trim() || r.amount.trim())
      .map((r) => `${r.source.trim()} ${r.target.trim()} ${r.amount.trim()}`)
      .join('\n');
  };

  // Convert text to table rows
  const syncTextToTable = (text: string) => {
    const lines = text.trim().split('\n');
    const rows: Array<{ source: string; target: string; amount: string }> = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        rows.push({
          source: parts[0],
          target: parts[1],
          amount: parts[2]
        });
      } else if (parts.length === 2) {
        rows.push({
          source: parts[0],
          target: parts[1],
          amount: ''
        });
      } else if (parts.length === 1 && parts[0]) {
        rows.push({
          source: parts[0],
          target: '',
          amount: ''
        });
      }
    });
    return rows;
  };

  const handleSwitchMode = (mode: 'table' | 'text') => {
    if (mode === inputMode) return;
    setValidationError('');

    if (mode === 'text') {
      // Sync table to text
      setInputText(syncTableToText(tableRows));
    } else {
      // Sync text to table
      const newRows = syncTextToTable(inputText);
      setTableRows(newRows.length > 0 ? newRows : [{ source: '', target: '', amount: '' }]);
    }
    setInputMode(mode);
  };

  const parseAndValidateTransactions = (): RawTransaction[] => {
    const parsed: RawTransaction[] = [];

    if (inputMode === 'table') {
      const activeRows = tableRows.filter((r) => r.source.trim() || r.target.trim() || r.amount.trim());
      if (activeRows.length === 0) {
        throw new Error('Please add at least one transaction row before building graph.');
      }

      activeRows.forEach((row, idx) => {
        const s = row.source.trim().toUpperCase();
        const t = row.target.trim().toUpperCase();
        const amtStr = row.amount.trim();

        if (!s) {
          throw new Error(`Row #${idx + 1}: Source account ID is required.`);
        }
        if (!t) {
          throw new Error(`Row #${idx + 1}: Target account ID is required.`);
        }
        const amt = parseFloat(amtStr);
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Row #${idx + 1} (${s} → ${t}): Amount must be a positive number greater than 0.`);
        }

        parsed.push({ source: s, target: t, amount: amt });
      });
    } else {
      const lines = inputText.trim().split('\n');
      if (lines.length === 0 || !inputText.trim()) {
        throw new Error('Transaction text is empty. Enter at least one transaction: Source Target Amount');
      }

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const parts = trimmed.split(/\s+/);
        if (parts.length !== 3) {
          throw new Error(
            `Line ${idx + 1} ("${trimmed}"): Invalid format. Expected 3 space-separated tokens: Source Target Amount (e.g., A1 A2 5000)`
          );
        }

        const [sRaw, tRaw, amtStr] = parts;
        const s = sRaw.trim().toUpperCase();
        const t = tRaw.trim().toUpperCase();
        const amt = parseFloat(amtStr);

        if (!s || !t) {
          throw new Error(`Line ${idx + 1}: Source and Target accounts cannot be empty.`);
        }
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Line ${idx + 1} ("${trimmed}"): Amount must be a valid positive number.`);
        }

        parsed.push({ source: s, target: t, amount: amt });
      });
    }

    if (parsed.length === 0) {
      throw new Error('No valid transactions found to build network graph.');
    }

    return parsed;
  };

  const handleBuildGraph = () => {
    try {
      setValidationError('');
      setSuccessNotice('');
      const validTransactions = parseAndValidateTransactions();
      onBuildGraph(validTransactions);
      setSuccessNotice(`Successfully synchronized graph with ${validTransactions.length} transactions.`);
      setTimeout(() => setSuccessNotice(''), 3000);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to parse transactions.');
    }
  };

  const handleAddRow = () => {
    setTableRows([...tableRows, { source: '', target: '', amount: '' }]);
  };

  const handleUpdateRow = (index: number, field: 'source' | 'target' | 'amount', value: string) => {
    const updated = [...tableRows];
    updated[index][field] = value;
    setTableRows(updated);
  };

  const handleRemoveRow = (index: number) => {
    const updated = tableRows.filter((_, i) => i !== index);
    setTableRows(updated.length > 0 ? updated : [{ source: '', target: '', amount: '' }]);
  };

  return (
    <div className="space-y-3">
      {/* Header with Mode Toggle & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-700 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => handleSwitchMode('table')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              inputMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Table Editor
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('text')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              inputMode === 'text' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Text
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onLoadExample}
            disabled={isAlgorithmRunning}
            className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded font-medium transition-colors"
            title="Load default canonical fraud ring & network dataset"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={() => {
              onClear();
              setTableRows([{ source: '', target: '', amount: '' }]);
              setInputText('');
              setValidationError('');
            }}
            disabled={isAlgorithmRunning}
            className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 rounded transition-colors"
            title="Clear all transactions"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Validation or Success Alert */}
      {validationError && (
        <div className="p-2.5 bg-red-950/80 border border-red-700 rounded-lg text-red-200 text-xs flex items-start justify-between">
          <span>⚠️ {validationError}</span>
          <button onClick={() => setValidationError('')} className="text-red-400 hover:text-red-200 ml-2 font-bold">
            ✕
          </button>
        </div>
      )}
      {successNotice && (
        <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 rounded-lg text-emerald-200 text-xs">
          ✓ {successNotice}
        </div>
      )}

      {/* Mode 1: Table Editor */}
      {inputMode === 'table' ? (
        <div className="space-y-2">
          <div className="max-h-60 overflow-y-auto overflow-x-auto border border-slate-700/80 rounded-lg bg-slate-900/60 scrollbar-thin scrollbar-thumb-slate-700">
            <table className="min-w-[420px] w-full text-xs text-left">
              <thead className="bg-slate-800/90 text-slate-300 sticky top-0 border-b border-slate-700 z-10">
                <tr>
                  <th className="py-1.5 px-2 font-semibold">#</th>
                  <th className="py-1.5 px-2 font-semibold">Source Account</th>
                  <th className="py-1.5 px-2 font-semibold">Target Account</th>
                  <th className="py-1.5 px-2 font-semibold">Amount (₹)</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-1 px-2 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.source}
                        placeholder="e.g. A1"
                        onChange={(e) => handleUpdateRow(idx, 'source', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 uppercase"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.target}
                        placeholder="e.g. A2"
                        onChange={(e) => handleUpdateRow(idx, 'target', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 uppercase"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={row.amount}
                        placeholder="e.g. 5000"
                        onChange={(e) => handleUpdateRow(idx, 'amount', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-1 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/60 p-1 rounded transition-colors text-xs"
                        title="Remove transaction"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-600/30 rounded font-medium transition-colors"
            >
              + Add Transaction
            </button>
            <span className="text-[11px] text-slate-500">{tableRows.length} transactions in table</span>
          </div>
        </div>
      ) : (
        /* Mode 2: Raw Text Editor */
        <div className="space-y-2">
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`A1 A2 15000\nA2 A3 12000\nA3 A1 18000\n# Format: Source Target Amount`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 scrollbar-thin scrollbar-thumb-slate-700 resize-y"
          />
          <div className="text-[11px] text-slate-400">
            Format: <code className="text-emerald-400">Source Target Amount</code> per line (e.g.{' '}
            <code className="text-slate-300">A1 A2 5000</code>). Lines starting with # are comments.
          </div>
        </div>
      )}

      {/* Build Graph Primary CTA */}
      <button
        type="button"
        onClick={handleBuildGraph}
        disabled={isAlgorithmRunning}
        className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold rounded-lg text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
      >
        <span>⚡ Synchronize & Build Graph</span>
      </button>
    </div>
  );
};

export default EdgeInputPanel;
