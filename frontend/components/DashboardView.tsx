import React from 'react';
import type { Agent, DataObject } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowUpRightIcon } from './Icons';
import { formatDistanceToNow } from 'date-fns';

interface DashboardViewProps {
  agents: Agent[];
  dataObjects: DataObject[];
  onSelectDataObject: (dataObject: DataObject) => void;
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
  <div className="bg-brand-surface border border-brand-surface-light rounded-lg p-6 flex flex-col justify-between">
    <div>
      <h3 className="text-lg font-semibold text-brand-text">{agent.name}</h3>
      <p className="text-sm text-brand-text-secondary mt-1">
        Last run: {formatDistanceToNow(new Date(agent.lastRun), { addSuffix: true })}
      </p>
    </div>
    <div className="mt-4">
      <StatusBadge status={agent.status} />
    </div>
  </div>
);

const DataObjectCard: React.FC<{ dataObject: DataObject; onClick: () => void }> = ({ dataObject, onClick }) => (
  <div
    onClick={onClick}
    className="bg-brand-surface border border-brand-surface-light rounded-lg p-6 cursor-pointer hover:bg-brand-surface-light hover:border-brand-primary transition-all duration-200 group flex flex-col"
  >
    <div className="flex-grow">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-semibold text-brand-text group-hover:text-brand-primary">{dataObject.name}</h4>
        <ArrowUpRightIcon className="w-5 h-5 text-brand-text-secondary group-hover:text-brand-primary transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <div className="flex items-center space-x-3 text-xs text-brand-text-secondary mt-1">
        <span className="font-mono">ID: {dataObject.id}</span>
        <span className="font-mono bg-brand-surface-light px-1.5 py-0.5 rounded">{dataObject.version}</span>
      </div>
      <p className="text-sm text-brand-text-secondary mt-2">{dataObject.description}</p>
    </div>
  </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ agents, dataObjects, onSelectDataObject }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-brand-text mb-4">Agent Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-brand-text mb-4">Data Objects</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {dataObjects.map((dataObject) => (
            <DataObjectCard key={dataObject.id} dataObject={dataObject} onClick={() => onSelectDataObject(dataObject)} />
          ))}
        </div>
      </div>
    </div>
  );
};