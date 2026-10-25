import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DailyAccuracyItem } from '../types';

interface DailyAccuracyTableProps {
  data: DailyAccuracyItem[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

type SortField = 'date' | 'actual_gwh' | 'forecast_gwh' | 'mae_mw' | 'rmse_mw' | 'bias_mw' | 'wape_pct' | 'max_abs_error_mw';

export const DailyAccuracyTable: React.FC<DailyAccuracyTableProps> = ({
  data,
  selectedDate,
  onSelectDate,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'date');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let av: any = a[sortField];
      let bv: any = b[sortField];
      if (typeof av === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? av - bv : bv - av;
    });
  }, [data, sortField, sortAsc]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-slate-900 dark:text-white" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-900 dark:text-white" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Daily Accuracy & Volume Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any row to inspect hourly outturn and forecast profile for that delivery date
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {data.length} delivery days recorded
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold select-none">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleSort('actual_gwh')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Actual GWh</span>
                  {renderSortIcon('actual_gwh')}
                </div>
              </th>
              <th
                onClick={() => handleSort('forecast_gwh')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Forecast GWh</span>
                  {renderSortIcon('forecast_gwh')}
                </div>
              </th>
              <th
                onClick={() => handleSort('mae_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>MAE (MW)</span>
                  {renderSortIcon('mae_mw')}
                </div>
              </th>
              <th
                onClick={() => handleSort('rmse_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>RMSE (MW)</span>
                  {renderSortIcon('rmse_mw')}
                </div>
              </th>
              <th
                onClick={() => handleSort('bias_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Bias (MW)</span>
                  {renderSortIcon('bias_mw')}
                </div>
              </th>
              <th
                onClick={() => handleSort('wape_pct')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>WAPE %</span>
                  {renderSortIcon('wape_pct')}
                </div>
              </th>
              <th
                onClick={() => handleSort('max_abs_error_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Peak Deviation</span>
                  {renderSortIcon('max_abs_error_mw')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
            {sortedData.map((row) => {
              const isSelected = selectedDate === row.date;
              const isOver = row.bias_mw > 0;
              return (
                <tr
                  key={row.date}
                  onClick={() => onSelectDate && onSelectDate(row.date)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-4 font-sans font-medium whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 dark:text-emerald-400">
                    {row.actual_gwh.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-blue-700 dark:text-blue-400">
                    {row.forecast_gwh.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">
                    {row.mae_mw.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500 dark:text-slate-400">
                    {row.rmse_mw.toLocaleString()}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-medium ${
                      isOver ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {row.bias_mw > 0 ? `+${row.bias_mw.toLocaleString()}` : row.bias_mw.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        row.wape_pct > 25
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : row.wape_pct > 15
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      {row.wape_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900 dark:text-slate-100 font-semibold">
                    {row.max_abs_error_mw.toLocaleString()} MW
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
