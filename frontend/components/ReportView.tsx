
import React from 'react';
import type { DQReport, CheckResult, CheckDefinition } from '../types';
import { CheckOutcome } from '../types';
import { StatusBadge } from './StatusBadge';
import { CheckCircleIcon, XCircleIcon } from './Icons';

// Helper function to format check definition into a human-readable string
const formatCheck = (check: CheckDefinition): string => {
    switch (check.type) {
        case 'not_null':
            return 'Not Null';
        case 'range':
            return `Range (${check.min} - ${check.max})`;
        case 'length':
            return `Max Length (${check.max_length})`;
        default:
            return check.type.replace(/_/g, ' ');
    }
};

const SummaryCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`bg-brand-surface border border-brand-surface-light rounded-lg p-6`}>
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-brand-text">{value}</p>
                <p className="text-sm text-brand-text-secondary uppercase tracking-wider">{title}</p>
            </div>
        </div>
    </div>
);

const ResultsTable: React.FC<{ results: CheckResult[] }> = ({ results }) => (
    <div className="bg-brand-surface border border-brand-surface-light rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-brand-text p-6 border-b border-brand-surface-light">Detailed Results</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-surface-light">
                <thead className="bg-brand-surface-light/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Check</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Column</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Outcome</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-surface-light">
                    {results.map((result, index) => (
                        <tr key={index} className={`hover:bg-brand-surface-light transition-colors duration-200 ${result.outcome === CheckOutcome.Fail ? 'bg-status-red/5' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text">{formatCheck(result.check)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-brand-text-secondary">{result.check.column}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <StatusBadge status={result.outcome} />
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${result.outcome === CheckOutcome.Fail ? 'text-status-red' : 'text-brand-text-secondary'}`}>
                                {result.details || '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const ReportView: React.FC<{ report: DQReport }> = ({ report }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h2 className="text-3xl font-bold text-brand-text">Job: <span className="text-brand-primary font-mono">{report.jobId}</span></h2>
                <p className="text-brand-text-secondary mt-2">
                    Data Source: <code className="bg-brand-surface-light px-2 py-1 rounded-md text-sm">{report.dataRef}</code>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Total Checks" 
                    value={report.summary.totalChecks}
                    icon={<div className="font-bold text-lg">Σ</div>} 
                    color="status-blue" 
                />
                <SummaryCard 
                    title="Passed" 
                    value={report.summary.passedChecks}
                    icon={<CheckCircleIcon className="w-6 h-6" />} 
                    color="status-green"
                />
                <SummaryCard 
                    title="Failed" 
                    value={report.summary.failedChecks}
                    icon={<XCircleIcon className="w-6 h-6" />} 
                    color="status-red"
                />
            </div>
            
            <ResultsTable results={report.results} />
        </div>
    );
};
