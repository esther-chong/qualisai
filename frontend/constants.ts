import { Agent, HistoryRun, DataObject, AgentStatus, RunStatus, CheckStatus, DataLayer, Trend } from './types';

export const AGENTS: Agent[] = [
  { id: 'agent-1', name: 'Data Quality Agent', status: AgentStatus.Active, lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'agent-2', name: 'Data Transfer Agent', status: AgentStatus.Active, lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
];

export const HISTORY_RUNS: HistoryRun[] = [
  { id: 'run-1', agentName: 'Data Quality Agent', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: RunStatus.Success, duration: '2m 15s', dataObjectId: 'do-1', dataObjectVersion: 'v1.2.3' },
  { id: 'run-2', agentName: 'Data Transfer Agent', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), status: RunStatus.Success, duration: '45s', dataObjectId: 'do-2', dataObjectVersion: 'v2.0.1' },
  { id: 'run-3', agentName: 'Data Quality Agent', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), status: RunStatus.Success, duration: '2m 10s', dataObjectId: 'do-1', dataObjectVersion: 'v1.2.2' },
  { id: 'run-4', agentName: 'Data Transfer Agent', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: RunStatus.Failed, duration: '1m 5s', dataObjectId: 'do-2', dataObjectVersion: 'v2.0.0' },
  { id: 'run-5', agentName: 'Data Quality Agent', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: RunStatus.Success, duration: '2m 30s', dataObjectId: 'do-3', dataObjectVersion: 'v1.5.0' },
];

const generateChecks = (count: number): DataObject['checks'] => {
    const checks = [];
    const checkNames = ['Null Check', 'Uniqueness', 'Format Validation', 'Range Check', 'Referential Integrity'];
    for(let i=0; i<count; i++) {
        const status = Math.random() > 0.8 ? (Math.random() > 0.5 ? CheckStatus.Failed : CheckStatus.Warning) : CheckStatus.Passed;
        checks.push({
            id: `check-${i}`,
            name: checkNames[i % checkNames.length],
            status,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return checks;
}

export const DATA_OBJECTS: DataObject[] = [
  {
    id: 'do-1',
    name: 'customers',
    version: '1.2.3',
    layer: DataLayer.Raw,
    description: 'Raw customer data ingested from CRM system.',
    checks: generateChecks(5),
    qualityMetrics: [
      { name: 'Freshness', value: '15m ago', trend: Trend.Stable },
      { name: 'Completeness', value: '98.5%', trend: Trend.Up },
      { name: 'Accuracy', value: '92.1%', trend: Trend.Down },
      { name: 'Validity', value: '99.7%', trend: Trend.Stable },
    ],
  },
  {
    id: 'do-2',
    name: 'orders',
    version: '2.0.1',
    layer: DataLayer.Defined,
    description: 'Cleaned and structured customer order information.',
    checks: generateChecks(8),
    qualityMetrics: [
      { name: 'Freshness', value: '30m ago', trend: Trend.Stable },
      { name: 'Completeness', value: '99.8%', trend: Trend.Up },
      { name: 'Accuracy', value: '99.5%', trend: Trend.Up },
      { name: 'Validity', value: '100%', trend: Trend.Stable },
    ],
  },
  {
    id: 'do-3',
    name: 'monthly_revenue',
    version: '1.5.0',
    layer: DataLayer.Derived,
    description: 'Aggregated monthly revenue report for analytics.',
    checks: generateChecks(4),
    qualityMetrics: [
      { name: 'Freshness', value: '1h ago', trend: Trend.Stable },
      { name: 'Completeness', value: '100%', trend: Trend.Stable },
      { name: 'Accuracy', value: '100%', trend: Trend.Stable },
      { name: 'Validity', value: '100%', trend: Trend.Stable },
    ],
  },
];
