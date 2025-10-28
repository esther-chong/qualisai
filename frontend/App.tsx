
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReportView } from './components/ReportView';
import type { DQReport } from './types';
import { fetchDashboardData } from './services/apiService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DQReport | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const reportData = await fetchDashboardData();
        setReport(reportData);
      } catch (err) {
        setError('Failed to load data quality report. Please check the API and try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReportData();
  }, []);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-brand-text-secondary">Loading report...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex justify-center items-center h-64 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-status-red">{error}</p>
        </div>
      );
    }
    
    if (report) {
      return <ReportView report={report} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
