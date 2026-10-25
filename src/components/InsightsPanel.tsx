import React from 'react';
import { InsightItem } from '../types';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface InsightsPanelProps {
  insights: InsightItem[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'BIAS':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'VOLATILITY':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'DIURNAL':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'DATA_QUALITY':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Zap className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {insights.map((ins) => (
        <div
          key={ins.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(ins.category)}
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {ins.title}
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {ins.category}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {ins.summary}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 text-xs border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
              Day-Ahead Procurement Takeaway:
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-normal">
              {ins.actionable_takeaway}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
