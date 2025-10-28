

export enum CheckOutcome {
  Pass = 'pass',
  Fail = 'fail',
}

export type CheckDefinition = {
  type: string;
  column: string;
  min?: number;
  max?: number;
  max_length?: number;
};

export type CheckResult = {
  check: CheckDefinition;
  outcome: CheckOutcome;
  details?: string;
};

export type ReportSummary = {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
};

export type DQReport = {
  jobId: string;
  dataRef: string;
  summary: ReportSummary;
  results: CheckResult[];
};

// Fix: Add missing type definitions that were causing import errors.
export enum AgentStatus {
  Active = 'Active',
}

export enum RunStatus {
  Success = 'pass',
  Failed = 'fail',
}

export enum CheckStatus {
  Passed = 'pass',
  Warning = 'warning',
  Failed = 'fail',
}

export enum DataLayer {
  Raw = 'Raw',
  Defined = 'Defined',
  Derived = 'Derived',
}

export enum Trend {
  Up = 'up',
  Down = 'down',
  Stable = 'stable',
}

export type QualityMetric = {
  name: string;
  value: string;
  trend: Trend;
};

export type Check = {
  id: string;
  name: string;
  status: CheckStatus;
  timestamp: string;
};

export type DataObject = {
  id: string;
  name: string;
  version: string;
  layer: DataLayer;
  description: string;
  checks: Check[];
  qualityMetrics: QualityMetric[];
};

export type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
  lastRun: string;
};

export type HistoryRun = {
  id: string;
  agentName: string;
  timestamp: string;
  status: RunStatus;
  duration: string;
  dataObjectId: string;
  dataObjectVersion: string;
};
