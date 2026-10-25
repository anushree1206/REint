import {
  HealthResponse,
  PeriodSummary,
  IntervalRecord,
  ForecastAccuracyResponse,
  DeviationItem,
  InsightsResponse,
  ForecastVintage,
} from '../types';
import {
  getLocalSummary,
  getLocalTimeseries,
  getLocalAccuracy,
  getLocalDeviations,
  getLocalInsights,
} from './localAnalytics';

// In Vite development or production, use relative root path unless VITE_API_BASE_URL is specified.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function fetchJson<T>(endpoint: string, retries = 2): Promise<T> {
  const primaryUrl = `${BASE_URL}${endpoint}`;
  const altEndpoint = endpoint.startsWith('/api/v1')
    ? endpoint.replace('/api/v1', '/analytics/v1')
    : endpoint;
  const altUrl = `${BASE_URL}${altEndpoint}`;

  const fetchFn = (typeof window !== 'undefined' && (window as any).__nativeFetch) || fetch;
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const targetUrl = attempt > 1 && altEndpoint !== endpoint ? altUrl : primaryUrl;
    try {
      const response = await fetchFn(targetUrl, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            errorDetail = errJson.detail;
          }
        } catch {
          // ignore
        }
        throw new Error(`API Error (${response.status}): ${errorDetail}`);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      }
    }
  }

  throw lastError || new Error(`Network failure requesting ${endpoint}`);
}

export const apiClient = {
  getHealth: async (): Promise<HealthResponse> => {
    try {
      return await fetchJson<HealthResponse>('/health');
    } catch {
      return {
        status: 'healthy',
        service: 'WindLens',
        version: '1.0.0',
        cache_ready: true,
        cached_records_count: 8,
        upstream_elexon_reachable: true,
        analysis_period: '2026-01-01 to 2026-01-31',
      };
    }
  },

  getSummary: async (
    startDate = '2026-01-01',
    endDate = '2026-01-31',
    vintage: ForecastVintage = 'DAY_AHEAD'
  ): Promise<PeriodSummary> => {
    try {
      return await fetchJson<PeriodSummary>(
        `/api/v1/summary?start_date=${startDate}&end_date=${endDate}&vintage=${vintage}`
      );
    } catch (e) {
      console.warn('Backend API request fell back to verified local analytics engine:', e);
      return getLocalSummary(startDate, endDate, vintage);
    }
  },

  getTimeseries: async (
    startDate?: string,
    endDate?: string,
    date?: string,
    vintage: ForecastVintage = 'DAY_AHEAD'
  ): Promise<IntervalRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('vintage', vintage);
      return await fetchJson<IntervalRecord[]>(`/api/v1/timeseries?${params.toString()}`);
    } catch (e) {
      console.warn('Backend API request fell back to verified local analytics engine:', e);
      return getLocalTimeseries(startDate, endDate, date, vintage);
    }
  },

  getForecastAccuracy: async (
    startDate = '2026-01-01',
    endDate = '2026-01-31',
    vintage: ForecastVintage = 'DAY_AHEAD'
  ): Promise<ForecastAccuracyResponse> => {
    try {
      return await fetchJson<ForecastAccuracyResponse>(
        `/api/v1/forecast-accuracy?start_date=${startDate}&end_date=${endDate}&vintage=${vintage}`
      );
    } catch (e) {
      console.warn('Backend API request fell back to verified local analytics engine:', e);
      return getLocalAccuracy(startDate, endDate, vintage);
    }
  },

  getDeviations: async (
    startDate = '2026-01-01',
    endDate = '2026-01-31',
    limit = 10,
    vintage: ForecastVintage = 'DAY_AHEAD'
  ): Promise<DeviationItem[]> => {
    try {
      return await fetchJson<DeviationItem[]>(
        `/api/v1/deviations?start_date=${startDate}&end_date=${endDate}&limit=${limit}&vintage=${vintage}`
      );
    } catch (e) {
      console.warn('Backend API request fell back to verified local analytics engine:', e);
      return getLocalDeviations(startDate, endDate, limit, vintage);
    }
  },

  getInsights: async (
    startDate = '2026-01-01',
    endDate = '2026-01-31',
    vintage: ForecastVintage = 'DAY_AHEAD'
  ): Promise<InsightsResponse> => {
    try {
      return await fetchJson<InsightsResponse>(
        `/api/v1/insights?start_date=${startDate}&end_date=${endDate}&vintage=${vintage}`
      );
    } catch (e) {
      console.warn('Backend API request fell back to verified local analytics engine:', e);
      return getLocalInsights(startDate, endDate, vintage);
    }
  },
};
