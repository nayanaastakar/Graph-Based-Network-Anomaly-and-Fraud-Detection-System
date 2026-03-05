import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types/algorithms';

interface AlgorithmLogProps {
  logs: LogEntry[];
}

const AlgorithmLog: React.FC<AlgorithmLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogClassName = (type: LogEntry['type']) => {
    switch (type) {
      case 'step':
        return 'text-blue-400';
      case 'highlight':
        return 'text-amber-400 bg-amber-900/30';
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      default:
        return '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <h3 className="text-lg font-bold mb-3 text-emerald-400">Algorithm Execution Log</h3>
      <div 
        ref={logContainerRef}
        className="space-y-1 font-mono text-xs bg-slate-900 rounded-lg p-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500"
        style={{ height: 'calc(100% - 40px)' }}
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-4">
            No algorithm execution logs yet. Run an algorithm to see detailed steps.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`py-1 px-2 rounded ${getLogClassName(log.type)}`}>
              <span className="text-slate-500 mr-2">
                [{formatTime(log.timestamp)}]
              </span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlgorithmLog;
