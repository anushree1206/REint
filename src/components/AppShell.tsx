import React from 'react';
import { RefreshCw, Database, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { ForecastVintage, HealthResponse } from '../types';

interface AppShellProps {
  activeTab: 'overview' | 'accuracy' | 'deviations' | 'methodology';
  onTabChange: (tab: 'overview' | 'accuracy' | 'deviations' | 'methodology') => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  vintage: ForecastVintage;
  onVintageChange: (vintage: ForecastVintage) => void;
  onRefresh: () => void;
  isLoading: boolean;
  health: HealthResponse | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  startDate,
  endDate,
  onDateChange,
  vintage,
  onVintageChange,
  onRefresh,
  isLoading,
  health,
  children,
}) => {
  const presets = [
    { label: 'Full Month (Jan 1–31)', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Storm Peak (Jan 26–31)', start: '2026-01-26', end: '2026-01-31' },
    { label: 'Mid-Month Ramp (Jan 15–22)', start: '2026-01-15', end: '2026-01-22' },
    { label: 'High Wind Run (Jan 08–14)', start: '2026-01-08', end: '2026-01-14' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Bar Contract (3 Zones) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              WindLens
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-3">
              UK Energy Decision Support
            </span>
          </div>

          {/* Zone 2: 4 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onTabChange('overview')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onTabChange('accuracy')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'accuracy'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Forecast Accuracy
            </button>
            <button
              onClick={() => onTabChange('deviations')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'deviations'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Purchasing Deviations
            </button>
            <button
              onClick={() => onTabChange('methodology')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'methodology'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Data & Methodology
            </button>
          </nav>

          {/* Zone 3: Primary Action / Status */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              title="Refresh analysis datasets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800/80 px-2 py-2 text-xs font-medium">
          <button
            onClick={() => onTabChange('overview')}
            className={`px-2 py-1 rounded ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Overview
          </button>
          <button
            onClick={() => onTabChange('accuracy')}
            className={`px-2 py-1 rounded ${activeTab === 'accuracy' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Accuracy
          </button>
          <button
            onClick={() => onTabChange('deviations')}
            className={`px-2 py-1 rounded ${activeTab === 'deviations' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Deviations
          </button>
          <button
            onClick={() => onTabChange('methodology')}
            className={`px-2 py-1 rounded ${activeTab === 'methodology' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Methodology
          </button>
        </div>
      </header>

      {/* Workspace Toolbar: Period Selector, Vintage Toggle, Source Indicator */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Analysis Period Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>
            {presets.map((p) => {
              const isActive = startDate === p.start && endDate === p.end;
              return (
                <button
                  key={p.label}
                  onClick={() => onDateChange(p.start, p.end)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Vintage Selector & Data Provenance */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Vintage Segmented Control */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onVintageChange('DAY_AHEAD')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  vintage === 'DAY_AHEAD'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="True Day-Ahead forecast published on D-1 prior to delivery"
              >
                Day-Ahead (D-1)
              </button>
              <button
                onClick={() => onVintageChange('LATEST')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  vintage === 'LATEST'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Post-event latest revised forecast issued closest to delivery"
              >
                Latest Revised
              </button>
              <button
                onClick={() => onVintageChange('EARLIEST')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  vintage === 'EARLIEST'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Earliest publication 48-66h prior to delivery"
              >
                Earliest (D-2)
              </button>
            </div>

            {/* Source indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Elexon BMRS · Jan 2026</span>
              {health?.cache_ready && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-sans font-medium">
                  · Cached ({health.cached_records_count} sets)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer: Quiet copyright and regulatory disclaimers */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">WindLens</span> · GB Wind Energy Decision Support Platform · January 2026 Analysis Period
          </div>
          <div className="text-[11px] text-slate-400">
            Source data: Elexon Insights Solution (FUELHH & WINDFOR). Decision-support analytics; not automated trading advice.
          </div>
        </div>
      </footer>
    </div>
  );
};
