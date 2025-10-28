

import React from 'react';

// Fix: Broaden status prop to string and add styles for all status types used in the app.
interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  'pass': 'bg-status-green/20 text-status-green',
  'fail': 'bg-status-red/20 text-status-red',
  'warning': 'bg-status-yellow/20 text-status-yellow',
  'Active': 'bg-status-green/20 text-status-green',
  'Raw': 'bg-status-blue/20 text-status-blue',
  'Defined': 'bg-status-purple/20 text-status-purple',
  'Derived': 'bg-status-indigo/20 text-status-indigo',
};

const statusDotStyles: Record<string, string> = {
  'pass': 'bg-status-green',
  'fail': 'bg-status-red',
  'warning': 'bg-status-yellow',
  'Active': 'bg-status-green',
  'Raw': 'bg-status-blue',
  'Defined': 'bg-status-purple',
  'Derived': 'bg-status-indigo',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center capitalize ${statusStyles[status] || 'bg-gray-500/20 text-gray-300'}`}>
      <span className={`w-2 h-2 mr-2 rounded-full ${statusDotStyles[status] || 'bg-gray-500'}`}></span>
      {status}
    </span>
  );
};
