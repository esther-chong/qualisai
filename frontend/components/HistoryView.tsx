import React from 'react';
import type { HistoryRun } from '../types';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';

interface HistoryViewProps {
  runs: HistoryRun[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ runs }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-brand-text mb-4">Recent Runs</h2>
      <div className="bg-brand-surface border border-brand-surface-light rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-surface-light">
            <thead className="bg-brand-surface-light/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Agent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Data Object ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Version</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-surface-light">
              {runs.map((run: HistoryRun) => (
                <tr key={run.id} className="hover:bg-brand-surface-light transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text">{run.agentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-brand-text-secondary">{run.dataObjectId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-brand-text-secondary">
                    <span className="bg-brand-surface-light px-2 py-1 rounded">{run.dataObjectVersion}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{format(new Date(run.timestamp), "yyyy-MM-dd HH:mm:ss")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{run.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};