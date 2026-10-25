import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DiurnalHourProfile } from '../types';

interface DiurnalProfileChartProps {
  data: DiurnalHourProfile[];
}

export const DiurnalProfileChart: React.FC<DiurnalProfileChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Diurnal Profile: 24-Hour Mean Outturn vs. Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hourly generation averages and MAE across all January 2026 days (highlighting peak hours 16:00–20:00 UTC)
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis
              dataKey="time_label"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DiurnalHourProfile;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs backdrop-blur-xs border border-slate-700 min-w-[200px]">
                      <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-2">
                        Hour {d.time_label} UTC
                      </div>
                      <div className="space-y-1 font-mono tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg Actual:</span>
                          <span className="text-emerald-400">{d.actual_avg_mw.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg Forecast:</span>
                          <span className="text-blue-400">{d.forecast_avg_mw.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mean Abs Error:</span>
                          <span className="text-amber-400">{d.mae_mw.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hour WAPE:</span>
                          <span className="text-slate-300">{d.wape_pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />
            <Bar
              yAxisId="left"
              dataKey="actual_avg_mw"
              fill="#059669"
              opacity={0.8}
              name="Avg Actual (MW)"
            />
            <Bar
              yAxisId="left"
              dataKey="forecast_avg_mw"
              fill="#2563EB"
              opacity={0.7}
              name="Avg Forecast (MW)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mae_mw"
              stroke="#D97706"
              strokeWidth={2}
              dot={{ r: 2.5 }}
              name="Hour MAE (MW)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
