import React from 'react';
import { ForecastAccuracyResponse } from '../types';
import { DailyAccuracyTable } from '../components/DailyAccuracyTable';
import { DiurnalProfileChart } from '../components/DiurnalProfileChart';
import { ErrorDistributionChart } from '../components/ErrorDistributionChart';
import { KpiCard } from '../components/KpiCard';
import { HelpCircle, BarChart2, Clock, Calendar } from 'lucide-react';

interface AccuracyPageProps {
  accuracyData: ForecastAccuracyResponse;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

export const AccuracyPage: React.FC<AccuracyPageProps> = ({
  accuracyData,
  selectedDate,
  onSelectDate,
}) => {
  const { summary, daily_accuracy, diurnal_profile, error_distribution } = accuracyData;

  return (
    <div className="space-y-6">
      {/* Metrics Header Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <KpiCard
          title="Mean Absolute Error (MAE)"
          value={summary.mae_mw.toLocaleString()}
          unit="MW"
          subValue="Linear volume delta"
          tooltip="Average absolute error between forecast and actual over every delivery hour."
        />

        <KpiCard
          title="Root Mean Square Error (RMSE)"
          value={summary.rmse_mw.toLocaleString()}
          unit="MW"
          subValue="Penalizes large outlier spikes"
          tooltip="Quadratic error metric that heavily penalizes large forecast blunders."
        />

        <KpiCard
          title="Volume Error (WAPE)"
          value={summary.wape_pct.toFixed(1)}
          unit="%"
          subValue={`MAPE: ${summary.mape_pct ? `${summary.mape_pct.toFixed(1)}%` : 'N/A'}`}
          tooltip="Weighted Absolute Percentage Error = sum(|error|) / sum(actual) * 100%. Unaffected by low-wind denominators."
        />

        <KpiCard
          title="Net Monthly Bias"
          value={summary.forecast_bias_mw > 0 ? `+${summary.forecast_bias_mw.toLocaleString()}` : summary.forecast_bias_mw.toLocaleString()}
          unit="MW"
          trend={summary.forecast_bias_mw > 0 ? 'negative' : 'positive'}
          trendLabel={summary.forecast_bias_mw > 0 ? 'Overforecast (+)' : 'Underforecast (-)'}
          subValue="Systematic directional tilt"
          tooltip="Positive bias means forecasts consistently exceeded reality."
        />
      </div>

      {/* Accuracy Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Diurnal Profile (24-hour cycle) */}
        <DiurnalProfileChart data={diurnal_profile} />

        {/* Error Distribution Histogram */}
        <ErrorDistributionChart data={error_distribution} />
      </div>

      {/* Daily Ledger Table */}
      <DailyAccuracyTable
        data={daily_accuracy}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      {/* Metrics Glossary for Energy Buyers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Energy Market Accuracy Metric Guide
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
              MAE vs. RMSE
            </h4>
            <p>
              <strong>MAE</strong> represents expected physical volume deviation per hour for hedging.
              <strong> RMSE</strong> squares errors before averaging, making it the preferred gauge for extreme tail risks (e.g. unexpected ramps or high-wind storm trip-offs).
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
              WAPE vs. MAPE Policy
            </h4>
            <p>
              Standard <strong>MAPE</strong> breaks down when actual wind drops below 100 MW (dividing by near-zero gives 10,000%+ errors).
              We enforce an explicit &ge;100 MW filter for MAPE and provide <strong>WAPE</strong>, which weights errors by true generation volume.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
              Sign Convention of Bias
            </h4>
            <p>
              We define <strong>Error = Forecast &minus; Actual</strong>.
              A positive bias (+MW) means forecasts exceeded actuals, creating a generation deficit risk. A negative bias (&minus;MW) means wind exceeded expectations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
