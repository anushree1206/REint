import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
} from 'recharts';
import { IntervalRecord } from '../types';

interface GenerationComparisonChartProps {
  data: IntervalRecord[];
  title?: string;
  subtitle?: string;
  onSelectInterval?: (record: IntervalRecord) => void;
}

export const GenerationComparisonChart: React.FC<GenerationComparisonChartProps> = ({
  data,
  title = 'Wind Generation: Actual Outturn vs. Day-Ahead Forecast',
  subtitle = 'Hourly settlement periods across Great Britain transmission grid (MW)',
  onSelectInterval,
}) => {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayTime: d.timestamp.slice(5, 16).replace('T', ' '),
      shortTime: d.timestamp.slice(11, 16),
      dateStr: d.delivery_date,
    }));
  }, [data]);

  const maxVal = useMemo(() => {
    let max = 0;
    for (const d of data) {
      if (d.actual_mw && d.actual_mw > max) max = d.actual_mw;
      if (d.forecast_mw && d.forecast_mw > max) max = d.forecast_mw;
    }
    return Math.ceil((max + 2000) / 2000) * 2000;
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 rounded-full inline-block" />
            <span>Actual Outturn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 border-dashed inline-block" />
            <span>Forecast</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No timeseries intervals match current filter
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onSelectInterval) {
                  onSelectInterval(e.activePayload[0].payload as IntervalRecord);
                }
              }}
            >
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                strokeOpacity={0.6}
              />

              <XAxis
                dataKey="displayTime"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={Math.max(1, Math.floor(chartData.length / 12))}
              />

              <YAxis
                domain={[0, maxVal || 24000]}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
                width={65}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as IntervalRecord & { displayTime: string };
                    const err = row.error_mw ?? 0;
                    const isOver = err > 0;
                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs backdrop-blur-xs border border-slate-700 min-w-[210px]">
                        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-2">
                          {row.delivery_date} · {row.settlement_period_label}
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 font-mono tabular-nums">
                          <span className="text-slate-400">Actual Outturn:</span>
                          <span className="text-right font-medium text-emerald-400">
                            {row.actual_mw ? `${row.actual_mw.toLocaleString()} MW` : 'N/A'}
                          </span>

                          <span className="text-slate-400">Forecast:</span>
                          <span className="text-right font-medium text-blue-400">
                            {row.forecast_mw ? `${row.forecast_mw.toLocaleString()} MW` : 'N/A'}
                          </span>

                          <span className="text-slate-400">Deviation:</span>
                          <span
                            className={`text-right font-semibold ${
                              isOver ? 'text-amber-400' : 'text-purple-400'
                            }`}
                          >
                            {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                          </span>

                          {row.pct_error !== null && (
                            <>
                              <span className="text-slate-400">Error %:</span>
                              <span className="text-right text-slate-300">
                                {row.pct_error > 0 ? `+${row.pct_error}%` : `${row.pct_error}%`}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                          <span>Vintage: {row.forecast_vintage}</span>
                          <span>{isOver ? 'Overforecast' : 'Underforecast'}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="actual_mw"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#actualGradient)"
                name="Actual Outturn (MW)"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="forecast_mw"
                stroke="#2563EB"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Day-Ahead Forecast (MW)"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
