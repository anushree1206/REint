import React, { useState, useMemo } from 'react';
import { DeviationItem, PlaybookRule } from '../types';
import { DeviationCardList } from '../components/DeviationCardList';
import { PurchasingPlaybook } from '../components/PurchasingPlaybook';
import { Filter, Scale, AlertOctagon } from 'lucide-react';

interface DeviationsPageProps {
  deviations: DeviationItem[];
  playbook: PlaybookRule[];
  onSelectDeviation?: (item: DeviationItem) => void;
}

export const DeviationsPage: React.FC<DeviationsPageProps> = ({
  deviations,
  playbook,
  onSelectDeviation,
}) => {
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'OVERFORECAST' | 'UNDERFORECAST'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');

  const filteredDeviations = useMemo(() => {
    return deviations.filter((d) => {
      if (directionFilter !== 'ALL' && d.direction !== directionFilter) return false;
      if (severityFilter !== 'ALL' && d.severity !== severityFilter) return false;
      return true;
    });
  }, [deviations, directionFilter, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Top Section: Playbook & Asymmetry Framework */}
      <PurchasingPlaybook playbook={playbook} />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Ranked Day-Ahead Forecast Deviations</span>
          <span className="text-slate-400 font-mono font-normal">
            ({filteredDeviations.length} events displayed)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Direction Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDirectionFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                directionFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDirectionFilter('OVERFORECAST')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                directionFilter === 'OVERFORECAST'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Overforecasts
            </button>
            <button
              onClick={() => setDirectionFilter('UNDERFORECAST')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                directionFilter === 'UNDERFORECAST'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Underforecasts
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                severityFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Severity
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                severityFilter === 'CRITICAL'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Critical (&ge;4k MW)
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                severityFilter === 'HIGH'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              High (&ge;2.5k MW)
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <DeviationCardList
        deviations={filteredDeviations}
        onSelectDeviation={onSelectDeviation}
      />
    </div>
  );
};
