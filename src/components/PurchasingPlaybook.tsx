import React from 'react';
import { PlaybookRule } from '../types';
import { BookOpen, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';

interface PurchasingPlaybookProps {
  playbook: PlaybookRule[];
}

export const PurchasingPlaybook: React.FC<PurchasingPlaybookProps> = ({ playbook }) => {
  return (
    <div className="space-y-6">
      {/* Asymmetric Risk Explainer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Scale className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            The Asymmetry of Day-Ahead Wind Forecast Deviations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Overforecast Risk (Wind Deficit)</span>
            </h4>
            <p className="text-amber-950/80 dark:text-amber-200/80 mb-2">
              When forecast wind exceeds outturn, buyers under-contract alternative generation in the day-ahead auction.
            </p>
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              <div><strong>Operational impact:</strong> Desk is left short into delivery.</div>
              <div><strong>Market consequence:</strong> Energy must be settled at cashout (System Buy Price) or covered through emergency intra-day peaker dispatch. In winter peak hours, SBP spikes sharply above day-ahead wholesale.</div>
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1.5">
              <Scale className="w-4 h-4 text-purple-600" />
              <span>Underforecast Risk (Excess Wind Spill)</span>
            </h4>
            <p className="text-purple-950/80 dark:text-purple-200/80 mb-2">
              When outturn exceeds forecast, buyers who hedged replacement power face long physical positions.
            </p>
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              <div><strong>Operational impact:</strong> Desk is left long into delivery.</div>
              <div><strong>Market consequence:</strong> Uncontracted surplus spills into balancing settlement at System Sell Price. During windy off-peak hours, SSP can compress near zero or turn negative, triggering cash losses on surplus.</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <strong>Important Analytical Boundary:</strong> Generation forecast errors do not determine wholesale prices in isolation. Actual financial outturns depend on contemporaneous system demand, transmission constraints, interconnectors, and bid-offer spreads in the Balancing Mechanism.
        </div>
      </div>

      {/* Structured Playbook Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Day-Ahead Hedging Playbook (Rule-Based Framework)
          </h3>
        </div>

        <div className="space-y-3">
          {playbook.map((rule, idx) => (
            <div
              key={idx}
              className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {rule.rule}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Rule {idx + 1}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Trigger Condition: </span>
                  {rule.condition}
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Action: </span>
                  {rule.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
