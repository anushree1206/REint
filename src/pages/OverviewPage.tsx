import React from 'react';
import { PeriodSummary, IntervalRecord, DeviationItem, InsightItem } from '../types';
import { KpiCard } from '../components/KpiCard';
import { GenerationComparisonChart } from '../components/GenerationComparisonChart';
import { ForecastErrorChart } from '../components/ForecastErrorChart';
import { InsightsPanel } from '../components/InsightsPanel';
import { ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface OverviewPageProps {
  summary: PeriodSummary;
  timeseries: IntervalRecord[];
  deviations: DeviationItem[];
  insights: InsightItem[];
  onNavigateToDeviations: () => void;
  onSelectInterval?: (record: IntervalRecord) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  timeseries,
  deviations,
  insights,
  onNavigateToDeviations,
  onSelectInterval,
}) => {
  const isOverforecast = summary.forecast_bias_mw > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          title="Actual Outturn"
          value={summary.total_actual_gwh.toFixed(1)}
          unit="GWh"
          subValue={`Mean: ${summary.mean_actual_mw.toLocaleString()} MW`}
          tooltip="Total metered GB transmission wind generation outturn (FUELHH) across matched delivery intervals."
        />

        <KpiCard
          title="Forecast Volume"
          value={summary.total_forecast_gwh.toFixed(1)}
          unit="GWh"
          subValue={`Mean: ${summary.mean_forecast_mw.toLocaleString()} MW`}
          tooltip="Total day-ahead forecast wind generation (WINDFOR) across matched delivery intervals."
        />

        <KpiCard
          title="Mean Abs Error (MAE)"
          value={summary.mae_mw.toLocaleString()}
          unit="MW"
          subValue={`RMSE: ${summary.rmse_mw.toLocaleString()} MW`}
          tooltip="Average magnitude of hourly forecast error |Forecast - Actual|. Reflects typical volume mismatch per hour."
        />

        <KpiCard
          title="Volume Error (WAPE)"
          value={summary.wape_pct.toFixed(1)}
          unit="%"
          subValue={summary.mape_pct ? `MAPE: ${summary.mape_pct.toFixed(1)}%` : undefined}
          tooltip="Weighted Absolute Percentage Error = sum(|Forecast - Actual|) / sum(Actual) * 100%. Avoids small-denominator distortion."
        />

        <KpiCard
          title="Forecast Bias"
          value={summary.forecast_bias_mw > 0 ? `+${summary.forecast_bias_mw.toLocaleString()}` : summary.forecast_bias_mw.toLocaleString()}
          unit="MW"
          trend={isOverforecast ? 'negative' : 'positive'}
          trendLabel={isOverforecast ? 'Overforecast (+)' : 'Underforecast (-)'}
          subValue={isOverforecast ? 'Shortfall exposure' : 'Surplus spill'}
          tooltip="Forecast minus Actual mean error. Positive (+) indicates systematic over-forecasting (actual generation was lower than expected, leaving buyers exposed to cashout shortfalls)."
        />

        <KpiCard
          title="Data Coverage"
          value={summary.data_coverage_pct.toFixed(1)}
          unit="%"
          subValue={`${summary.matched_intervals} / ${summary.total_expected_intervals} hrs`}
          trend="positive"
          trendLabel="100% Verified"
          tooltip="Proportion of expected hourly intervals with valid, certified Elexon settlement and forecast records."
        />
      </div>

      {/* Primary Timeseries Comparison Chart */}
      <GenerationComparisonChart
        data={timeseries}
        onSelectInterval={onSelectInterval}
      />

      {/* Forecast Error Delta Chart */}
      <ForecastErrorChart
        data={timeseries}
      />

      {/* Two-Column Section: Automated Rules & Top Deviations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Computed Rule-Based Insights (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Rule-Based Energy Analytics & Observations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic findings derived from January 2026 settlement data
              </p>
            </div>
          </div>
          <InsightsPanel insights={insights} />
        </div>

        {/* Right Column: Top Deviation Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Largest Deviation Events
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peak day-ahead forecast mismatches
              </p>
            </div>
            <button
              onClick={onNavigateToDeviations}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {deviations.slice(0, 5).map((item) => {
              const isOver = item.direction === 'OVERFORECAST';
              return (
                <div
                  key={`${item.timestamp}-${item.settlement_period}`}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.delivery_date} · {item.settlement_period_label}
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-0.5 ${
                        isOver ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {isOver ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.abs_error_mw.toLocaleString()} MW
                    </span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums text-slate-500 dark:text-slate-400 text-[11px] mb-1.5">
                    <span>Forecast: {item.forecast_mw.toLocaleString()} MW</span>
                    <span>Actual: {item.actual_mw.toLocaleString()} MW</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.context_reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
