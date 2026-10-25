export type ForecastVintage = 'DAY_AHEAD' | 'LATEST' | 'EARLIEST';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  cache_ready: boolean;
  cached_records_count: number;
  upstream_elexon_reachable: boolean;
  analysis_period: string;
}

export interface IntervalRecord {
  timestamp: string;
  delivery_date: string;
  hour: number;
  settlement_period: number;
  settlement_period_label: string;
  actual_mw: number | null;
  forecast_mw: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  pct_error: number | null;
  forecast_vintage: string;
  publish_time: string | null;
  is_low_wind: boolean;
}

export interface PeriodSummary {
  start_date: string;
  end_date: string;
  total_expected_intervals: number;
  matched_intervals: number;
  data_coverage_pct: number;
  missing_actual_intervals: number;
  missing_forecast_intervals: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  total_actual_gwh: number;
  total_forecast_gwh: number;
  peak_actual_mw: number;
  peak_actual_time: string;
  peak_forecast_mw: number;
  peak_forecast_time: string;
  mae_mw: number;
  rmse_mw: number;
  forecast_bias_mw: number;
  bias_direction: 'OVERFORECAST' | 'UNDERFORECAST' | 'NEUTRAL';
  mape_pct: number | null;
  mape_excluded_low_wind_count: number;
  wape_pct: number;
  max_overforecast_mw: number;
  max_overforecast_time: string;
  max_underforecast_mw: number;
  max_underforecast_time: string;
  forecast_vintage: string;
}

export interface DeviationItem {
  rank: number;
  timestamp: string;
  delivery_date: string;
  settlement_period: number;
  settlement_period_label: string;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
  abs_error_mw: number;
  pct_error: number | null;
  direction: 'OVERFORECAST' | 'UNDERFORECAST';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  context_reason: string;
  purchasing_implication: string;
}

export interface DailyAccuracyItem {
  date: string;
  actual_gwh: number;
  forecast_gwh: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  wape_pct: number;
  peak_actual_mw: number;
  peak_forecast_mw: number;
  max_abs_error_mw: number;
  matched_hours: number;
}

export interface DiurnalHourProfile {
  hour: number;
  time_label: string;
  actual_avg_mw: number;
  forecast_avg_mw: number;
  mae_mw: number;
  bias_mw: number;
  wape_pct: number;
}

export interface ErrorDistributionBin {
  bin_label: string;
  range_min: number;
  range_max: number;
  count: number;
  percentage: number;
}

export interface ForecastAccuracyResponse {
  summary: PeriodSummary;
  daily_accuracy: DailyAccuracyItem[];
  diurnal_profile: DiurnalHourProfile[];
  error_distribution: ErrorDistributionBin[];
}

export interface InsightItem {
  id: string;
  category: 'BIAS' | 'VOLATILITY' | 'DIURNAL' | 'PURCHASING_RISK' | 'DATA_QUALITY';
  title: string;
  summary: string;
  supporting_metrics: Record<string, any>;
  actionable_takeaway: string;
}

export interface PlaybookRule {
  rule: string;
  condition: string;
  recommendation: string;
}

export interface InsightsResponse {
  start_date: string;
  end_date: string;
  generated_at: string;
  insights: InsightItem[];
  purchasing_playbook: PlaybookRule[];
}
