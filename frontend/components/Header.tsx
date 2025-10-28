
import React from 'react';
import { LayersIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-md border-b border-brand-surface-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <LayersIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-brand-text">Data Quality Report</h1>
          </div>
        </div>
      </div>
    </header>
  );
};
