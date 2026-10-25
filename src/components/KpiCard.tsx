import React from 'react';
import { HelpCircle } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  tooltip?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  trendLabel?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subValue,
  tooltip,
  trend,
  trendLabel,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {tooltip && (
          <div className="group relative flex items-center cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            <div className="absolute right-0 bottom-full mb-2 hidden w-64 p-2 text-xs text-slate-100 bg-slate-900/95 dark:bg-slate-800 rounded-lg shadow-xl group-hover:block z-50 pointer-events-none backdrop-blur-xs">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {(subValue || trendLabel) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trendLabel && (
            <span
              className={`font-medium ${
                trend === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {trendLabel}
            </span>
          )}
          {subValue && (
            <span className="text-slate-500 dark:text-slate-400">
              {trendLabel ? '· ' : ''}
              {subValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
