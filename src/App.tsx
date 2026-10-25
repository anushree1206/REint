import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from './components/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { DeviationsPage } from './pages/DeviationsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { LoadingSkeleton, ErrorState } from './components/LoadingSkeleton';
import { apiClient } from './api/client';
import {
  PeriodSummary,
  IntervalRecord,
  DeviationItem,
  ForecastAccuracyResponse,
  InsightItem,
  PlaybookRule,
  ForecastVintage,
  HealthResponse,
} from './types';
import { X, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accuracy' | 'deviations' | 'methodology'>('overview');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [vintage, setVintage] = useState<ForecastVintage>('DAY_AHEAD');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [timeseries, setTimeseries] = useState<IntervalRecord[]>([]);
  const [deviations, setDeviations] = useState<DeviationItem[]>([]);
  const [accuracyData, setAccuracyData] = useState<ForecastAccuracyResponse | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [playbook, setPlaybook] = useState<PlaybookRule[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const [selectedInterval, setSelectedInterval] = useState<IntervalRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetch from backend API
      const [
        summaryRes,
        timeseriesRes,
        accuracyRes,
        deviationsRes,
        insightsRes,
        healthRes,
      ] = await Promise.all([
        apiClient.getSummary(startDate, endDate, vintage),
        apiClient.getTimeseries(startDate, endDate, undefined, vintage),
        apiClient.getForecastAccuracy(startDate, endDate, vintage),
        apiClient.getDeviations(startDate, endDate, 15, vintage),
        apiClient.getInsights(startDate, endDate, vintage),
        apiClient.getHealth().catch(() => null),
      ]);

      setSummary(summaryRes);
      setTimeseries(timeseriesRes);
      setAccuracyData(accuracyRes);
      setDeviations(deviationsRes);
      setInsights(insightsRes.insights);
      setPlaybook(insightsRes.purchasing_playbook);
      setHealth(healthRes);
    } catch (err: any) {
      console.error('Failed to load wind data:', err);
      setError(err?.message || 'Failed to connect to analytics backend.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, vintage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedDate(null);
  };

  const handleSelectDailyDate = (date: string) => {
    setSelectedDate(date);
    // User clicked a day in the ledger table: switch to overview filtered or view that day
    setStartDate(date);
    setEndDate(date);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      startDate={startDate}
      endDate={endDate}
      onDateChange={handleDateChange}
      vintage={vintage}
      onVintageChange={setVintage}
      onRefresh={loadData}
      isLoading={isLoading}
      health={health}
    >
      {isLoading && !summary ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : summary && accuracyData ? (
        <>
          {activeTab === 'overview' && (
            <OverviewPage
              summary={summary}
              timeseries={timeseries}
              deviations={deviations}
              insights={insights}
              onNavigateToDeviations={() => setActiveTab('deviations')}
              onSelectInterval={setSelectedInterval}
            />
          )}

          {activeTab === 'accuracy' && (
            <AccuracyPage
              accuracyData={accuracyData}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDailyDate}
            />
          )}

          {activeTab === 'deviations' && (
            <DeviationsPage
              deviations={deviations}
              playbook={playbook}
              onSelectDeviation={(item) => {
                // Find matching interval record
                const match = timeseries.find(
                  (t) =>
                    t.delivery_date === item.delivery_date &&
                    t.settlement_period === item.settlement_period
                );
                if (match) setSelectedInterval(match);
              }}
            />
          )}

          {activeTab === 'methodology' && <MethodologyPage />}
        </>
      ) : null}

      {/* Interval Inspection Modal */}
      {selectedInterval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedInterval(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{selectedInterval.delivery_date} · {selectedInterval.settlement_period_label}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Interval Settlement Deep-Dive
            </h3>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 mb-4 font-mono tabular-nums text-xs">
              <div>
                <span className="text-[11px] font-sans text-slate-500 block">Actual Outturn</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedInterval.actual_mw ? `${selectedInterval.actual_mw.toLocaleString()} MW` : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-sans text-slate-500 block">Forecast Generation</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedInterval.forecast_mw ? `${selectedInterval.forecast_mw.toLocaleString()} MW` : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-sans text-slate-500 block">Forecast Error (Signed)</span>
                <span
                  className={`text-base font-bold ${
                    (selectedInterval.error_mw ?? 0) > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {(selectedInterval.error_mw ?? 0) > 0 ? '+' : ''}
                  {selectedInterval.error_mw ? selectedInterval.error_mw.toLocaleString() : 'N/A'} MW
                </span>
              </div>

              <div>
                <span className="text-[11px] font-sans text-slate-500 block">Relative Percentage Error</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {selectedInterval.pct_error !== null ? `${selectedInterval.pct_error > 0 ? '+' : ''}${selectedInterval.pct_error}%` : 'Filtered (<100MW)'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Vintage Information:
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Evaluated under <strong>{selectedInterval.forecast_vintage}</strong> vintage.
                  {selectedInterval.publish_time && ` Published by NESO at: ${selectedInterval.publish_time}.`}
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/40">
                <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Purchasing Risk Assessment:</span>
                </span>
                <p className="text-amber-900/90 dark:text-amber-200/90">
                  {(selectedInterval.error_mw ?? 0) > 0
                    ? `Overforecast of ${Math.abs(selectedInterval.error_mw ?? 0).toLocaleString()} MW. A buyer hedging 100% of this wind forecast would have faced physical energy shortfall, subject to System Buy Price cashout settlement.`
                    : `Underforecast of ${Math.abs(selectedInterval.error_mw ?? 0).toLocaleString()} MW. Surplus wind outturn would spill into balancing cashout at System Sell Price.`}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedInterval(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
