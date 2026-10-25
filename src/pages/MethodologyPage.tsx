import React from 'react';
import { Database, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Compass } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Elexon Insights API Data Architecture & Provenance
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          WindLens acquires real-time and historical GB power balancing data directly from the official <strong>Elexon Insights Solution API</strong> (formerly BMRS), operated by Elexon and the National Energy System Operator (NESO).
          All data analyzed in this platform covers <strong>1 January 2026 00:00:00 UTC through 31 January 2026 23:59:59 UTC</strong> inclusive.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[11px] font-sans">Actual Outturn Dataset</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">FUELHH (fuelType: WIND)</span>
            <span className="text-slate-500 block text-[11px] mt-1 font-sans">
              48 half-hour settlement periods per day · Units: Megawatts (MW) active power.
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[11px] font-sans">Forecast Generation Dataset</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">WINDFOR (National Grid / NESO)</span>
            <span className="text-slate-500 block text-[11px] mt-1 font-sans">
              Hourly resolution (24 points/day) · Published up to 8 times daily · Units: MW.
            </span>
          </div>
        </div>
      </div>

      {/* Interval Harmonization & Temporal Alignment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Compass className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Interval Harmonization & Physical Matching Logic
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Because outturn generation (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">FUELHH</code>) is published at 30-minute settlement period resolution while NESO wind forecasts (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">WINDFOR</code>) are produced at 1-hour resolution on odd settlement periods (SP 1, 3, 5, ..., 47), direct comparison requires rigorous aggregation:
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-center text-xs text-slate-800 dark:text-slate-200">
            Actual_Hour = ( Generation(SP_odd) + Generation(SP_even) ) / 2
          </div>

          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Example:</strong> Hour 00:00–01:00 UTC (SP 1) is matched with the arithmetic mean of settlement period 1 (00:00–00:30) and settlement period 2 (00:30–01:00).</li>
            <li><strong>Units & Energy Equivalence:</strong> Both series represent average power in Megawatts (MW). Integrated over 1 hour, 1 MW = 1 Megawatt-hour (MWh) of physical electrical energy.</li>
            <li><strong>Timezone:</strong> Universal Coordinated Time (UTC). In January, Great Britain operates on Greenwich Mean Time (GMT, UTC+00:00). No daylight saving adjustments took place.</li>
            <li><strong>Missing Data Integrity:</strong> If records are absent, intervals remain <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">null / NaN</code>. Missing records are <em>never</em> silently converted to zero.</li>
          </ul>
        </div>
      </div>

      {/* Forecast Horizons & Look-Ahead Bias Prevention */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Scale className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Forecast Horizons & Vintage Governance
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            In European and GB wholesale power markets, the day-ahead auction (EPEX SPOT / Nord Pool) closes at 11:00–12:00 UTC on day <strong>D-1</strong> for physical delivery on day <strong>D</strong>.
            A valid day-ahead decision support tool must strictly avoid look-ahead bias:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                Day-Ahead Vintage (Primary)
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Issued on day D-1 before the delivery day commenced (published prior to 23:59:59 UTC on D-1). Genuinely available at the time day-ahead procurement decisions were executed.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                Latest Revised Vintage
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                The final updated forecast issued closest to (or during) delivery. Disclosed to analyze how forecast accuracy converged as the delivery period drew near.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                Earliest Vintage (D-2)
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                The initial forecast run published 48–66 hours prior to delivery. Shows medium-term predictability and initial desk planning baselines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations & Low-Wind Policy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Analytical Formulas & Zero-Denominator Policy
          </h3>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                1. Forecast Error (Signed)
              </h4>
              <p className="font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded text-[11px]">
                Error_t = Forecast_t - Actual_t
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Positive (+): Overforecast (wind deficit). Negative (&minus;): Underforecast (excess wind).
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                2. Mean Absolute Error (MAE)
              </h4>
              <p className="font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded text-[11px]">
                MAE = (1/N) * &sum; |Forecast_t - Actual_t|
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Linear penalty representing expected volumetric balancing exposure per delivery hour.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                3. Root Mean Squared Error (RMSE)
              </h4>
              <p className="font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded text-[11px]">
                RMSE = sqrt( (1/N) * &sum; (Forecast_t - Actual_t)&sup2; )
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Quadratic penalty that exposes tail risk from severe ramp timing and meteorological front misses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                4. Weighted Absolute Pct Error (WAPE)
              </h4>
              <p className="font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded text-[11px]">
                WAPE = ( &sum; |Forecast_t - Actual_t| / &sum; Actual_t ) * 100%
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Robust energy-weighted percentage error unaffected by periods of low wind output.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
              Zero & Near-Zero Generation MAPE Policy:
            </h4>
            <p className="text-amber-950/80 dark:text-amber-200/80 text-[11px]">
              When actual generation drops below 100 MW (calm weather periods), the conventional MAPE formula yields mathematical singularities (division by near-zero) or distorted figures exceeding 10,000%.
              In WindLens, any interval where <code className="font-mono">Actual &lt; 100 MW</code> is strictly excluded from MAPE calculations, and the number of excluded intervals is explicitly tracked in data quality reports.
            </p>
          </div>
        </div>
      </div>

      {/* Explicit Boundaries & Known Limitations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Operational Boundaries & Regulatory Disclaimers
          </h3>
        </div>

        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc pl-5">
          <li>
            <strong>Transmission vs Embedded Wind:</strong> Elexon's <code className="font-mono">FUELHH</code> captures centrally metered, transmission-connected wind farms. Embedded distribution-connected wind is largely treated as negative demand by the system operator.
          </li>
          <li>
            <strong>Decision Support, Not Guaranteed P&amp;L:</strong> All purchasing implications describe directional risk exposures (e.g. exposure to cashout / System Buy Price / System Sell Price). They do not constitute financial advice or guarantee trading profits, as cash settlement depends on contemporaneous market demand, interconnectors, and Balancing Mechanism bid-offer cash flows.
          </li>
          <li>
            <strong>Verification & Authenticity:</strong> Zero synthetic, mock, or random values are used in this application. All 744 hourly intervals represent authentic Elexon settlement records for January 2026.
          </li>
        </ul>
      </div>
    </div>
  );
};
