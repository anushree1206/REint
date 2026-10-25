import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Info } from 'lucide-react';
import { DeviationItem } from '../types';

interface DeviationCardListProps {
  deviations: DeviationItem[];
  onSelectDeviation?: (item: DeviationItem) => void;
}

export const DeviationCardList: React.FC<DeviationCardListProps> = ({
  deviations,
  onSelectDeviation,
}) => {
  return (
    <div className="space-y-3.5">
      {deviations.map((item) => {
        const isOver = item.direction === 'OVERFORECAST';
        const isCritical = item.severity === 'CRITICAL';

        return (
          <div
            key={`${item.timestamp}-${item.settlement_period}`}
            onClick={() => onSelectDeviation && onSelectDeviation(item)}
            className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs transition-all cursor-pointer ${
              isCritical
                ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {/* Header: Rank, Time, Severity, Direction */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                  #{item.rank}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {item.delivery_date} · {item.settlement_period_label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isOver ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {isOver ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {isOver ? 'Overforecast' : 'Underforecast'}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span
                  className={`font-semibold ${
                    isCritical
                      ? 'text-rose-600 dark:text-rose-400'
                      : item.severity === 'HIGH'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.severity} Severity
                </span>
              </div>
            </div>

            {/* Metric Comparison Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3.5 font-mono tabular-nums text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Forecast Wind
                </span>
                <span className="text-base font-bold text-blue-700 dark:text-blue-400">
                  {item.forecast_mw.toLocaleString()} MW
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Actual Outturn
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {item.actual_mw.toLocaleString()} MW
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Absolute Deviation
                </span>
                <span
                  className={`text-base font-bold ${
                    isOver ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {item.abs_error_mw.toLocaleString()} MW
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Relative Error
                </span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {item.pct_error !== null ? `${item.pct_error > 0 ? '+' : ''}${item.pct_error}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Two-Column Facts vs. Interpretation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Observed Physical Context</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.context_reason}
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Purchasing Implication (Decision Support)</span>
                </div>
                <p className="text-amber-900/90 dark:text-amber-200/90">
                  {item.purchasing_implication}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
