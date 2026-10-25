import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { IntervalRecord } from '../types';

interface ForecastErrorChartProps {
  data: IntervalRecord[];
  title?: string;
}

export const ForecastErrorChart: React.FC<ForecastErrorChartProps> = ({
  data,
  title = 'Forecast Deviation Spread (Forecast minus Actual, MW)',
}) => {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayTime: d.timestamp.slice(5, 16).replace('T', ' '),
      errorVal: d.error_mw ?? 0,
    }));
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Positive = Overforecast (wind deficit risk) · Negative = Underforecast (excess wind spill)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
            <span>Overforecast (+)</span>
          </span>
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-xs" />
            <span>Underforecast (-)</span>
          </span>
        </div>
      </div>

      <div className="h-[220px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No deviation records available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.6} />
              <XAxis
                dataKey="displayTime"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fontSize: 10, fill: '#64748B' }}
                interval={Math.max(1, Math.floor(chartData.length / 10))}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                width={50}
              />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as IntervalRecord & { displayTime: string };
                    const err = row.error_mw ?? 0;
                    return (
                      <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl text-xs backdrop-blur-xs border border-slate-700 min-w-[180px]">
                        <div className="font-semibold text-slate-200 mb-1">
                          {row.delivery_date} · {row.settlement_period_label}
                        </div>
                        <div className="flex justify-between font-mono tabular-nums">
                          <span className="text-slate-400">Error:</span>
                          <span className={`font-bold ${err > 0 ? 'text-amber-400' : 'text-purple-400'}`}>
                            {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                          </span>
                        </div>
                        {row.pct_error !== null && (
                          <div className="flex justify-between font-mono tabular-nums text-slate-300">
                            <span className="text-slate-400">Pct Error:</span>
                            <span>{row.pct_error > 0 ? `+${row.pct_error}%` : `${row.pct_error}%`}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="errorVal" isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.errorVal >= 0 ? '#F59E0B' : '#8B5CF6'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
