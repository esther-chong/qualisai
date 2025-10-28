import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataObject, QualityMetric, Trend, Check } from '../types';
import { CheckStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { format } from 'date-fns';

interface DataObjectDetailViewProps {
  dataObject: DataObject;
  onBack: () => void;
}

const TrendIcon: React.FC<{ trend: Trend }> = ({ trend }) => {
  switch (trend) {
    case 'up': return <ArrowUpIcon className="w-5 h-5 text-status-green" />;
    case 'down': return <ArrowDownIcon className="w-5 h-5 text-status-red" />;
    case 'stable': return <MinusIcon className="w-5 h-5 text-brand-text-secondary" />;
    default: return null;
  }
};

const QualityMetricCard: React.FC<{ metric: QualityMetric }> = ({ metric }) => (
    <div className="bg-brand-surface border border-brand-surface-light rounded-lg p-4 flex flex-col justify-between">
        <div>
            <p className="text-sm text-brand-text-secondary">{metric.name}</p>
            <p className="text-2xl font-bold text-brand-text mt-1">{metric.value}</p>
        </div>
        <div className="flex items-center justify-end mt-2">
            <TrendIcon trend={metric.trend} />
        </div>
    </div>
);

const CheckStatusIcon: React.FC<{ status: CheckStatus }> = ({ status }) => {
    switch (status) {
        case CheckStatus.Passed:
            return <CheckCircleIcon className="w-5 h-5 text-status-green" />;
        case CheckStatus.Warning:
            return <AlertTriangleIcon className="w-5 h-5 text-status-yellow" />;
        case CheckStatus.Failed:
            return <XCircleIcon className="w-5 h-5 text-status-red" />;
        default:
            return null;
    }
};

const QualityChart: React.FC<{ metrics: QualityMetric[] }> = ({ metrics }) => {
    const chartData = useMemo(() => {
        return metrics.map(metric => ({
            name: metric.name,
            value: parseFloat(metric.value) || 0,
        }));
    }, [metrics]);

    return (
        <div className="bg-brand-surface border border-brand-surface-light rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brand-text mb-4">Quality Metrics Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis unit="%" stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e1e1e',
                            borderColor: '#2a2a2a',
                            color: '#e5e7eb'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Score" fill="#4f46e5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const ChecksList: React.FC<{ checks: Check[] }> = ({ checks }) => (
    <div className="bg-brand-surface border border-brand-surface-light rounded-lg">
        <h3 className="text-lg font-semibold text-brand-text p-6 border-b border-brand-surface-light">Data Quality Checks ({checks.length})</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <tbody className="divide-y divide-brand-surface-light">
                    {checks.map(check => (
                        <tr key={check.id} className="hover:bg-brand-surface-light/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                    <CheckStatusIcon status={check.status} />
                                    <span className="text-sm font-medium text-brand-text">{check.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                <StatusBadge status={check.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-brand-text-secondary">
                                {format(new Date(check.timestamp), "yyyy-MM-dd HH:mm")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


export const DataObjectDetailView: React.FC<DataObjectDetailViewProps> = ({ dataObject, onBack }) => {

    const passedChecks = useMemo(() => dataObject.checks.filter(c => c.status === CheckStatus.Passed).length, [dataObject.checks]);
    const warningChecks = useMemo(() => dataObject.checks.filter(c => c.status === CheckStatus.Warning).length, [dataObject.checks]);
    const failedChecks = useMemo(() => dataObject.checks.filter(c => c.status === CheckStatus.Failed).length, [dataObject.checks]);

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex items-center justify-between">
                <div>
                    <button onClick={onBack} className="flex items-center space-x-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors mb-4">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center space-x-4">
                        <h2 className="text-3xl font-bold text-brand-text">{dataObject.name}</h2>
                        <span className="font-mono bg-brand-surface-light px-2 py-1 rounded-md text-sm text-brand-text-secondary">{dataObject.version}</span>
                        <StatusBadge status={dataObject.layer} />
                    </div>
                    <p className="text-brand-text-secondary mt-2 max-w-2xl">{dataObject.description}</p>
                </div>
                <div className="flex space-x-2 text-center">
                    <div className="bg-status-green/10 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-status-green">{passedChecks}</p>
                        <p className="text-xs text-status-green/80 uppercase tracking-wider">Passed</p>
                    </div>
                    <div className="bg-status-yellow/10 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-status-yellow">{warningChecks}</p>
                        <p className="text-xs text-status-yellow/80 uppercase tracking-wider">Warnings</p>
                    </div>
                    <div className="bg-status-red/10 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-status-red">{failedChecks}</p>
                        <p className="text-xs text-status-red/80 uppercase tracking-wider">Failed</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dataObject.qualityMetrics.map(metric => (
                    <QualityMetricCard key={metric.name} metric={metric} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <ChecksList checks={dataObject.checks} />
                </div>
                <div className="lg:col-span-2">
                    <QualityChart metrics={dataObject.qualityMetrics} />
                </div>
            </div>
        </div>
    );
};
