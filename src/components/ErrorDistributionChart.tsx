import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ErrorDistributionBin } from '../types';

interface ErrorDistributionChartProps {
  data: ErrorDistributionBin[];
}

export const ErrorDistributionChart: React.FC<ErrorDistributionChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Forecast Error Distribution (MW Bins)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Histogram of interval forecast errors (Forecast minus Actual) across January 2026
        </p>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis
              dataKey="bin_label"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fontSize: 10, fill: '#64748B' }}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const b = payload[0].payload as ErrorDistributionBin;
                  return (
                    <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl text-xs backdrop-blur-xs border border-slate-700">
                      <div className="font-semibold text-slate-200 mb-1">{b.bin_label}</div>
                      <div className="font-mono tabular-nums">
                        <div>Interval Count: <span className="font-bold text-emerald-400">{b.count}</span></div>
                        <div>Share of Month: <span className="text-blue-300">{b.percentage}%</span></div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" isAnimationActive={false}>
              {data.map((entry, index) => {
                const isOver = entry.range_min >= 0;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isOver ? '#F59E0B' : '#8B5CF6'}
                    opacity={0.8}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
